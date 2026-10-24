use std::io::Read;
use std::process::{Command, Stdio};
use std::sync::Mutex;
use std::thread;
use std::time::{Duration, Instant};

const MAX_BYTES: usize = 64 * 1024;
static READING: Mutex<()> = Mutex::new(());

// Drain a bounded amount concurrently: waiting before reading can deadlock on a full pipe.
fn read_command(program: &str, args: &[&str], deadline: Duration) -> Result<String, String> {
    let mut child = Command::new(program)
        .args(args)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|err| format!("{program}: {err}"))?;
    let stdout = child.stdout.take().ok_or("Missing clipboard output")?;
    let reader = thread::spawn(move || {
        let mut bytes = Vec::new();
        stdout.take((MAX_BYTES + 1) as u64).read_to_end(&mut bytes).map(|_| bytes)
    });
    let started = Instant::now();
    let status = loop {
        match child.try_wait() {
            Ok(Some(status)) => break Ok(status),
            Ok(None) if started.elapsed() < deadline => thread::sleep(Duration::from_millis(10)),
            result => {
                let _ = child.kill();
                let _ = child.wait();
                break Err(match result {
                    Err(err) => err.to_string(),
                    _ => "Clipboard read timed out".to_string(),
                });
            }
        }
    };
    let bytes = reader.join().map_err(|_| "Clipboard reader failed")?
        .map_err(|err| err.to_string())?;
    let status = status?;
    if bytes.len() > MAX_BYTES {
        return Err("Clipboard text is too large".into());
    }
    if !status.success() {
        return Ok(String::new());
    }
    String::from_utf8(bytes).map(|text| text.trim().to_string()).map_err(|err| err.to_string())
}

pub fn read() -> Result<String, String> {
    let _guard = READING.try_lock().map_err(|_| "Clipboard read already in progress")?;
    // PRIMARY changes on selection alone. Ctrl+C uses CLIPBOARD; never mix the two.
    if std::env::var_os("WAYLAND_DISPLAY").is_some() {
        read_command("wl-paste", &["--no-newline", "--type", "text"], Duration::from_millis(800))
    } else {
        read_command("xclip", &["-selection", "clipboard", "-target", "UTF8_STRING", "-o"], Duration::from_millis(800))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reads_unicode_text() {
        assert_eq!(read_command("printf", &["  привіт  "], Duration::from_secs(1)).unwrap(), "привіт");
    }

    #[test]
    fn empty_clipboard_can_establish_a_baseline() {
        assert_eq!(read_command("false", &[], Duration::from_secs(1)).unwrap(), "");
    }

    #[test]
    fn terminates_stalled_provider() {
        let started = Instant::now();
        assert!(read_command("sleep", &["5"], Duration::from_millis(60)).is_err());
        assert!(started.elapsed() < Duration::from_secs(1));
    }

    #[test]
    fn rejects_large_and_binary_content() {
        assert!(read_command("head", &["-c", "1000000", "/dev/zero"], Duration::from_secs(1)).is_err());
        assert!(read_command("printf", &["\\377"], Duration::from_secs(1)).is_err());
    }
}

// Observe clipboard ownership changes, including copying identical text again.
// Do not register Ctrl+C globally: that would intercept copying in other apps.
pub fn watch(app: tauri::AppHandle) {
    use std::io::{BufRead, BufReader};
    use tauri::{Emitter, Manager};
    if std::env::var_os("WAYLAND_DISPLAY").is_none() { return; }
    let child = Command::new("wl-paste")
        .args(["--type", "text", "--watch", "sh", "-c", "cat >/dev/null; printf 'copy\\n'"])
        .stdout(Stdio::piped()).stderr(Stdio::null()).spawn();
    match child {
        Ok(mut child) => {
            let stdout = child.stdout.take().unwrap();
            app.manage(ClipboardWatcher(Mutex::new(child)));
            thread::spawn(move || {
                // wl-paste reports the existing selection once when starting.
                let mut initial = true;
                for line in BufReader::new(stdout).lines() {
                    if line.is_err() { break; }
                    if initial { initial = false; continue; }
                    let _ = app.emit("clipboard-copy", ());
                }
            });
        }
        Err(err) => eprintln!("Clipboard watcher unavailable: {err}"),
    }
}

pub struct ClipboardWatcher(pub Mutex<std::process::Child>);

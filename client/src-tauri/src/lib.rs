mod clipboard;

use std::process::Command;
use std::sync::{Arc, Mutex};
use std::sync::atomic::{AtomicU64, Ordering};
use tauri::{Emitter, LogicalPosition, Manager, Position, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

struct OverlayState {
    word: Mutex<String>,
    updating: Arc<Mutex<()>>,
    generation: Arc<AtomicU64>,
}

fn encode_uri_component(value: &str) -> String {
    let mut encoded = String::with_capacity(value.len());

    for byte in value.bytes() {
        match byte {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'.' | b'_' | b'~' => {
                encoded.push(byte as char);
            }
            b' ' => encoded.push_str("%20"),
            _ => encoded.push_str(&format!("%{:02X}", byte)),
        }
    }

    encoded
}

#[tauri::command]
async fn read_clipboard_word() -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(clipboard::read)
        .await
        .map_err(|err| format!("Clipboard task failed: {err}"))?
}

#[tauri::command]
async fn capture_selected_text() -> Result<String, String> {
    let script = r#"
        set -e
        mkdir -p /tmp/wordveil
        img="/tmp/wordveil/selection.png"

        if command -v timeout >/dev/null 2>&1; then
            timeout 12s sh -c '
                geom="$(slurp -d 2>/dev/null || true)"
                if [ -z "$geom" ]; then
                    echo "" >&2
                    exit 1
                fi
                grim -g "$geom" "$1" 2>/dev/null
                tesseract "$1" stdout --psm 6 2>/dev/null | tr -d '\r'
            ' -- "$img"
        else
            geom="$(slurp -d 2>/dev/null || true)"
            if [ -z "$geom" ]; then
                echo "" >&2
                exit 1
            fi
            grim -g "$geom" "$img" 2>/dev/null
            tesseract "$img" stdout --psm 6 2>/dev/null | tr -d '\r'
        fi
    "#;

    let result = tauri::async_runtime::spawn_blocking(move || {
        let output = match Command::new("sh").arg("-c").arg(script).output() {
            Ok(output) => output,
            Err(err) => return Err(format!("Failed to run OCR pipeline: {err}")),
        };

        if !output.status.success() {
            return Err("Screen capture/OCR failed. Install grim, slurp, and tesseract on Linux/Wayland.".to_string());
        }

        let text = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if text.is_empty() {
            return Err("No text detected in the selected area.".to_string());
        }

        Ok(text)
    })
    .await
    .map_err(|err| format!("OCR task failed: {err}"))?;

    result
}

#[tauri::command]
async fn show_word_overlay(
    app: tauri::AppHandle,
    state: tauri::State<'_, OverlayState>,
    word: String,
    x: f64,
    y: f64,
) -> Result<(), String> {
    if word.trim().is_empty() || word.len() > 1024 || !x.is_finite() || !y.is_finite() {
        return Ok(());
    }

    let _updating = state.updating.lock().map_err(|err| err.to_string())?;
    // Frontend mouse coordinates belong to the main window, not the desktop.
    let (x, y) = if let Ok(cursor) = app.cursor_position() {
        let monitor = app.monitor_from_point(cursor.x, cursor.y).ok().flatten();
        if let Some(monitor) = monitor {
            let scale = monitor.scale_factor();
            let origin = monitor.position();
            let size = monitor.size();
            let left = origin.x as f64 / scale;
            let top = origin.y as f64 / scale;
            (
                (cursor.x / scale + 18.0).clamp(left, (left + size.width as f64 / scale - 220.0).max(left)),
                (cursor.y / scale - 30.0).clamp(top, (top + size.height as f64 / scale - 110.0).max(top)),
            )
        } else {
            (x, y)
        }
    } else if let Some(main) = app.get_webview_window("main") {
        match (main.inner_position(), main.scale_factor()) {
            (Ok(origin), Ok(scale)) => (origin.x as f64 / scale + x, origin.y as f64 / scale + y),
            _ => (x, y), // Wayland may leave placement entirely to the compositor.
        }
    } else {
        (x, y)
    };

    if let Ok(mut current_word) = state.word.lock() {
        *current_word = word.clone();
    }

    let generation = state.generation.fetch_add(1, Ordering::SeqCst) + 1;
    let current = state.generation.clone();
    let updating = state.updating.clone();
    let timer_app = app.clone();
    tauri::async_runtime::spawn(async move {
        // Use a blocking worker so hiding is independent of WebView timer throttling.
        let _ = tauri::async_runtime::spawn_blocking(move || {
            std::thread::sleep(std::time::Duration::from_millis(3300));
            if let Ok(_guard) = updating.lock() {
                if current.load(Ordering::SeqCst) == generation {
                    if let Some(window) = timer_app.get_webview_window("word-overlay") {
                        let _ = window.hide();
                    }
                }
            }
        }).await;
    });

    let encoded_word = encode_uri_component(&word);
    let url = format!("overlay.html?word={encoded_word}");

    if let Some(window) = app.get_webview_window("word-overlay") {
        let _ = window.set_position(Position::Logical(LogicalPosition::new(x, y)));
        let _ = window.set_always_on_top(true);
        let _ = window.unminimize();
        if let Ok(serialized_word) = serde_json::to_string(&word) {
            let script = format!(
                "(() => {{ const nextWord = {serialized_word}; if (window.__WORDVEIL_SET_WORD) {{ window.__WORDVEIL_SET_WORD(nextWord); return; }} if (window.location) {{ const query = '?word=' + encodeURIComponent(String(nextWord)); window.location.search = query; }} }})();"
            );
            window.eval(&script).map_err(|err| format!("Failed to update overlay: {err}"))?;
        }

        window.show().map_err(|err| format!("Failed to show overlay: {err}"))?;
        return Ok(());
    }

    let window = WebviewWindowBuilder::new(
        &app,
        "word-overlay",
        WebviewUrl::App(url.into()),
    )
        .title("Selected Word")
        .inner_size(220.0, 110.0)
        .position(x, y)
        .transparent(true)
        .decorations(false)
        .always_on_top(true)
        .visible_on_all_workspaces(true)
        .shadow(false)
        .skip_taskbar(true)
        .focused(false)
        .build()
        .map_err(|err| format!("Failed to create overlay window: {err}"))?;

    window.show().map_err(|err| format!("Failed to show overlay window: {err}"))?;
    let _ = window.emit("word-overlay:update", serde_json::json!({ "word": word }));

    Ok(())
}

#[tauri::command]
fn close_word_overlay(app: tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("word-overlay") {
        let _ = window.hide();
    }
}

#[tauri::command]
fn get_overlay_word(state: tauri::State<OverlayState>) -> String {
    state
        .word
        .lock()
        .map(|value| value.clone())
        .unwrap_or_default()
}

#[tauri::command]
fn log_selected_word(source: String, word: String) {
    println!("[WordSelection][{}] {}", source, word);
}

#[tauri::command]
fn log_shortcut_status(message: String) {
    println!("[WordSelection][shortcut] {}", message);
}

#[tauri::command]
fn get_session_type() -> String {
    std::env::var("XDG_SESSION_TYPE").unwrap_or_else(|_| "unknown".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(OverlayState {
            word: Mutex::new(String::new()),
            updating: Arc::new(Mutex::new(())),
            generation: Arc::new(AtomicU64::new(0)),
        })
        .setup(|app| {
            clipboard::watch(app.handle().clone());
            #[cfg(desktop)]
            {
                if let Err(err) = app
                    .handle()
                    .plugin(tauri_plugin_global_shortcut::Builder::new().build())
                {
                    println!(
                        "[WordSelection][shortcut] failed to initialize global shortcut plugin: {}",
                        err
                    );
                } else {
                    println!("[WordSelection][shortcut] global shortcut plugin initialized");

                    let shortcuts = ["Ctrl+Shift+W", "Ctrl+Alt+5", "Ctrl+Shift+9", "Alt+F7"];
                    for shortcut in shortcuts {
                        let shortcut_name = shortcut.to_string();
                        let result = app.global_shortcut().on_shortcut(shortcut_name.as_str(), {
                            let shortcut_name = shortcut_name.clone();
                            move |app, _sc, event| {
                                if event.state == ShortcutState::Pressed {
                                    println!(
                                        "[WordSelection][shortcut] activated global:{}",
                                        shortcut_name
                                    );
                                    let _ = app.emit(
                                        "shortcut-triggered",
                                        serde_json::json!({
                                            "triggered": true,
                                            "shortcut": shortcut_name,
                                        }),
                                    );
                                }
                            }
                        });

                        match result {
                            Ok(_) => println!(
                                "[WordSelection][shortcut] registered global:{}",
                                shortcut
                            ),
                            Err(err) => println!(
                                "[WordSelection][shortcut] failed global:{} -> {}",
                                shortcut, err
                            ),
                        }
                    }
                }
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            if window.label() == "main" && matches!(event, tauri::WindowEvent::CloseRequested { .. }) {
                if let Some(watcher) = window.app_handle().try_state::<clipboard::ClipboardWatcher>() {
                    if let Ok(mut child) = watcher.0.lock() {
                        let _ = child.kill();
                        let _ = child.wait();
                    }
                }
                window.app_handle().exit(0);
            }
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            read_clipboard_word,
            capture_selected_text,
            show_word_overlay,
            close_word_overlay,
            get_overlay_word,
            log_selected_word,
            log_shortcut_status,
            get_session_type
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

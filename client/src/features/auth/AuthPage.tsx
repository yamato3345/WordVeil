import { useState, type FormEvent } from "react";
import { login, register, type AuthUser } from "./authApi";
import "./AuthPage.css";

export function AuthPage({ onAuthenticated }: { onAuthenticated: (session: { token: string; user: AuthUser }) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const isRegister = mode === "register";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");
    setNotice("");
    if (isRegister && !name.trim()) { setError("Вкажіть ваше ім’я."); return; }
    if (isRegister && password !== confirmation) { setError("Паролі не збігаються."); return; }
    if (isRegister && new TextEncoder().encode(password).length > 72) { setError("Пароль має містити не більше 72 байтів."); return; }
    setBusy(true);
    try {
      if (isRegister) {
        await register(name.trim(), email.trim(), password);
        setMode("login");
        setPassword("");
        setConfirmation("");
        setNotice("Обліковий запис створено. Увійдіть, використовуючи вашу пошту та пароль.");
      } else {
        onAuthenticated(await login(email.trim(), password));
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Сталася помилка. Спробуйте ще раз.");
    } finally { setBusy(false); }
  }

  return <main className="auth-page">
    <section className="auth-card" aria-labelledby="auth-title">
      <div className="auth-brand" data-tauri-drag-region>WordVeil</div>
      <h1 id="auth-title">{isRegister ? "Створити обліковий запис" : "З поверненням"}</h1>
      <p>Ваш простір для вивчення нових слів.</p>
      <form onSubmit={submit}>
        <fieldset disabled={busy}>
          {isRegister && <label>Ім’я<input name="name" autoComplete="name" required value={name} onChange={event => setName(event.target.value)} /></label>}
          <label>Електронна пошта<input name="email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} /></label>
          <label>Пароль<input name="password" type="password" autoComplete={isRegister ? "new-password" : "current-password"} required value={password} onChange={event => setPassword(event.target.value)} /></label>
          {isRegister && <label>Повторіть пароль<input name="confirmation" type="password" autoComplete="new-password" required value={confirmation} onChange={event => setConfirmation(event.target.value)} /></label>}
          {error && <p className="auth-error" role="alert">{error}</p>}
          {notice && <p role="status">{notice}</p>}
          <button className="auth-submit" type="submit">{busy ? "Зачекайте…" : isRegister ? "Зареєструватися" : "Увійти"}</button>
        </fieldset>
      </form>
      <button className="auth-switch" type="button" disabled={busy} onClick={() => { setMode(isRegister ? "login" : "register"); setError(""); setNotice(""); setPassword(""); setConfirmation(""); }}>
        {isRegister ? "Вже маєте обліковий запис? Увійти" : "Ще немає облікового запису? Реєстрація"}
      </button>
    </section>
  </main>;
}

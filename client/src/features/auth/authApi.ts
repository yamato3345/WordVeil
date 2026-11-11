export type AuthUser = { id: string; name: string; email: string };

const baseUrl = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "/api" : "http://localhost:8080")).replace(/\/$/, "");

async function request(path: string, init: RequestInit) {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, { ...init, signal: AbortSignal.timeout(15000) });
  } catch {
    throw new Error("Не вдалося з’єднатися із сервером. Спробуйте ще раз.");
  }
  if (!response.ok) {
    if (path === "/login/" && response.status === 400) throw new Error("Неправильна пошта або пароль.");
    if (path === "/register/") throw new Error("Не вдалося створити обліковий запис. Перевірте дані або спробуйте іншу пошту.");
    throw new Error("Не вдалося виконати запит. Спробуйте ще раз.");
  }
  return response.json();
}

export async function register(name: string, email: string, password: string): Promise<AuthUser> {
  return request("/register/", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
}

export async function login(email: string, password: string) {
  const data = await request("/login/", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (typeof data.accessToken !== "string" || !data.accessToken) throw new Error("Сервер не повернув токен входу.");
  const user: AuthUser = await request("/user/", { headers: { Authorization: `Bearer ${data.accessToken}` } });
  if (!user.id || !user.name || !user.email) throw new Error("Сервер повернув некоректні дані користувача.");
  return { token: data.accessToken as string, user };
}

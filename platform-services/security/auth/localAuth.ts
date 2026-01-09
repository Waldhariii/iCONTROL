export type Role = "USER_READONLY" | "ADMIN" | "SYSADMIN" | "DEVELOPER";

export type Session = {
  username: string;
  role: Role;
  fullName?: string;
};

const LS_SESSION = "icontrol_session_v1";

const BOOTSTRAP_USERS: Array<{ username: string; password: string; role: Role; fullName?: string }> = [
  { username: "sysadmin",  password: "sysadmin",        role: "SYSADMIN",  fullName: "SYSADMIN" },
  { username: "developer", password: "developer",       role: "DEVELOPER", fullName: "DEVELOPER" },
  { username: "admin",     password: "admin",           role: "ADMIN",     fullName: "ADMIN" },
  { username: "Waldhari",  password: "Dany123456@",     role: "DEVELOPER", fullName: "Waldhari" }
];

export function authenticate(username: string, password: string): Session | null {
  const u = BOOTSTRAP_USERS.find(x => x.username === username && x.password === password);
  if (!u) return null;
  const s: Session = { username: u.username, role: u.role, fullName: u.fullName };
  try { localStorage.setItem(LS_SESSION, JSON.stringify(s)); } catch (_) {}
  return s;
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(LS_SESSION);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch (_) {
    return null;
  }
}

export function logout(): void {
  try { localStorage.removeItem(LS_SESSION); } catch (_) {}
}

export function requireSession(): Session {
  const s = getSession();
  if (!s) throw new Error("NO_SESSION");
  return s;
}

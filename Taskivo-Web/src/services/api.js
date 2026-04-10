import { API_URL } from "../constants/apiBaseUrl";

const IS_DEV = import.meta.env.DEV;

// ── Auth ──────────────────────────────────────────────
export async function login(email, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim(), password: password.trim() }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");
  return data;
}

export async function warmServer() {
  try {
    await fetch(`${API_URL.replace(/\/api$/, "")}/api/health`, {
      method: "GET",
      cache: "no-store",
    });
  } catch {
    // Ignore warmup failures; this is only a best-effort latency improvement.
  }
}

// ── Token helpers ─────────────────────────────────────
export function setToken(token)  { localStorage.setItem("token", token); }
export function getToken()       { return localStorage.getItem("token"); }
export function clearToken()     { localStorage.removeItem("token"); }

// ── Shared headers ────────────────────────────────────
const authHeaders = (includeJson = false) => {
  const headers = {
    Authorization: `Bearer ${getToken()}`,
  };
  if (includeJson) headers["Content-Type"] = "application/json";
  return headers;
};

// ── Strip undefined values (Supabase/PostgREST rejects them) ──
const clean = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));

// ── Tasks ─────────────────────────────────────────────
export async function getTasks() {
  const res = await fetch(`${API_URL}/tasks`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch tasks");
  const data = await res.json();

  if (IS_DEV) {
    console.log("[API] getTasks returned:", data.map(t => ({
      id:          t.id,
      title:       t.title,
      assignedTo:  t.assignedTo,
      assigned_to: t.assigned_to,
    })));
  }

  return data;
}

export async function createTask(task) {
  const payload = clean(task);

  if (IS_DEV) {
    console.log("[API] createTask payload:", {
      title:      payload.title,
      assignedTo: payload.assignedTo,
    });
  }

  const res = await fetch(`${API_URL}/tasks`, {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (IS_DEV) {
    console.log("[API] createTask response:", {
      id:         data.id,
      title:      data.title,
      assignedTo: data.assignedTo,
    });
  }

  if (!res.ok) throw new Error(data.error || "Failed to create task");
  return data;
}

export async function updateTask(task) {
  const payload = clean(task);

  if (IS_DEV) {
    console.log("[API] updateTask payload:", {
      id:                   payload.id,
      status:               payload.status,
      teamLeaderReviewed:   payload.teamLeaderReviewed,
      teamLeaderApprovedBy: payload.teamLeaderApprovedBy,
      userCompletions:      payload.userCompletions,
      tlPendingAssignment:  payload.tlPendingAssignment,
      assignedByManager:    payload.assignedByManager,
    });
  }

  const res = await fetch(`${API_URL}/tasks/${payload.id}`, {
    method: "PUT",
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errBody = "";
    try { errBody = await res.text(); } catch {}
    if (IS_DEV) {
      console.error("[API] updateTask server error:", res.status, errBody);
    }
    throw new Error(`Failed to update task: ${res.status} ${errBody}`);
  }

  return res.json();
}

export async function deleteTask(id) {
  const res = await fetch(`${API_URL}/tasks/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete task");
  return res.json();
}

// ── Users ─────────────────────────────────────────────
export async function getUsers() {
  const res = await fetch(`${API_URL}/users`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function createUser(user) {
  const res = await fetch(`${API_URL}/users`, {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify(user),
  });
  if (!res.ok) throw new Error("Failed to create user");
  return res.json();
}

export async function updateUser(user) {
  const res = await fetch(`${API_URL}/users/${user.id}`, {
    method: "PUT",
    headers: authHeaders(true),
    body: JSON.stringify(user),
  });
  if (!res.ok) throw new Error("Failed to update user");
  return res.json();
}

export async function deleteUser(id) {
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete user");
  return res.json();
}

// ── Audit ─────────────────────────────────────────────
export async function getAudit() {
  const res = await fetch(`${API_URL}/audit`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch audit log");
  return res.json();
}

export async function addAudit({ action, type = "info" }) {
  const res = await fetch(`${API_URL}/audit`, {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify({ action, type }),
  });
  if (!res.ok) throw new Error("Failed to add audit log");
  return res.json();
}

// ── Me ────────────────────────────────────────────────
export async function getMe() {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return res.json();
  } catch (err) {
    console.error("getMe failed:", err);
    return null;
  }
}

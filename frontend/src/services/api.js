import { API_URL } from "../constants/apiBaseUrl";

const IS_DEV = import.meta.env.DEV;
const HEALTH_URL = `${API_URL.replace(/\/api$/, "")}/api/health`;
const IS_RENDER_API = /onrender\.com/i.test(API_URL);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function login(email, password) {
  let res;
  try {
    res = await fetchWithTimeout(
      `${API_URL}/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      },
      IS_RENDER_API ? 30000 : 15000
    );
  } catch (err) {
    const isTimeout = err?.name === "AbortError";
    throw new Error(
      isTimeout && IS_RENDER_API
        ? "The backend is taking too long to respond. It may be waking up on Render. Please try again in a few seconds."
        : `Cannot reach the backend at ${API_URL}. Check your network, backend server, and CORS settings.`
    );
  }

  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) throw new Error(data.error || "Login failed");
  return data;
}

export async function warmServer() {
  const attempts = IS_RENDER_API ? 3 : 1;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      await fetchWithTimeout(
        HEALTH_URL,
        {
          method: "GET",
          cache: "no-store",
        },
        IS_RENDER_API ? 20000 : 10000
      );
      return;
    } catch {
      if (attempt < attempts - 1) {
        await sleep(2000);
      }
    }
  }
}

export function setToken(token) {
  localStorage.setItem("token", token);
}

export function getToken() {
  return localStorage.getItem("token");
}

export function clearToken() {
  localStorage.removeItem("token");
}

const authHeaders = (includeJson = false) => {
  const headers = {
    Authorization: `Bearer ${getToken()}`,
  };
  if (includeJson) headers["Content-Type"] = "application/json";
  return headers;
};

const clean = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));

export async function getTasks() {
  const res = await fetch(`${API_URL}/tasks`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch tasks");
  const data = await res.json();

  if (IS_DEV) {
    console.log("[API] getTasks returned:", data.map((t) => ({
      id: t.id,
      title: t.title,
      assignedTo: t.assignedTo,
      assigned_to: t.assigned_to,
    })));
  }

  return data;
}

export async function createTask(task) {
  const payload = clean(task);

  if (IS_DEV) {
    console.log("[API] createTask payload:", {
      title: payload.title,
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
      id: data.id,
      title: data.title,
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
      id: payload.id,
      status: payload.status,
      teamLeaderReviewed: payload.teamLeaderReviewed,
      teamLeaderApprovedBy: payload.teamLeaderApprovedBy,
      userCompletions: payload.userCompletions,
      tlPendingAssignment: payload.tlPendingAssignment,
      assignedByManager: payload.assignedByManager,
    });
  }

  const res = await fetch(`${API_URL}/tasks/${payload.id}`, {
    method: "PUT",
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errBody = "";
    try {
      errBody = await res.text();
    } catch {}
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

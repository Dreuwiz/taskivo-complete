const express  = require("express");
const bcrypt   = require("bcryptjs");
const supabase = require("../supabase");
const auth     = require("../middleware/auth");

const router = express.Router();
router.use(auth);
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const parseAssignedTo = (value) => {
  if (!value && value !== "") return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  const raw = String(value).trim();
  if (!raw) return [];
  if (raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [raw];
    } catch { /* fall through */ }
  }
  if (raw.includes(",")) return raw.split(",").map((s) => s.trim()).filter(Boolean);
  return [raw];
};

const formatAssignedValue = (value) => {
  if (Array.isArray(value)) {
    return value.length === 1 ? value[0] : JSON.stringify(value);
  }
  return value || "";
};

const renameObjectKey = (source, oldKey, newKey) => {
  const entries = Object.entries(source || {});
  let changed = false;
  const next = {};

  entries.forEach(([key, value]) => {
    const targetKey = key === oldKey ? newKey : key;
    if (targetKey !== key) changed = true;
    next[targetKey] = value;
  });

  return { value: next, changed };
};

const renameTaskReferences = (task, oldName, newName) => {
  const patch = {};
  let changed = false;

  const assignedNames = parseAssignedTo(task.assigned_to);
  if (assignedNames.includes(oldName)) {
    patch.assigned_to = formatAssignedValue(assignedNames.map((name) => (name === oldName ? newName : name)));
    changed = true;
  }

  const completions = renameObjectKey(task.userCompletions ?? task.user_completions ?? {}, oldName, newName);
  if (completions.changed) {
    patch.userCompletions = completions.value;
    changed = true;
  }

  const subtasks = (task.subtasks || []).map((subtask) => {
    const renamed = renameObjectKey(subtask.userDone || {}, oldName, newName);
    if (!renamed.changed) return subtask;
    changed = true;
    return { ...subtask, userDone: renamed.value };
  });

  if (changed) {
    patch.subtasks = subtasks;
  }

  ["assignedByManager", "tlAssignedBy", "teamLeaderApprovedBy", "reviewedBy", "rejectedBy"].forEach((field) => {
    if (task[field] === oldName) {
      patch[field] = newName;
      changed = true;
    }
  });

  return changed ? patch : null;
};

// ── GET /api/users ────────────────────────────────────
router.get("/", asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, role, team, avatar, streak, status, created_at")
    .order("name");

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}));

// ── POST /api/users  (admin only) ─────────────────────
router.post("/", asyncHandler(async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ error: "Admin only" });

  const { name, email, password, role, team, status } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: "Name, email, and password are required" });

  // Check email uniqueness
  const { data: existing } = await supabase.from("users").select("id").eq("email", email).maybeSingle();
  if (existing) return res.status(409).json({ error: "Email already in use" });

  const password_hash = await bcrypt.hash(password, 10);
  const avatar        = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const noTeam        = role === "manager" || role === "admin";

  const { data, error } = await supabase
    .from("users")
    .insert([{ name, email: email.toLowerCase(), password_hash, role, team: noTeam ? null : team, avatar, status: status || "Active", streak: 0 }])
    .select("id, name, email, role, team, avatar, streak, status")
    .single();

  if (error) return res.status(500).json({ error: error.message });

  await supabase.from("audit_log").insert([{ action: `Added user ${name}`, performed_by: req.user.name, type: "success" }]);
  res.status(201).json(data);
}));

// ── PUT /api/users/:id  (admin only) ──────────────────
router.put("/:id", asyncHandler(async (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "manager")
    return res.status(403).json({ error: "Insufficient permissions" });

  const { id }  = req.params;
  const { data: existingUser, error: existingUserError } = await supabase
    .from("users")
    .select("id, name")
    .eq("id", id)
    .single();

  if (existingUserError) return res.status(500).json({ error: existingUserError.message });

  const fields  = { ...req.body };
  delete fields.id;
  delete fields.created_at;
  delete fields.password_hash;

  if (fields.password) {
    fields.password_hash = await bcrypt.hash(fields.password, 10);
    delete fields.password;
  }

  if (fields.role === "manager" || fields.role === "admin") fields.team = null;

  if (fields.name) {
    fields.avatar = fields.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  }

  const { data, error } = await supabase
    .from("users")
    .update(fields)
    .eq("id", id)
    .select("id, name, email, role, team, avatar, streak, status")
    .single();

  if (error) return res.status(500).json({ error: error.message });

  if (existingUser?.name && data.name && existingUser.name !== data.name) {
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("*");

    if (tasksError) return res.status(500).json({ error: tasksError.message });

    for (const task of tasks || []) {
      const patch = renameTaskReferences(task, existingUser.name, data.name);
      if (!patch) continue;

      const { error: taskUpdateError } = await supabase
        .from("tasks")
        .update(patch)
        .eq("id", task.id);

      if (taskUpdateError) return res.status(500).json({ error: taskUpdateError.message });
    }
  }

  await supabase.from("audit_log").insert([{ action: `Updated user ${data.name}`, performed_by: req.user.name, type: "info" }]);
  res.json(data);
}));

// ── DELETE /api/users/:id  (admin only) ───────────────
router.delete("/:id", asyncHandler(async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ error: "Admin only" });

  const { id } = req.params;
  const { data: user } = await supabase.from("users").select("name").eq("id", id).single();

  const { error } = await supabase.from("users").delete().eq("id", id);
  if (error) return res.status(500).json({ error: error.message });

  await supabase.from("audit_log").insert([{ action: `Removed user ${user?.name}`, performed_by: req.user.name, type: "danger" }]);
  res.json({ success: true });
}));

module.exports = router;

const express  = require("express");
const supabase = require("../supabase");
const auth     = require("../middleware/auth");

const router = express.Router();
router.use(auth);
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ── Helpers ───────────────────────────────────────────────────────────────────

const normalizeName = (value) => String(value || "").trim().toLowerCase();

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
  if (raw.includes(",")) return raw.split(",").map(s => s.trim()).filter(Boolean);
  return [raw];
};

const formatAssignedValue = (value) => {
  if (Array.isArray(value)) {
    return value.length === 1 ? value[0] : JSON.stringify(value);
  }
  return value || "";
};

const parseAssignedUserIds = (...values) => {
  for (const value of values) {
    if (value == null || value === "") continue;
    if (Array.isArray(value)) {
      return value.map((id) => Number(id)).filter((id) => Number.isInteger(id));
    }
    if (typeof value === "number") {
      return Number.isInteger(value) ? [value] : [];
    }

    const raw = String(value).trim();
    if (!raw) continue;

    if (raw.startsWith("[")) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map((id) => Number(id)).filter((id) => Number.isInteger(id));
        }
      } catch { /* fall through */ }
    }

    const parsed = Number(raw);
    if (Number.isInteger(parsed)) return [parsed];
  }

  return [];
};

const buildUserMaps = (users = []) => {
  const usersById = new Map();
  const usersByName = new Map();

  users.forEach((user) => {
    usersById.set(user.id, user);
    usersByName.set(normalizeName(user.name), user);
  });

  return { usersById, usersByName };
};

const resolveAssignments = (taskLike, userMaps = buildUserMaps()) => {
  const names = parseAssignedTo(taskLike.assigned_to ?? taskLike.assignedTo ?? "");
  const ids = parseAssignedUserIds(
    taskLike.assignedUserIds,
    taskLike.assigned_user_ids,
    taskLike.assigned_user_id
  );

  const resolvedNames = [];
  const resolvedIds = [];
  const seenNames = new Set();
  const seenIds = new Set();

  ids.forEach((id) => {
    if (seenIds.has(id)) return;
    seenIds.add(id);
    resolvedIds.push(id);

    const matchedUser = userMaps.usersById.get(id);
    const matchedName = matchedUser?.name;
    if (matchedName && !seenNames.has(matchedName)) {
      seenNames.add(matchedName);
      resolvedNames.push(matchedName);
    }
  });

  names.forEach((name) => {
    if (!name || seenNames.has(name)) return;
    seenNames.add(name);
    resolvedNames.push(name);

    const matchedUser = userMaps.usersByName.get(normalizeName(name));
    if (matchedUser && !seenIds.has(matchedUser.id)) {
      seenIds.add(matchedUser.id);
      resolvedIds.push(matchedUser.id);
    }
  });

  return { names: resolvedNames, ids: resolvedIds };
};

// Normalize Supabase row → frontend shape
const normalize = (t, userMaps = buildUserMaps()) => {
  const assigned = resolveAssignments(t, userMaps);
  return {
    ...t,
    assignedTo:  assigned.names,
    assigned_to: assigned.names[0] || "",
    assignedUserIds: assigned.ids,
    assigned_user_id: assigned.ids[0] ?? null,
    subtasks:    t.subtasks  || [],
    userCompletions:      t.userCompletions      ?? t.user_completions      ?? {},
    teamLeaderReviewed:   t.teamLeaderReviewed   ?? t.team_leader_reviewed  ?? false,
    teamLeaderApprovedBy: t.teamLeaderApprovedBy ?? t.team_leader_approved_by ?? null,
    teamLeaderApprovedAt: t.teamLeaderApprovedAt ?? t.team_leader_approved_at ?? null,
    rejectedBy:           t.rejectedBy           ?? t.rejected_by           ?? null,
    rejectionReason:      t.rejectionReason      ?? t.rejection_reason      ?? null,
    reviewedBy:           t.reviewedBy           ?? t.reviewed_by           ?? null,
    completedAt:          t.completedAt          ?? t.completed_at          ?? null,
  };
};

// Prepare frontend payload → Supabase columns
// Supabase columns were created with quoted camelCase names so we keep camelCase.
// We only need to: remove non-column fields, and map assignedTo → assigned_to.
const toDb = (fields, userMaps = buildUserMaps()) => {
  const clean = { ...fields };

  // Remove fields that are not real DB columns
  delete clean.id;
  delete clean.created_at;
  delete clean.assigned_to; // will be re-set below from assignedTo
  delete clean.assignedUserIds;
  delete clean.assigned_user_ids;

  // Map assignedTo array → the assigned_to string column
  if (
    clean.assignedTo !== undefined ||
    clean.assigned_user_id !== undefined ||
    fields.assignedUserIds !== undefined
  ) {
    const assigned = resolveAssignments(clean, userMaps);
    clean.assigned_to = formatAssignedValue(assigned.names);
    clean.assigned_user_id = assigned.ids[0] ?? null;
    delete clean.assignedTo;
  }

  // These are valid quoted-camelCase columns in Supabase — pass them through as-is:
  // "rejectedBy", "rejectionReason", "reviewedBy", "teamLeaderReviewed",
  // "teamLeaderApprovedBy", "teamLeaderApprovedAt", "userCompletions",
  // "subtasks", "completedAt"

  // Null-safe: replace undefined with null so Supabase doesn't ignore the field
  for (const key of Object.keys(clean)) {
    if (clean[key] === undefined) clean[key] = null;
  }

  return clean;
};

// ── GET /api/tasks ────────────────────────────────────────────────────────────
router.get("/", asyncHandler(async (req, res) => {
  const { role, name, team } = req.user;

  const [{ data, error }, { data: users, error: usersError }] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("users")
      .select("id, name, role, team"),
  ]);

  if (error) return res.status(500).json({ error: error.message });
  if (usersError) return res.status(500).json({ error: usersError.message });

  const userMaps = buildUserMaps(users || []);

  // Filter tasks based on role:
  // - user        → only tasks where they are an assignee
  // - team_leader → tasks tagged with their team OR individually assigned to
  //                 any member of their team (team comes from the users table)
  // - manager/admin → all tasks
  let tasks = data;

  if (role === "user") {
    tasks = data.filter(t => {
      const assigned = resolveAssignments(t, userMaps);
      return assigned.ids.includes(req.user.id) ||
        assigned.names.some(a => normalizeName(a) === normalizeName(name));
    });
  } else if (role === "team_leader" || role === "leader") {
    const teamUsers = (users || []).filter((user) => user.team === team);
    const teamMemberNames = teamUsers
      .filter(u => !["team_leader", "leader"].includes(u.role))
      .map(u => normalizeName(u.name))
      .filter(Boolean);
    const teamMemberIds = teamUsers
      .filter(u => !["team_leader", "leader"].includes(u.role))
      .map(u => u.id);

    tasks = data.filter(t => {
      if (t.team === team) return true;
      const assigned = resolveAssignments(t, userMaps);
      if (
        t.tlPendingAssignment === true &&
        (
          assigned.ids.includes(req.user.id) ||
          assigned.names.some((a) => normalizeName(a) === normalizeName(name))
        )
      ) {
        return true;
      }
      return assigned.ids.some((id) => teamMemberIds.includes(id)) ||
        assigned.names.some((a) => teamMemberNames.includes(normalizeName(a)));
    });
  }

  res.json(tasks.map((task) => normalize(task, userMaps)));
}));

// ── POST /api/tasks ───────────────────────────────────────────────────────────
router.post("/", asyncHandler(async (req, res) => {
  const {
    title,
    team,
    priority,
    due,
    description,
    subtasks,
    status,
    tlPendingAssignment,
    assignedByManager,
    assignedByManagerAt,
    tlAssignedBy,
    tlAssignedAt,
    teamLeaderReviewed,
    teamLeaderApprovedBy,
    teamLeaderApprovedAt,
    userCompletions,
    rejectionReason,
    rejectedBy,
    reviewedBy,
    completedAt,
  } = req.body;
  if (!title) return res.status(400).json({ error: "Title is required" });

  const { data: users, error: usersError } = await supabase.from("users").select("id, name");
  if (usersError) return res.status(500).json({ error: usersError.message });

  const userMaps = buildUserMaps(users || []);
  const assigned = resolveAssignments(req.body, userMaps);

  const { data, error } = await supabase
    .from("tasks")
    .insert([{
      title,
      assigned_to:    formatAssignedValue(assigned.names),
      assigned_user_id: assigned.ids[0] ?? null,
      team:           team        || null,
      priority:       priority    || "Medium",
      due:            due         || null,
      description:    description || "",
      subtasks:       subtasks    || [],
      status:         status      || "Pending",
      userCompletions:      userCompletions      || {},
      tlPendingAssignment:  tlPendingAssignment  ?? false,
      assignedByManager:    assignedByManager    ?? null,
      assignedByManagerAt:  assignedByManagerAt  ?? null,
      tlAssignedBy:         tlAssignedBy         ?? null,
      tlAssignedAt:         tlAssignedAt         ?? null,
      teamLeaderReviewed:   teamLeaderReviewed   ?? false,
      teamLeaderApprovedBy: teamLeaderApprovedBy ?? null,
      teamLeaderApprovedAt: teamLeaderApprovedAt ?? null,
      rejectionReason:      rejectionReason      ?? null,
      rejectedBy:           rejectedBy           ?? null,
      reviewedBy:           reviewedBy           ?? null,
      completedAt:          completedAt          ?? null,
    }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  await supabase.from("audit_log").insert([{
    action: `Added task "${title}"`, performed_by: req.user.name, type: "success",
  }]);

  res.status(201).json(normalize(data, userMaps));
}));

// ── PUT /api/tasks/:id ────────────────────────────────────────────────────────
router.put("/:id", asyncHandler(async (req, res) => {
  const { id }  = req.params;
  const { data: users, error: usersError } = await supabase.from("users").select("id, name");
  if (usersError) return res.status(500).json({ error: usersError.message });

  const userMaps = buildUserMaps(users || []);
  const clean   = toDb(req.body, userMaps);

  console.log("[tasks] PUT", id, "→ db fields:", Object.keys(clean));

  const { data, error } = await supabase
    .from("tasks")
    .update(clean)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[tasks] Supabase update error:", error.message);
    return res.status(500).json({ error: error.message });
  }

  await supabase.from("audit_log").insert([{
    action: `Updated task "${data.title}" → ${data.status}`,
    performed_by: req.user.name, type: "info",
  }]);

  res.json(normalize(data, userMaps));
}));

// ── DELETE /api/tasks/:id ─────────────────────────────────────────────────────
router.delete("/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { data: task } = await supabase.from("tasks").select("title").eq("id", id).single();

  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) return res.status(500).json({ error: error.message });

  await supabase.from("audit_log").insert([{
    action: `Deleted task "${task?.title}"`, performed_by: req.user.name, type: "danger",
  }]);

  res.json({ success: true });
}));

module.exports = router;

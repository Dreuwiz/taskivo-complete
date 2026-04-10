const express  = require("express");
const supabase = require("../supabase");
const auth     = require("../middleware/auth");

const router = express.Router();
router.use(auth);

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// Normalize Supabase row → frontend shape
const normalize = t => {
  const assigned = parseAssignedTo(t.assigned_to || t.assignedTo || "");
  return {
    ...t,
    assignedTo:  assigned,
    assigned_to: assigned[0] || "",
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
const toDb = fields => {
  const clean = { ...fields };

  // Remove fields that are not real DB columns
  delete clean.id;
  delete clean.created_at;
  delete clean.assigned_to; // will be re-set below from assignedTo

  // Map assignedTo array → the assigned_to string column
  if (clean.assignedTo !== undefined) {
    clean.assigned_to = formatAssignedValue(clean.assignedTo);
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
router.get("/", async (req, res) => {
  const { role, name, team } = req.user;

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  // Filter tasks based on role:
  // - user        → only tasks where they are an assignee
  // - team_leader → tasks tagged with their team OR individually assigned to
  //                 any member of their team (team comes from the users table)
  // - manager/admin → all tasks
  let tasks = data;

  if (role === "user") {
    tasks = data.filter(t => {
      const assignees = parseAssignedTo(t.assigned_to || t.assignedTo || "");
      return assignees.some(a => a.toLowerCase().trim() === name.toLowerCase().trim());
    });
  } else if (role === "team_leader" || role === "leader") {
    // FIX: also include tasks individually assigned to members of this TL's team
    // Step 1: get all users in this team
    const { data: teamUsers } = await supabase
      .from("users")
      .select("name, role")
      .eq("team", team);

    const teamMemberNames = (teamUsers || [])
      .filter(u => !["team_leader", "leader"].includes(u.role))
      .map(u => u.name?.toLowerCase().trim())
      .filter(Boolean);

    tasks = data.filter(t => {
      // Explicitly tagged with this team
      if (t.team === team) return true;
      // OR individually assigned to someone in this team
      const assignees = parseAssignedTo(t.assigned_to || t.assignedTo || "");
      return assignees.some(a => teamMemberNames.includes(a.toLowerCase().trim()));
    });
  }

  res.json(tasks.map(normalize));
});

// ── POST /api/tasks ───────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  const { title, assignedTo, assigned_to, team, priority, due, description, subtasks } = req.body;
  if (!title) return res.status(400).json({ error: "Title is required" });

  const assignedValue = assignedTo !== undefined
    ? formatAssignedValue(assignedTo)
    : formatAssignedValue(assigned_to);

  const { data, error } = await supabase
    .from("tasks")
    .insert([{
      title,
      assigned_to:    assignedValue,
      team:           team        || null,
      priority:       priority    || "Medium",
      due:            due         || null,
      description:    description || "",
      subtasks:       subtasks    || [],
      status:         "Pending",
      userCompletions: {},
      teamLeaderReviewed: false,
    }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  await supabase.from("audit_log").insert([{
    action: `Added task "${title}"`, performed_by: req.user.name, type: "success",
  }]);

  res.status(201).json(normalize(data));
});

// ── PUT /api/tasks/:id ────────────────────────────────────────────────────────
router.put("/:id", async (req, res) => {
  const { id }  = req.params;
  const clean   = toDb(req.body);

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

  res.json(normalize(data));
});

// ── DELETE /api/tasks/:id ─────────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const { data: task } = await supabase.from("tasks").select("title").eq("id", id).single();

  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) return res.status(500).json({ error: error.message });

  await supabase.from("audit_log").insert([{
    action: `Deleted task "${task?.title}"`, performed_by: req.user.name, type: "danger",
  }]);

  res.json({ success: true });
});

module.exports = router;
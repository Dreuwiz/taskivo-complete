const express  = require("express");
const supabase = require("../supabase");
const auth     = require("../middleware/auth");

const router = express.Router();
router.use(auth);
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ── GET /api/audit ────────────────────────────────────
router.get("/", asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return res.status(500).json({ error: error.message });

  // Format created_at as human-readable "time ago"
  const now = Date.now();
  const formatted = data.map(e => {
    const diff = now - new Date(e.created_at).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    let time = "Just now";
    if (mins >= 1 && mins < 60)  time = `${mins} min ago`;
    else if (hours >= 1 && hours < 24) time = `${hours} hr ago`;
    else if (days >= 1) time = `${days} day${days>1?"s":""} ago`;
    return { ...e, time };
  });

  res.json(formatted);
}));

// ── POST /api/audit ───────────────────────────────────
router.post("/", asyncHandler(async (req, res) => {
  const { action, type } = req.body;
  const { data, error } = await supabase
    .from("audit_log")
    .insert([{ action, performed_by: req.user.name, type: type || "info" }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
}));

module.exports = router;

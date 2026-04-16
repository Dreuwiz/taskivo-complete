const express  = require("express");
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const supabase = require("../supabase");
const auth     = require("../middleware/auth");

const router = express.Router();
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

console.log("AUTH ROUTE LOADED");

// ── LOGIN ─────────────────────────────────────────────
router.post("/login", asyncHandler(async (req, res) => {
  console.log("LOGIN ENDPOINT HIT");
  console.log("BODY:", req.body);

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();

  console.log("USER:", user);
  console.log("ERROR:", error);

  if (error || !user) {
    return res.status(401).json({ error: "Incorrect email or password" });
  }

  let hash = user.password_hash;
  // Normalize $2a$ → $2b$ for bcryptjs compatibility
  if (hash && hash.startsWith("$2a$")) hash = "$2b$" + hash.slice(4);

  console.log("Entered password:", password);
  console.log("Hash from DB:", hash);

  const match = await bcrypt.compare(password, hash);
  console.log("Match result:", match);

  if (!match) {
    return res.status(401).json({ error: "Incorrect email or password" });
  }

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role, team: user.team },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );

  const { password_hash, ...safeUser } = user;
  res.json({ token, user: safeUser });
}));

// ── REGISTER ──────────────────────────────────────────
router.post("/register", asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !name.trim())   return res.status(400).json({ error: "Full name is required" });
  if (!email || !email.trim()) return res.status(400).json({ error: "Email is required" });
  if (!password || password.length < 6)
    return res.status(400).json({ error: "Password must be at least 6 characters" });

  // Block admin self-registration
  const safeRole = ["user","team_leader","manager"].includes(role) ? role : "user";

  // Check email uniqueness
  const { data: existing } = await supabase
    .from("users").select("id").eq("email", email.toLowerCase().trim()).maybeSingle();
  if (existing) return res.status(409).json({ error: "An account with this email already exists" });

  const password_hash = await bcrypt.hash(password, 10);
  const avatar = name.trim().split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const { data: newUser, error } = await supabase
    .from("users")
    .insert([{
      name:          name.trim(),
      email:         email.toLowerCase().trim(),
      password_hash,
      role:          safeRole,
      team:          null,
      avatar,
      streak:        0,
      status:        "Active",
    }])
    .select("id, name, email, role, team, avatar, streak, status")
    .single();

  if (error) return res.status(500).json({ error: error.message });

  await supabase.from("audit_log").insert([{
    action: `New user registered: ${name.trim()} (${safeRole})`,
    performed_by: name.trim(),
    type: "success",
  }]);

  res.status(201).json({ message: "Account created successfully", user: newUser });
}));

// ── ME ────────────────────────────────────────────────
router.get("/me", auth, asyncHandler(async (req, res) => {
  const { data: user, error } = await supabase
    .from("users")
    .select("id, name, email, role, team, avatar, streak, status")
    .eq("id", req.user.id).maybeSingle();

  if (error || !user) return res.status(404).json({ error: "User not found" });
  res.json(user);
}));

module.exports = router;

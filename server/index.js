require("dotenv").config();
const express = require("express");
const cors    = require("cors");

const app = express();

// ── Middleware ─────────────────────────────────────────
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173", "https://your-frontend-domain.vercel.app"], // Add your deployed frontend URL here
  credentials: true
}));
app.use((req, res, next) => { console.log("REQUEST:", req.method, req.path); next(); });
app.use(express.json());

// ── Routes ─────────────────────────────────────────────
app.use("/api/auth",  require("./routes/auth"));
app.use("/api/tasks", require("./routes/tasks"));
app.use("/api/users", require("./routes/users"));
app.use("/api/audit", require("./routes/audit"));

// ── Health check ───────────────────────────────────────
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// ── 404 fallback ───────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// ── Start ──────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Taskivo server running on http://localhost:${PORT}`));

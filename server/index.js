require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://taskivo-complete-frontend.onrender.com",
]);

const corsOptions = {
  origin(origin, callback) {
    console.log("[CORS] Origin:", origin || "<none>");
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    console.warn("[CORS] Blocked origin:", origin);
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use((req, res, next) => {
  console.log("REQUEST:", req.method, req.path, "Origin:", req.headers.origin || "<none>");
  next();
});
app.use(express.json());

app.use("/api/auth", require("./routes/auth"));
app.use("/api/tasks", require("./routes/tasks"));
app.use("/api/users", require("./routes/users"));
app.use("/api/audit", require("./routes/audit"));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use((err, req, res, next) => {
  console.error("[SERVER ERROR]", err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: "Internal server error" });
});

app.use((req, res) => res.status(404).json({ error: "Route not found" }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => console.log(`Taskivo server running on port ${PORT}`));

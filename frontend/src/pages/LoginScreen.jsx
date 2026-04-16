import { useEffect, useState } from "react";
import { login, warmServer } from "../services/api";
import { TaskivoLogo } from "../components/ui/TaskivoLogo";

export function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [warmingUp, setWarmingUp] = useState(false);

  useEffect(() => {
    let mounted = true;

    setWarmingUp(true);
    warmServer().finally(() => {
      if (mounted) setWarmingUp(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const handleLogin = async () => {
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await login(email.trim(), password);
      if (!token || !user) {
        setError("Login failed. Please try again.");
        return;
      }
      if (!user.role) {
        setError("No role assigned. Contact your administrator.");
        return;
      }
      onLogin(token, user);
    } catch (err) {
      setError(err.message || "Incorrect email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: 8,
    border: "1.5px solid #e4e4e4",
    fontSize: 14,
    color: "#111",
    boxSizing: "border-box",
    outline: "none",
    background: "#fafafa",
    transition: "border 0.15s, background 0.15s",
  };
  const focus = (e) => {
    e.target.style.border = "1.5px solid #2c47c5";
    e.target.style.background = "#fff";
  };
  const blur = (e) => {
    e.target.style.border = "1.5px solid #e4e4e4";
    e.target.style.background = "#fafafa";
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f6fa" }}>
      <div style={{ width: "100%", maxWidth: 420, background: "#fff", borderRadius: 16, padding: "44px 40px", boxShadow: "0 4px 32px rgba(0,0,0,0.08)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
          <TaskivoLogo size={80} />
        </div>

        <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800, color: "#111", textAlign: "center" }}>Welcome back</h2>
        <p style={{ margin: "0 0 28px", fontSize: 13, color: "#aaa", textAlign: "center" }}>Enter your credentials to continue.</p>

        {warmingUp && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f5f8ff", border: "1.5px solid #d7e2ff", borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ color: "#2c47c5", fontSize: 13 }} />
            <p style={{ margin: 0, fontSize: 13, color: "#3553c7" }}>Waking up the backend. The first login may take a little longer.</p>
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#555", letterSpacing: 0.6, display: "block", marginBottom: 6 }}>EMAIL</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            style={inputStyle}
            onFocus={focus}
            onBlur={blur}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#555", letterSpacing: 0.6, display: "block", marginBottom: 6 }}>PASSWORD</label>
          <div style={{ position: "relative" }}>
            <input
              type={showPw ? "text" : "password"}
              placeholder="........"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{ ...inputStyle, paddingRight: 44 }}
              onFocus={focus}
              onBlur={blur}
            />
            <button
              onClick={() => setShowPw((p) => !p)}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#bbb", padding: 0, fontSize: 14 }}
            >
              <i className={showPw ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"} />
            </button>
          </div>
        </div>

        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff5f5", border: "1.5px solid #ffd5d5", borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
            <i className="fa-solid fa-circle-exclamation" style={{ color: "#e74c3c", fontSize: 13 }} />
            <p style={{ margin: 0, fontSize: 13, color: "#c0392b" }}>{error}</p>
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{ width: "100%", padding: "13px 0", borderRadius: 8, border: "none", background: loading ? "#c0caf5" : "#2c47c5", color: "#fff", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", letterSpacing: 0.2, transition: "background 0.2s" }}
          onMouseEnter={(e) => {
            if (!loading) e.target.style.background = "#1e35a8";
          }}
          onMouseLeave={(e) => {
            if (!loading) e.target.style.background = "#2c47c5";
          }}
        >
          {loading ? <><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 8 }} />Please wait...</> : "Sign In"}
        </button>

        <p style={{ margin: "20px 0 0", textAlign: "center", fontSize: 13, color: "#aaa" }}>
          Don't have an account? Contact your <span style={{ color: "#2c47c5", fontWeight: 700 }}>Administrator</span>.
        </p>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Modal, Field } from "../ui/Modal";
import { ROLES } from "../../constants/roles";
import { inputStyle } from "../../utils/helpers";

const BASE = "http://localhost:3001/api";

export function UserModal({ mode, initial, onSave, onClose }) {
  const [form, setForm] = useState(
    initial || { name:"", email:"", password:"", role:"user", team:"Alpha", status:"Active", streak:0 }
  );
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw,  setShowPw]  = useState(false);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSave = async () => {
    setError("");
    if (!form.name.trim())  return setError("Full name is required.");
    if (!form.email.trim()) return setError("Email is required.");
    if (mode === "add" && form.password.length < 6)
      return setError("Password must be at least 6 characters.");

    const noTeam = form.role === "manager" || form.role === "admin";
    const avatar = form.name.trim().split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      if (mode === "add") {
        const res  = await fetch(`${BASE}/users`, {
          method:  "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body:    JSON.stringify({
            name:     form.name.trim(),
            email:    form.email.trim(),
            password: form.password,
            role:     form.role,
            team:     noTeam ? null : form.team,
            status:   form.status,
            avatar,
            streak:   0,
          }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || "Failed to create user."); return; }
        onSave(data);
      } else {
        const res  = await fetch(`${BASE}/users/${initial.id}`, {
          method:  "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body:    JSON.stringify({
            name:   form.name.trim(),
            email:  form.email.trim(),
            role:   form.role,
            team:   noTeam ? null : form.team,
            status: form.status,
            avatar,
          }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || "Failed to update user."); return; }
        onSave(data);
      }
      onClose();
    } catch (err) {
      setError("Could not connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const noTeam = form.role === "manager" || form.role === "admin";

  return (
    <Modal
      title={mode==="add" ? "Add New User" : "Edit User"}
      onClose={onClose}
      onSubmit={handleSave}
      submitLabel={loading ? "Please wait…" : mode==="add" ? "Add User" : "Save Changes"}
      submitColor="#c0392b"
    >
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <Field label="Full Name">
          <input style={inputStyle} value={form.name} onChange={set("name")} placeholder="Full name…"/>
        </Field>
        <Field label="Email">
          <input type="email" style={inputStyle} value={form.email} onChange={set("email")} placeholder="email@taskivo.com"/>
        </Field>
      </div>

      {mode === "add" && (
        <Field label="Password">
          <div style={{ position:"relative" }}>
            <input type={showPw?"text":"password"} style={{ ...inputStyle, paddingRight:40 }}
              value={form.password} onChange={set("password")} placeholder="Min. 6 characters"/>
            <button onClick={() => setShowPw(p=>!p)} type="button"
              style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#bbb", fontSize:13 }}>
              <i className={showPw?"fa-solid fa-eye-slash":"fa-solid fa-eye"}/>
            </button>
          </div>
        </Field>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <Field label="Role">
          <select style={inputStyle} value={form.role} onChange={set("role")}>
            {Object.values(ROLES).map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </Field>
        <Field label="Team">
          <select style={{ ...inputStyle, opacity:noTeam?0.5:1 }} value={form.team||""} onChange={set("team")} disabled={noTeam}>
            <option value="">— None —</option>
            <option value="Alpha">Alpha</option>
            <option value="Beta">Beta</option>
          </select>
          {noTeam && <p style={{ margin:"4px 0 0", fontSize:11, color:"#aaa" }}>Managers & Admins have no team.</p>}
        </Field>
      </div>

      <Field label="Status">
        <select style={inputStyle} value={form.status} onChange={set("status")}>
          <option>Active</option>
          <option>Inactive</option>
        </select>
      </Field>

      {error && (
        <div style={{ display:"flex", alignItems:"center", gap:8, background:"#fff5f5", border:"1.5px solid #ffd5d5", borderRadius:8, padding:"10px 14px" }}>
          <i className="fa-solid fa-circle-exclamation" style={{ color:"#e74c3c", fontSize:13 }}/>
          <p style={{ margin:0, fontSize:13, color:"#c0392b" }}>{error}</p>
        </div>
      )}
    </Modal>
  );
}
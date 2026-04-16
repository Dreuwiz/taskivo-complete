import { useState } from "react";

export function RejectModal({ task, onConfirm, onClose }) {
  const [reason, setReason] = useState("");
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.3)" }} />
      <div style={{ position: "relative", backgroundColor: "white", borderRadius: 12, padding: 28, width: 400, boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 800, color: "#1a1a1a" }}>Reject Task</h3>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "#888" }}>"{task.title}"</p>
        <label style={{ fontSize: 12, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Reason for rejection
        </label>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Explain what needs to be fixed…"
          rows={4}
          style={{ width: "100%", marginTop: 8, padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, fontFamily: "inherit", resize: "vertical", outline: "none", boxSizing: "border-box", color: "#1a1a1a" }}
        />
        <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 18px", borderRadius: 7, border: "1px solid #ddd", background: "white", fontSize: 13, cursor: "pointer", color: "#666" }}>
            Cancel
          </button>
          <button
            onClick={() => { if (reason.trim()) onConfirm(reason.trim()); }}
            disabled={!reason.trim()}
            style={{ padding: "8px 18px", borderRadius: 7, border: "none", background: reason.trim() ? "#c0392b" : "#f0f0f0", color: reason.trim() ? "white" : "#bbb", fontSize: 13, fontWeight: 700, cursor: reason.trim() ? "pointer" : "default" }}>
            Reject & Send Back
          </button>
        </div>
      </div>
    </div>
  );
}
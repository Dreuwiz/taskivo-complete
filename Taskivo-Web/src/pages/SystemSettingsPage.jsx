import { useEffect, useState } from "react";
import { Card, SectionTitle, PageHeader } from "../components/ui/index";

// ── Sub-components defined OUTSIDE to avoid remount on every render ──

function ToggleRow({ label, desc, cfgKey, settings, onToggle, compact = false }) {
  const isOn = settings[cfgKey];
  return (
    <div style={{
      display: "flex",
      flexDirection: compact ? "column" : "row",
      justifyContent: "space-between",
      alignItems: compact ? "flex-start" : "center",
      gap: compact ? 12 : 16,
      padding: "13px 0",
      borderBottom: "1px solid #f0f0f0"
    }}>
      <div>
        <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "#1a1a1a" }}>{label}</p>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>{desc}</p>
      </div>
      <div
        onClick={() => onToggle(cfgKey, label)}
        style={{ width: 44, height: 24, borderRadius: 12, cursor: "pointer", backgroundColor: isOn ? "#2386ff" : "#ddd", position: "relative", transition: "background 0.2s", flexShrink: 0 }}
      >
        <div style={{ position: "absolute", top: 3, left: isOn ? 23 : 3, width: 18, height: 18, borderRadius: "50%", backgroundColor: "white", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
      </div>
    </div>
  );
}

function SliderRow({ label, desc, cfgKey, min, max, suffix = "", settings, onUpdate, compact = false }) {
  return (
    <div style={{ padding: "13px 0", borderBottom: "1px solid #f0f0f0" }}>
      <div style={{
        display: "flex",
        flexDirection: compact ? "column" : "row",
        justifyContent: "space-between",
        alignItems: compact ? "flex-start" : "stretch",
        gap: compact ? 8 : 16,
        marginBottom: 8
      }}>
        <div>
          <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "#1a1a1a" }}>{label}</p>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>{desc}</p>
        </div>
        <span style={{ fontSize: 20, fontWeight: 800, color: "#2386ff", minWidth: 48, textAlign: "right" }}>
          {settings[cfgKey]}{suffix}
        </span>
      </div>
      <input
        type="range" min={min} max={max} value={settings[cfgKey]}
        onChange={e => onUpdate(cfgKey, +e.target.value, label, `${label} set to ${e.target.value}${suffix}`)}
        style={{ width: "100%", accentColor: "#2386ff" }}
      />
    </div>
  );
}

function SelectRow({ label, desc, cfgKey, options, settings, onUpdate, compact = false }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: compact ? "column" : "row",
      justifyContent: "space-between",
      alignItems: compact ? "flex-start" : "center",
      gap: compact ? 12 : 16,
      padding: "13px 0",
      borderBottom: "1px solid #f0f0f0"
    }}>
      <div>
        <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "#1a1a1a" }}>{label}</p>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>{desc}</p>
      </div>
      <select
        value={settings[cfgKey]}
        onChange={e => onUpdate(cfgKey, e.target.value, label, `${label} changed to "${e.target.value}"`)}
        style={{
          width: compact ? "100%" : "auto",
          maxWidth: "100%",
          padding: "6px 10px",
          borderRadius: 8,
          border: "1px solid #ddd",
          fontSize: 13,
          color: "#1a1a1a",
          backgroundColor: "white",
          cursor: "pointer",
          outline: "none"
        }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────

export function SystemSettingsPage({ auditLog, onAuditAdd, users, tasks, settings, onSettingsChange }) {
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsCompact(window.innerWidth <= 900);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const update = (key, value, label, logMsg) => {
    onSettingsChange(prev => ({ ...prev, [key]: value }));
    onAuditAdd?.(logMsg || `${label} changed`, "info");
  };

  const toggle = (key, label) => {
    const newVal = !settings[key];
    onSettingsChange(prev => ({ ...prev, [key]: newVal }));
    onAuditAdd?.(`${label} ${newVal ? "enabled" : "disabled"}`, newVal ? "success" : "warning");
  };

  const logColor = { danger: "#c0392b", info: "#2386ff", success: "#27ae60", warning: "#c47b00" };
  const sharedProps = { settings, onToggle: toggle, onUpdate: update, compact: isCompact };

  return (
    <div>
      <PageHeader title="System Settings" subtitle="Configure global system behavior — Admin only" />
      <div style={{
        display: "grid",
        gridTemplateColumns: isCompact ? "1fr" : "minmax(0, 1fr) minmax(0, 1fr)",
        gap: 20,
        alignItems: "start",
        maxWidth: "100%"
      }}>

        {/* Task Settings */}
        <Card>
          <SectionTitle icon="📋">Task Settings</SectionTitle>
          <SliderRow
            label="Max Tasks Per Day"
            desc="Maximum tasks assignable per user per day"
            cfgKey="maxTasksPerDay"
            min={1} max={30}
            {...sharedProps}
          />
          <SelectRow
            label="Default Priority"
            desc="Priority pre-filled when creating a new task"
            cfgKey="defaultPriority"
            options={[
              { value: "Low",    label: "🟢 Low"    },
              { value: "Medium", label: "🟡 Medium" },
              { value: "High",   label: "🔴 High"   },
            ]}
            {...sharedProps}
          />
          <ToggleRow
            label="Require Approval for High Priority"
            desc="Only managers/admins can assign High priority tasks"
            cfgKey="requireApprovalForHighPriority"
            {...sharedProps}
          />
        </Card>

        {/* System Stats */}
        <Card>
          <SectionTitle icon="📊">System Stats</SectionTitle>
          {[
            { l: "Total Users",       v: users.length },
            { l: "Total Tasks",       v: tasks.length },
            { l: "Pending Tasks",     v: tasks.filter(t => t.status === "Pending").length },
            { l: "In Progress Tasks", v: tasks.filter(t => t.status === "In Progress").length },
            { l: "Under Review",      v: tasks.filter(t => t.status === "Under Review").length },
            { l: "Completed Tasks",   v: tasks.filter(t => t.status === "Completed").length },
            { l: "Active Teams",      v: [...new Set(users.filter(u => u.team).map(u => u.team))].length },
          ].map(s => (
            <div key={s.l} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f5f5f5" }}>
              <span style={{ fontSize: 13, color: "#666" }}>{s.l}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>{s.v}</span>
            </div>
          ))}
        </Card>

        {/* Audit Log */}
        <Card style={{ gridColumn: "1 / -1", minWidth: 0 }}>
          <SectionTitle icon="📝">Audit Log</SectionTitle>
          {auditLog.length === 0 ? (
            <p style={{ fontSize: 13, color: "#aaa", textAlign: "center", padding: "20px 0" }}>No activity recorded yet.</p>
          ) : (
            <div className="scroll-panel">
              {auditLog.slice(0, 20).map((e, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "9px 0", borderBottom: "1px solid #f5f5f5" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: logColor[e.type] || "#888", marginTop: 5, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 13, color: "#333" }}>{e.action}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#aaa" }}>
                    by <span style={{ fontWeight: 600, color: "#666" }}>{e.performed_by || "System"}</span>
                  </p>
                </div>
                <span style={{ fontSize: 11, color: "#bbb", whiteSpace: "nowrap" }}>{e.time}</span>
              </div>
))}
            </div>
          )}
        </Card>

      </div>
    </div>
  );
}

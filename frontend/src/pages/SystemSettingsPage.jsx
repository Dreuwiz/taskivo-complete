import { useEffect, useState, useCallback } from "react";
import { Card, SectionTitle, PageHeader } from "../components/ui/index";
import * as api from "../services/api";

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
      borderBottom: "1px solid #f0f0f0",
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
        marginBottom: 8,
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
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#bbb", marginTop: 2 }}>
        <span>{min}{suffix}</span>
        <span>{max}{suffix}</span>
      </div>
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
      borderBottom: "1px solid #f0f0f0",
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
          outline: "none",
        }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

const LOG_COLOR = {
  danger:  "#c0392b",
  info:    "#2386ff",
  success: "#27ae60",
  warning: "#c47b00",
};

export function SystemSettingsPage({ auditLog: initialAuditLog, onAuditAdd, users, tasks, settings, onSettingsChange }) {
  const [isCompact,  setIsCompact]  = useState(false);
  const [auditLog,   setAuditLog]   = useState(initialAuditLog || []);
  const [refreshing, setRefreshing] = useState(false);
  const [saveMsg,    setSaveMsg]    = useState("");

  // Keep local audit log in sync when parent updates it
  useEffect(() => { setAuditLog(initialAuditLog || []); }, [initialAuditLog]);

  useEffect(() => {
    const handleResize = () => setIsCompact(window.innerWidth <= 900);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const refreshAudit = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await api.getAudit();
      if (data) setAuditLog(data);
    } catch (e) {
      console.error("Failed to refresh audit log:", e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const showSaveMsg = (msg) => {
    setSaveMsg(msg);
    setTimeout(() => setSaveMsg(""), 2500);
  };

  const update = (key, value, label, logMsg) => {
    onSettingsChange(prev => ({ ...prev, [key]: value }));
    onAuditAdd?.(logMsg || `${label} changed`, "info");
    showSaveMsg(`✓ ${label} saved`);
  };

  const toggle = (key, label) => {
    const newVal = !settings[key];
    onSettingsChange(prev => ({ ...prev, [key]: newVal }));
    onAuditAdd?.(`${label} ${newVal ? "enabled" : "disabled"}`, newVal ? "success" : "warning");
    showSaveMsg(`✓ ${label} ${newVal ? "enabled" : "disabled"}`);
  };

  const sharedProps = { settings, onToggle: toggle, onUpdate: update, compact: isCompact };

  const statRows = [
    { l: "Total Users",       v: users.length,                                              color: "#2386ff"  },
    { l: "Total Tasks",       v: tasks.length,                                              color: "#694AD7"  },
    { l: "Pending Tasks",     v: tasks.filter(t => t.status === "Pending").length,          color: "#888"     },
    { l: "In Progress",       v: tasks.filter(t => t.status === "In Progress").length,      color: "#694AD7"  },
    { l: "Under Review",      v: tasks.filter(t => t.status === "Under Review").length,     color: "#c47b00"  },
    { l: "Completed Tasks",   v: tasks.filter(t => t.status === "Completed").length,        color: "#27ae60"  },
    { l: "Active Teams",      v: [...new Set(users.filter(u => u.team).map(u => u.team))].length, color: "#c0392b" },
    { l: "Active Users",      v: users.filter(u => u.status === "Active").length,           color: "#27ae60"  },
    { l: "Inactive Users",    v: users.filter(u => u.status !== "Active").length,           color: "#e74c3c"  },
  ];

  return (
    <div>
      <PageHeader title="System Settings" subtitle="Configure global system behavior — Admin only" />

      {/* Save confirmation toast */}
      {saveMsg && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          backgroundColor: "#1a1a1a", color: "white",
          padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600,
          boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
        }}>
          {saveMsg}
        </div>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: isCompact ? "1fr" : "minmax(0,1fr) minmax(0,1fr)",
        gap: 20,
        alignItems: "start",
        maxWidth: "100%",
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
              { value: "Low",      label: "🟢 Low"      },
              { value: "Medium",   label: "🟡 Medium"   },
              { value: "High",     label: "🔴 High"     },
              { value: "Critical", label: "🚨 Critical" },
            ]}
            {...sharedProps}
          />
          <ToggleRow
            label="Require Approval for High Priority"
            desc="Only managers/admins can assign High priority tasks"
            cfgKey="requireApprovalForHighPriority"
            {...sharedProps}
          />
          <div style={{ paddingTop: 12 }}>
            <p style={{ margin: 0, fontSize: 11, color: "#aaa" }}>
              Settings are saved automatically and persist across sessions.
            </p>
          </div>
        </Card>

        {/* System Stats */}
        <Card>
          <SectionTitle icon="📊">System Stats</SectionTitle>
          {statRows.map(s => (
            <div key={s.l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f5f5f5" }}>
              <span style={{ fontSize: 13, color: "#666" }}>{s.l}</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: s.color }}>{s.v}</span>
            </div>
          ))}
        </Card>

        {/* Audit Log */}
        <Card style={{ gridColumn: "1 / -1", minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <SectionTitle icon="📝">Audit Log</SectionTitle>
            <button
              onClick={refreshAudit}
              disabled={refreshing}
              style={{
                padding: "6px 14px", borderRadius: 7, border: "1px solid #ddd",
                backgroundColor: "white", fontSize: 12, fontWeight: 600,
                color: refreshing ? "#bbb" : "#2386ff", cursor: refreshing ? "default" : "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <i className={`fa-solid fa-rotate${refreshing ? " fa-spin" : ""}`} />
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          {auditLog.length === 0 ? (
            <p style={{ fontSize: 13, color: "#aaa", textAlign: "center", padding: "20px 0" }}>No activity recorded yet.</p>
          ) : (
            <>
              <p style={{ margin: "0 0 12px", fontSize: 11, color: "#bbb" }}>
                Showing {auditLog.length} most recent entries
              </p>
              <div className="scroll-panel">
                {auditLog.map((e, i) => (
                  <div key={e.id ?? i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "9px 0", borderBottom: "1px solid #f5f5f5" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: LOG_COLOR[e.type] || "#888", marginTop: 5, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, color: "#333", wordBreak: "break-word" }}>{e.action}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "#aaa" }}>
                        by <span style={{ fontWeight: 600, color: "#666" }}>{e.performed_by || "System"}</span>
                      </p>
                    </div>
                    <span style={{ fontSize: 11, color: "#bbb", whiteSpace: "nowrap", flexShrink: 0 }}>{e.time}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

      </div>
    </div>
  );
}

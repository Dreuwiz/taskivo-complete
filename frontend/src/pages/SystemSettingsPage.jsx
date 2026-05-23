import { useEffect, useState, useCallback } from "react";
import { Card, SectionTitle, PageHeader } from "../components/ui/index";
import * as api from "../services/api";

function ToggleRow({ label, desc, cfgKey, settings, onToggle, compact = false }) {
  const isOn = settings[cfgKey];
  return (
    <div style={{
      display: "flex", flexDirection: compact ? "column" : "row",
      justifyContent: "space-between", alignItems: compact ? "flex-start" : "center",
      gap: compact ? 12 : 16, padding: "13px 0", borderBottom: "1px solid #f0f0f0",
    }}>
      <div>
        <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "#1a1a1a" }}>{label}</p>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>{desc}</p>
      </div>
      <div onClick={() => onToggle(cfgKey, label)}
        style={{ width: 44, height: 24, borderRadius: 12, cursor: "pointer", backgroundColor: isOn ? "#2386ff" : "#ddd", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
        <div style={{ position: "absolute", top: 3, left: isOn ? 23 : 3, width: 18, height: 18, borderRadius: "50%", backgroundColor: "white", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
      </div>
    </div>
  );
}

function SliderRow({ label, desc, cfgKey, min, max, suffix = "", settings, onUpdate, compact = false }) {
  return (
    <div style={{ padding: "13px 0", borderBottom: "1px solid #f0f0f0" }}>
      <div style={{
        display: "flex", flexDirection: compact ? "column" : "row",
        justifyContent: "space-between", alignItems: compact ? "flex-start" : "stretch",
        gap: compact ? 8 : 16, marginBottom: 8,
      }}>
        <div>
          <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "#1a1a1a" }}>{label}</p>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>{desc}</p>
        </div>
        <span style={{ fontSize: 20, fontWeight: 800, color: "#2386ff", minWidth: 48, textAlign: "right" }}>
          {settings[cfgKey]}{suffix}
        </span>
      </div>
      <input type="range" min={min} max={max} value={settings[cfgKey]}
        onChange={e => onUpdate(cfgKey, +e.target.value, label, `${label} set to ${e.target.value}${suffix}`)}
        style={{ width: "100%", accentColor: "#2386ff" }} />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#bbb", marginTop: 2 }}>
        <span>{min}{suffix}</span><span>{max}{suffix}</span>
      </div>
    </div>
  );
}

function SelectRow({ label, desc, cfgKey, options, settings, onUpdate, compact = false }) {
  return (
    <div style={{
      display: "flex", flexDirection: compact ? "column" : "row",
      justifyContent: "space-between", alignItems: compact ? "flex-start" : "center",
      gap: compact ? 12 : 16, padding: "13px 0", borderBottom: "1px solid #f0f0f0",
    }}>
      <div>
        <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "#1a1a1a" }}>{label}</p>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>{desc}</p>
      </div>
      <select value={settings[cfgKey]}
        onChange={e => onUpdate(cfgKey, e.target.value, label, `${label} changed to "${e.target.value}"`)}
        style={{ width: compact ? "100%" : "auto", maxWidth: "100%", padding: "6px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, color: "#1a1a1a", backgroundColor: "white", cursor: "pointer", outline: "none" }}>
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

const LOG_ICON = {
  danger:  "fa-solid fa-circle-xmark",
  info:    "fa-solid fa-circle-info",
  success: "fa-solid fa-circle-check",
  warning: "fa-solid fa-triangle-exclamation",
};

const TYPE_FILTERS = [
  { key: "all",     label: "All",     bg: "#f0f0f0", color: "#555"    },
  { key: "success", label: "Success", bg: "#e6f9ed", color: "#27ae60" },
  { key: "info",    label: "Info",    bg: "#e8f0fe", color: "#2386ff" },
  { key: "warning", label: "Warning", bg: "#fff4e0", color: "#c47b00" },
  { key: "danger",  label: "Danger",  bg: "#fdecea", color: "#c0392b" },
];

const DATE_OPTIONS = [
  { value: "all",   label: "All Time"   },
  { value: "today", label: "Today"      },
  { value: "week",  label: "This Week"  },
  { value: "month", label: "This Month" },
];

function isWithinRange(entry, range) {
  if (range === "all") return true;
  const t = entry.time || "";
  const isMinutes = t.includes("min ago") || t === "Just now";
  const isHours   = t.includes("hr ago");
  const dayMatch  = t.match(/^(\d+)\s*day/);
  const days      = dayMatch ? parseInt(dayMatch[1]) : null;
  if (range === "today")  return isMinutes || isHours;
  if (range === "week")   return isMinutes || isHours || (days !== null && days <= 7);
  if (range === "month")  return isMinutes || isHours || (days !== null && days <= 30);
  return true;
}

export function SystemSettingsPage({ auditLog: initialAuditLog, onAuditAdd, users, tasks, settings, onSettingsChange }) {
  const [isCompact,       setIsCompact]       = useState(false);
  const [auditLog,        setAuditLog]        = useState(initialAuditLog || []);
  const [refreshing,      setRefreshing]      = useState(false);
  const [saveMsg,         setSaveMsg]         = useState("");
  const [typeFilter,      setTypeFilter]      = useState("all");
  const [performerFilter, setPerformerFilter] = useState("all");
  const [dateFilter,      setDateFilter]      = useState("all");
  const [search,          setSearch]          = useState("");

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

  // Unique performers for dropdown
  const performers = ["all", ...new Set(auditLog.map(e => e.performed_by).filter(Boolean))];

  // Apply all filters
  const filteredLog = auditLog.filter(e => {
    if (typeFilter !== "all" && e.type !== typeFilter) return false;
    if (performerFilter !== "all" && e.performed_by !== performerFilter) return false;
    if (!isWithinRange(e, dateFilter)) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!e.action?.toLowerCase().includes(q) && !e.performed_by?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const hasActiveFilters = typeFilter !== "all" || performerFilter !== "all" || dateFilter !== "all" || search;

  const clearFilters = () => {
    setTypeFilter("all");
    setPerformerFilter("all");
    setDateFilter("all");
    setSearch("");
  };

  const statRows = [
    { l: "Total Users",     v: users.length,                                                       color: "#2386ff" },
    { l: "Total Tasks",     v: tasks.length,                                                       color: "#694AD7" },
    { l: "Pending Tasks",   v: tasks.filter(t => t.status === "Pending").length,                   color: "#888"    },
    { l: "In Progress",     v: tasks.filter(t => t.status === "In Progress").length,               color: "#694AD7" },
    { l: "Under Review",    v: tasks.filter(t => t.status === "Under Review").length,              color: "#c47b00" },
    { l: "Completed Tasks", v: tasks.filter(t => t.status === "Completed").length,                 color: "#27ae60" },
    { l: "Active Teams",    v: [...new Set(users.filter(u => u.team).map(u => u.team))].length,    color: "#c0392b" },
    { l: "Active Users",    v: users.filter(u => u.status === "Active").length,                    color: "#27ae60" },
    { l: "Inactive Users",  v: users.filter(u => u.status !== "Active").length,                    color: "#e74c3c" },
  ];

  return (
    <div>
      <PageHeader title="System Settings" subtitle="Configure global system behavior — Admin only" />

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
        gap: 20, alignItems: "start", maxWidth: "100%",
      }}>

        {/* Task Settings */}
        <Card>
          <SectionTitle icon="fa-solid fa-clipboard-list">Task Settings</SectionTitle>
          <SliderRow label="Max Tasks Per Day" desc="Maximum tasks assignable per user per day"
            cfgKey="maxTasksPerDay" min={1} max={30} {...sharedProps} />
          <SelectRow label="Default Priority" desc="Priority pre-filled when creating a new task"
            cfgKey="defaultPriority"
            options={[
              { value: "Low",      label: "🟢 Low"      },
              { value: "Medium",   label: "🟡 Medium"   },
              { value: "High",     label: "🔴 High"     },
              { value: "Critical", label: "🚨 Critical" },
            ]}
            {...sharedProps} />
          <ToggleRow label="Require Approval for High Priority"
            desc="Only managers/admins can assign High priority tasks"
            cfgKey="requireApprovalForHighPriority" {...sharedProps} />
          <div style={{ paddingTop: 12 }}>
            <p style={{ margin: 0, fontSize: 11, color: "#aaa" }}>Settings are saved automatically and persist across sessions.</p>
          </div>
        </Card>

        {/* System Stats */}
        <Card>
          <SectionTitle icon="fa-solid fa-chart-bar">System Stats</SectionTitle>
          {statRows.map(s => (
            <div key={s.l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f5f5f5" }}>
              <span style={{ fontSize: 13, color: "#666" }}>{s.l}</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: s.color }}>{s.v}</span>
            </div>
          ))}
        </Card>

        {/* Audit Log */}
        <Card style={{ gridColumn: "1 / -1", minWidth: 0 }}>

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <SectionTitle icon="fa-solid fa-pen-to-square">Audit Log</SectionTitle>
            <button onClick={refreshAudit} disabled={refreshing}
              style={{
                padding: "6px 14px", borderRadius: 7, border: "1px solid #ddd",
                backgroundColor: "white", fontSize: 12, fontWeight: 600,
                color: refreshing ? "#bbb" : "#2386ff", cursor: refreshing ? "default" : "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}>
              <i className={`fa-solid fa-rotate${refreshing ? " fa-spin" : ""}`} />
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          {/* Filters row */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12, alignItems: "center" }}>

            {/* Search */}
            <div style={{ position: "relative", flex: "1 1 180px", minWidth: 160 }}>
              <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#bbb", fontSize: 11 }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search actions or performers…"
                style={{ width: "100%", padding: "7px 10px 7px 28px", borderRadius: 7, border: "1px solid #ddd", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
            </div>

            {/* Performer dropdown */}
            <select value={performerFilter} onChange={e => setPerformerFilter(e.target.value)}
              style={{ padding: "7px 10px", borderRadius: 7, border: "1px solid #ddd", fontSize: 12, outline: "none", color: "#555", backgroundColor: "white", cursor: "pointer" }}>
              {performers.map(p => (
                <option key={p} value={p}>{p === "all" ? "All Performers" : p}</option>
              ))}
            </select>

            {/* Date range dropdown */}
            <select value={dateFilter} onChange={e => setDateFilter(e.target.value)}
              style={{ padding: "7px 10px", borderRadius: 7, border: "1px solid #ddd", fontSize: 12, outline: "none", color: "#555", backgroundColor: "white", cursor: "pointer" }}>
              {DATE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {/* Clear filters */}
            {hasActiveFilters && (
              <button onClick={clearFilters}
                style={{ padding: "6px 12px", borderRadius: 20, border: "1px solid #f5c6c2", fontSize: 11, fontWeight: 600, cursor: "pointer", backgroundColor: "#fdecea", color: "#c0392b", display: "flex", alignItems: "center", gap: 4 }}>
                <i className="fa-solid fa-xmark" /> Clear
              </button>
            )}
          </div>

          {/* Type filter pills */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {TYPE_FILTERS.map(({ key, label, bg, color }) => (
              <button key={key} onClick={() => setTypeFilter(key)}
                style={{
                  padding: "4px 12px", borderRadius: 20, border: "1px solid", fontSize: 11, fontWeight: 600, cursor: "pointer",
                  borderColor: typeFilter === key ? color : "#ddd",
                  backgroundColor: typeFilter === key ? bg : "white",
                  color: typeFilter === key ? color : "#888",
                }}>
                {label}
                {key !== "all" && (
                  <span style={{ marginLeft: 5, fontSize: 10, opacity: 0.7 }}>
                    ({auditLog.filter(e => e.type === key).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Results count */}
          <p style={{ margin: "0 0 10px", fontSize: 11, color: "#bbb" }}>
            Showing <strong style={{ color: "#555" }}>{filteredLog.length}</strong> of {auditLog.length} entries
            {hasActiveFilters && <span style={{ color: "#2386ff", marginLeft: 6, cursor: "pointer", fontWeight: 600 }} onClick={clearFilters}>— clear filters</span>}
          </p>

          {/* Log entries */}
          {auditLog.length === 0 ? (
            <p style={{ fontSize: 13, color: "#aaa", textAlign: "center", padding: "20px 0" }}>No activity recorded yet.</p>
          ) : filteredLog.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <i className="fa-solid fa-filter-circle-xmark" style={{ fontSize: 28, color: "#ddd", marginBottom: 8, display: "block" }} />
              <p style={{ fontSize: 13, color: "#aaa", margin: 0 }}>No entries match your filters.</p>
              <button onClick={clearFilters} style={{ marginTop: 10, padding: "6px 14px", borderRadius: 7, border: "1px solid #ddd", fontSize: 12, fontWeight: 600, cursor: "pointer", backgroundColor: "white", color: "#2386ff" }}>
                Clear filters
              </button>
            </div>
          ) : (
            <div className="scroll-panel">
              {filteredLog.map((e, i) => (
                <div key={e.id ?? i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "9px 0", borderBottom: "1px solid #f5f5f5" }}>
                  <i className={LOG_ICON[e.type] || "fa-solid fa-circle-info"} style={{ color: LOG_COLOR[e.type] || "#888", fontSize: 15, flexShrink: 0, marginTop: 1 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, color: "#333", wordBreak: "break-word" }}>{e.action}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "#aaa" }}>
                      by <span style={{ fontWeight: 600, color: "#666" }}>{e.performed_by || "System"}</span>
                    </p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20,
                      backgroundColor: (LOG_COLOR[e.type] || "#888") + "18",
                      color: LOG_COLOR[e.type] || "#888",
                    }}>
                      {(e.type || "info").toUpperCase()}
                    </span>
                    <span style={{ fontSize: 11, color: "#bbb", whiteSpace: "nowrap" }}>{e.time}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

      </div>
    </div>
  );
}

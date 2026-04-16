import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronUp, faChevronDown, faXmark, faUsers, faBullseye, faClipboard } from "@fortawesome/free-solid-svg-icons";
import { Modal, Field } from "../ui/Modal";
import { SESSION } from "../../constants/roles";
import { inputStyle } from "../../utils/helpers";

const todayStr = () => new Date().toISOString().split("T")[0];

// ── Shared leader-role check (includes supervisor) ────────────────────────────
const isLeaderRole = (u) =>
  ["team_leader", "leader", "supervisor"].includes(u.role);

// ── AssigneeSelector ──────────────────────────────────────────────────────────
// NOTE: selectedTeam prop removed — caller pre-filters `users` instead.
// This means the dropdown is NEVER locked; TL gets full multi-select control.
function AssigneeSelector({ users, selectedNames, onChange, currentUserName }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const eligible = users.filter(u =>
    u.name !== currentUserName &&
    u.status === "Active" &&
    !isLeaderRole(u)
  );

  const byTeam = eligible.reduce((acc, u) => {
    const key = u.team || "No Team";
    if (!acc[key]) acc[key] = [];
    acc[key].push(u);
    return acc;
  }, {});

  const toggleUser = (name) => {
    onChange(selectedNames.includes(name)
      ? selectedNames.filter(n => n !== name)
      : [...selectedNames, name]
    );
  };

  const toggleTeam = (teamName) => {
    const teamNames = (byTeam[teamName] || []).map(u => u.name);
    const allSelected = teamNames.every(n => selectedNames.includes(n));
    onChange(
      allSelected
        ? selectedNames.filter(n => !teamNames.includes(n))
        : [...new Set([...selectedNames, ...teamNames])]
    );
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          ...inputStyle,
          minHeight: 38,
          cursor: "pointer",
          display: "flex", alignItems: "center", flexWrap: "wrap", gap: 5,
          userSelect: "none",
          padding: "6px 10px",
        }}
      >
        {selectedNames.length === 0 ? (
          <span style={{ color: "#bbb", fontSize: 13 }}>Select members…</span>
        ) : (
          selectedNames.map(name => (
            <span key={name} style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              backgroundColor: "#e8f0fe", color: "#2386ff",
              borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600,
            }}>
              {name}
              <span
                onClick={e => { e.stopPropagation(); toggleUser(name); }}
                style={{ cursor: "pointer", fontWeight: 800, fontSize: 14, lineHeight: 1, color: "#2386ff" }}
              >×</span>
            </span>
          ))
        )}
        <span style={{ marginLeft: "auto", color: "#bbb", fontSize: 11 }}>
          <FontAwesomeIcon icon={open ? faChevronUp : faChevronDown} />
        </span>
      </div>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 1000,
          backgroundColor: "white", border: "1px solid #ddd", borderRadius: 8,
          boxShadow: "0 6px 20px rgba(0,0,0,0.12)", maxHeight: 240, overflowY: "auto",
        }}>
          {selectedNames.length > 0 && (
            <div
              onClick={() => onChange([])}
              style={{ padding: "8px 12px", fontSize: 12, color: "#c0392b", fontWeight: 600, cursor: "pointer", borderBottom: "1px solid #f5f5f5" }}
            >
              <FontAwesomeIcon icon={faXmark} style={{ marginRight: 4 }} /> Clear all
            </div>
          )}
          {Object.keys(byTeam).length === 0 && (
            <div style={{ padding: "14px 12px", fontSize: 13, color: "#bbb", textAlign: "center" }}>
              No assignable users
            </div>
          )}
          {Object.entries(byTeam).map(([teamName, members]) => {
            const allTeamSelected = members.every(u => selectedNames.includes(u.name));
            return (
              <div key={teamName}>
                <div
                  onClick={() => toggleTeam(teamName)}
                  style={{
                    padding: "7px 12px", backgroundColor: "#f8f9fa",
                    fontSize: 11, fontWeight: 700, color: "#888",
                    textTransform: "uppercase", letterSpacing: "0.5px",
                    cursor: "pointer", display: "flex",
                    justifyContent: "space-between", alignItems: "center",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <span>{teamName === "No Team" ? "No Team" : `Team ${teamName}`}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: allTeamSelected ? "#c0392b" : "#2386ff" }}>
                    {allTeamSelected ? "Deselect all" : "Select all"}
                  </span>
                </div>
                {members.map(u => {
                  const selected = selectedNames.includes(u.name);
                  return (
                    <div
                      key={u.id}
                      onClick={() => toggleUser(u.name)}
                      style={{
                        padding: "9px 12px 9px 20px", fontSize: 13, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 10,
                        backgroundColor: selected ? "#f0f7ff" : "white",
                        borderBottom: "1px solid #f5f5f5",
                      }}
                    >
                      <div style={{
                        width: 17, height: 17, borderRadius: 4, flexShrink: 0,
                        border: `2px solid ${selected ? "#2386ff" : "#ccc"}`,
                        backgroundColor: selected ? "#2386ff" : "white",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {selected && <i className="fa-solid fa-check" style={{ color: "white", fontSize: 9 }} />}
                      </div>
                      <span style={{ fontWeight: selected ? 600 : 400, color: selected ? "#2386ff" : "#333", flex: 1 }}>
                        {u.name}
                      </span>
                      <span style={{ fontSize: 11, color: "#bbb" }}>{u.role}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── TLSelector (manager "delegate" mode) ──────────────────────────────────────
function TLSelector({ users, selectedTL, onChange }) {
  const teamLeaders = users.filter(u => u.status === "Active" && isLeaderRole(u));
  return (
    <select style={inputStyle} value={selectedTL} onChange={e => onChange(e.target.value)}>
      <option value="">— Select a team leader —</option>
      {teamLeaders.map(u => (
        <option key={u.id} value={u.name}>
          {u.name} {u.team ? `(Team ${u.team})` : ""}
        </option>
      ))}
    </select>
  );
}

// ── TaskModal ─────────────────────────────────────────────────────────────────
export function TaskModal({ mode, initial, role, users, session, defaultPriority = "Medium", onSave, onClose }) {
  const isManagerUp  = ["manager", "admin"].includes(role);
  const isTeamLeader = role === "team_leader" || role === "supervisor";

  const initAssignees = (() => {
    if (!initial) return [];
    if (initial.tlPendingAssignment) return [];
    const raw = initial.assignedTo ?? initial.assigned_to;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string" && raw.trim().startsWith("[")) {
      try { return JSON.parse(raw); } catch {}
    }
    return raw ? [raw] : [];
  })();

  const initSelectedTL = initial?.tlPendingAssignment
    ? (Array.isArray(initial.assignedTo) ? initial.assignedTo[0] : initial.assigned_to ?? "")
    : "";

  const currentTeamName = initial?.team || (isTeamLeader ? session?.team : "") || "";

  const [form, setForm] = useState({
    title:       initial?.title       || "",
    description: initial?.description || "",
    priority:    initial?.priority    || defaultPriority,
    due:         initial?.due         || "",
    status:      initial?.status      || "Pending",
    subtasks:    initial?.subtasks    || [],
    team:        currentTeamName,
  });

  // Manager assignment mode
  const [assignMode, setAssignMode] = useState(
    initial?.tlPendingAssignment ? "tl" : (mode === "add" && isManagerUp ? null : "direct")
  );

  // ── TL distribution mode: "whole" or "individual" ─────────────────────────
  const [tlMode, setTLMode] = useState("whole");

  const [selectedTL, setSelectedTL] = useState(initSelectedTL);
  const [assignees,  setAssignees]  = useState(initAssignees);
  const [newSubtask, setNewSubtask] = useState("");

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const teams = [...new Set(users.map(u => u.team).filter(Boolean))].sort();

  // Non-leader members of a given team (excluding current session user)
  const getTeamMembers = (teamName) =>
    users
      .filter(u =>
        u.team === teamName &&
        u.status === "Active" &&
        !isLeaderRole(u) &&
        u.name !== session?.name
      )
      .map(u => u.name)
      .filter(Boolean);

  // Users pre-filtered to TL's own team (for individual picker)
  const activeTeam = form.team || session?.team || "";
  const tlTeamUsers = users.filter(u =>
    u.team === activeTeam &&
    u.status === "Active" &&
    !isLeaderRole(u) &&
    u.name !== session?.name
  );

  // Switch TL distribution mode
  const handleTLModeChange = (newMode) => {
    setTLMode(newMode);
    if (newMode === "whole") {
      // Pre-select everyone
      setAssignees(getTeamMembers(activeTeam));
    } else {
      // Clear so TL picks manually
      setAssignees([]);
    }
  };

  // Initialise to whole-team on mount
  useEffect(() => {
    if (isTeamLeader) {
      setAssignees(getTeamMembers(activeTeam));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Manager direct-assign: team change
  const handleTeamChange = (newTeam) => {
    setForm(p => ({ ...p, team: newTeam }));
    if (assignMode === "direct") {
      setAssignees(newTeam ? getTeamMembers(newTeam) : []);
    }
  };

  const handleAssignModeChange = (m) => {
    setAssignMode(m);
    if (m === "tl") {
      setAssignees([]);
      setForm(p => ({ ...p, team: "" }));
    } else {
      setSelectedTL("");
    }
  };

  const addSubtask = () => {
    const title = newSubtask.trim();
    if (!title) return;
    setForm(p => ({ ...p, subtasks: [...p.subtasks, { id: Date.now(), title, done: false, userDone: {} }] }));
    setNewSubtask("");
  };
  const toggleSubtask = id =>
    setForm(p => ({ ...p, subtasks: p.subtasks.map(s => s.id === id ? { ...s, done: !s.done } : s) }));
  const removeSubtask = id =>
    setForm(p => ({ ...p, subtasks: p.subtasks.filter(s => s.id !== id) }));

  const handleSave = () => {
    if (!form.title.trim()) return alert("Task title is required.");
    if (!form.due)          return alert("Due date is required.");

    // ── Manager: delegate to TL ───────────────────────────────────────────────
    if (isManagerUp && assignMode === "tl") {
      if (!selectedTL) return alert("Please select a team leader.");
      const tlUser = users.find(u => u.name === selectedTL);
      onSave({
        ...(initial || {}),
        id:                   initial?.id || Date.now(),
        title:                form.title.trim(),
        description:          form.description.trim(),
        priority:             form.priority,
        status:               "Pending",
        due:                  form.due,
        team:                 tlUser?.team || null,
        assignedTo:           [selectedTL],
        assigned_to:          selectedTL,
        subtasks:             form.subtasks.map(s => ({ ...s, done: false, userDone: {} })),
        userCompletions:      {},
        tlPendingAssignment:  true,
        assignedByManager:    session.name,
        assignedByManagerAt:  new Date().toISOString(),
        tlAssignedBy:         initial?.tlAssignedBy        ?? null,
        tlAssignedAt:         initial?.tlAssignedAt        ?? null,
        teamLeaderReviewed:   false,
        teamLeaderApprovedBy: null,
        teamLeaderApprovedAt: null,
        rejectionReason:      null,
        rejectedBy:           null,
      });
      onClose();
      return;
    }

    // ── Manager must choose a mode ────────────────────────────────────────────
    if (isManagerUp && assignMode === null) return alert("Please select an assignment mode.");

    // ── Resolve final assignees ───────────────────────────────────────────────
    let finalAssignees;

    if (isTeamLeader) {
      finalAssignees = tlMode === "whole"
        ? getTeamMembers(activeTeam)
        : assignees.filter(Boolean);

      if (finalAssignees.length === 0) {
        return alert(
          tlMode === "individual"
            ? "Please select at least one team member to assign to."
            : `No active members found in Team ${activeTeam}. Add members first.`
        );
      }
    } else {
      // Manager direct — auto-detect a TL in the selection and reroute
      const rawSelected = form.team ? getTeamMembers(form.team) : assignees;
      const tlAssignee  = rawSelected.find(name => {
        const u = users.find(u => u.name === name);
        return u && isLeaderRole(u);
      });

      if (isManagerUp && tlAssignee) {
        const tlUser = users.find(u => u.name === tlAssignee);
        onSave({
          ...(initial || {}),
          id:                   initial?.id || Date.now(),
          title:                form.title.trim(),
          description:          form.description.trim(),
          priority:             form.priority,
          status:               "Pending",
          due:                  form.due,
          team:                 tlUser?.team || null,
          assignedTo:           [tlAssignee],
          assigned_to:          tlAssignee,
          subtasks:             form.subtasks.map(s => ({ ...s, done: false, userDone: {} })),
          userCompletions:      {},
          tlPendingAssignment:  true,
          assignedByManager:    session.name,
          assignedByManagerAt:  new Date().toISOString(),
          tlAssignedBy:         null,
          tlAssignedAt:         null,
          teamLeaderReviewed:   false,
          teamLeaderApprovedBy: null,
          teamLeaderApprovedAt: null,
          rejectionReason:      null,
          rejectedBy:           null,
        });
        onClose();
        return;
      }

      finalAssignees = rawSelected.filter(name => {
        const u = users.find(u => u.name === name);
        return u ? !isLeaderRole(u) : true;
      });
    }

    const existingCompletions = initial?.userCompletions || {};
    const userCompletions = {};
    finalAssignees.forEach(name => {
      userCompletions[name] = existingCompletions[name] ?? { done: false };
    });

    const subtasksWithUserDone = form.subtasks.map(s => {
      const existing = s.userDone || {};
      const userDone = {};
      finalAssignees.forEach(name => { userDone[name] = existing[name] ?? false; });
      const allDone = finalAssignees.length > 0 && finalAssignees.every(n => userDone[n]);
      return { ...s, userDone, done: allDone };
    });

    onSave({
      ...(initial || {}),
      id:                   initial?.id || Date.now(),
      title:                form.title.trim(),
      description:          form.description.trim(),
      priority:             form.priority,
      status:               form.status,
      due:                  form.due,
      team:                 form.team || activeTeam || null,
      assignedTo:           finalAssignees,
      assigned_to:          finalAssignees[0] || "",
      subtasks:             subtasksWithUserDone,
      userCompletions,
      tlPendingAssignment:  false,
      assignedByManager:    initial?.assignedByManager    ?? null,
      assignedByManagerAt:  initial?.assignedByManagerAt  ?? null,
      tlAssignedBy:         isTeamLeader ? session.name   : (initial?.tlAssignedBy ?? null),
      tlAssignedAt:         isTeamLeader ? new Date().toISOString() : (initial?.tlAssignedAt ?? null),
      teamLeaderReviewed:   initial?.teamLeaderReviewed   ?? false,
      teamLeaderApprovedBy: initial?.teamLeaderApprovedBy ?? null,
      teamLeaderApprovedAt: initial?.teamLeaderApprovedAt ?? null,
    });
    onClose();
  };

  const subtasks  = form.subtasks || [];
  const doneCount = subtasks.filter(s => s.done).length;

  return (
    <Modal
      title={mode === "add" ? "Add New Task" : "Edit Task"}
      onClose={onClose}
      onSubmit={handleSave}
      submitLabel={mode === "add" ? "Add Task" : "Save Changes"}
    >
      {/* ── Title ── */}
      <Field label="Task Title">
        <input
          style={inputStyle}
          value={form.title}
          onChange={set("title")}
          placeholder="Enter task title…"
        />
      </Field>

      {/* ── Description ── */}
      <Field label="Description">
        <textarea
          style={{ ...inputStyle, height: 80, resize: "vertical", lineHeight: 1.5 }}
          value={form.description}
          onChange={set("description")}
          placeholder="What needs to be done? Add context, goals, or notes…"
        />
      </Field>

      {/* ── Priority + Due ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Priority">
          <select style={inputStyle} value={form.priority} onChange={set("priority")}>
            {["Low", "Medium", "High", "Critical"].map(p => <option key={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Due Date">
          <input type="date" style={inputStyle} value={form.due} min={todayStr()} onChange={set("due")} />
        </Field>
      </div>

      {/* ── Status (edit only) ── */}
      {mode === "edit" && (
        <Field label="Status">
          <select style={inputStyle} value={form.status} onChange={set("status")}>
            {["Pending", "In Progress", "Under Review", "Completed"].map(s => <option key={s}>{s}</option>)}
          </select>
        </Field>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MANAGER / ADMIN
         ════════════════════════════════════════════════════════════════════════ */}
      {isManagerUp && (
        <>
          <Field label="Assignment Mode">
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { value: "direct", label: "Assign to members directly" },
                { value: "tl",     label: "Delegate to a team leader"  },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleAssignModeChange(opt.value)}
                  style={{
                    flex: 1, padding: "9px 0", borderRadius: 7, fontSize: 12, fontWeight: 600,
                    cursor: "pointer", transition: "all 0.15s",
                    border: `1px solid ${assignMode === opt.value ? "#2386ff" : "#ddd"}`,
                    background: assignMode === opt.value ? "#e8f0fe" : "white",
                    color: assignMode === opt.value ? "#2386ff" : "#888",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {assignMode === null && (
              <p style={{ margin: "6px 0 0", fontSize: 11, color: "#b07d00" }}>
                Please choose how to assign this task.
              </p>
            )}
          </Field>

          {assignMode === "direct" && (
            <>
              <Field label="Team">
                <select style={inputStyle} value={form.team} onChange={e => handleTeamChange(e.target.value)}>
                  <option value="">— No team (assign individually) —</option>
                  {teams.map(t => <option key={t} value={t}>Team {t}</option>)}
                </select>
              </Field>
              <Field label={
                <span>
                  Assign To
                  <span style={{ fontSize: 10, color: "#bbb", marginLeft: 6, fontWeight: 400, textTransform: "none" }}>
                    — leaders excluded; each assignee marks done independently
                  </span>
                </span>
              }>
                <AssigneeSelector
                  users={form.team
                    ? users.filter(u => u.team === form.team && !isLeaderRole(u))
                    : users}
                  selectedNames={assignees}
                  onChange={setAssignees}
                  currentUserName={session?.name}
                />
                {assignees.length > 0 && (
                  <p style={{ margin: "4px 0 0", fontSize: 11, color: "#888" }}>
                    {assignees.length} assignee{assignees.length !== 1 ? "s" : ""} selected
                    {form.team ? ` from Team ${form.team}` : ""} — each will mark done independently
                  </p>
                )}
              </Field>
            </>
          )}

          {assignMode === "tl" && (
            <Field label="Team Leader">
              <TLSelector users={users} selectedTL={selectedTL} onChange={setSelectedTL} />
              {selectedTL && (
                <p style={{ margin: "5px 0 0", fontSize: 11, color: "#2386ff", backgroundColor: "#e8f0fe", border: "1px solid #c5d8fc", borderRadius: 6, padding: "6px 10px" }}>
                  <FontAwesomeIcon icon={faClipboard} style={{ marginRight: 4 }} />
                  {selectedTL} will receive this task and distribute it to their team members.
                </p>
              )}
            </Field>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          TEAM LEADER / SUPERVISOR
          — locked team, but FREE choice of whole-team or individual multi-select
         ════════════════════════════════════════════════════════════════════════ */}
      {isTeamLeader && (
        <>
          {/* Readonly team label */}
          <Field label="Team">
            <input
              value={activeTeam}
              readOnly
              style={{ ...inputStyle, backgroundColor: "#f8f9fa", color: "#888" }}
            />
          </Field>

          <Field label="Assign To">
            {/* ── Mode toggle ── */}
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              {[
                { value: "whole",      icon: faUsers,    label: "Whole Team"        },
                { value: "individual", icon: faBullseye, label: "Individual Members" },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleTLModeChange(opt.value)}
                  style={{
                    flex: 1, padding: "9px 0", borderRadius: 7, fontSize: 12, fontWeight: 600,
                    cursor: "pointer", transition: "all 0.15s",
                    border: `1px solid ${tlMode === opt.value ? "#2386ff" : "#ddd"}`,
                    background: tlMode === opt.value ? "#e8f0fe" : "white",
                    color: tlMode === opt.value ? "#2386ff" : "#888",
                  }}
                >
                  <FontAwesomeIcon icon={opt.icon} style={{ marginRight: 6 }} />
                  {opt.label}
                </button>
              ))}
            </div>

            {/* ── Whole team ── */}
            {tlMode === "whole" && (
              <>
                {getTeamMembers(activeTeam).length === 0 ? (
                  <p style={{
                    fontSize: 12, color: "#c0392b", backgroundColor: "#fdecea",
                    border: "1px solid #f5c6c2", borderRadius: 6, padding: "8px 12px", margin: 0,
                  }}>
                    ⚠ No active members found in Team {activeTeam}. Add members before creating tasks.
                  </p>
                ) : (
                  <>
                    <div style={{
                      border: "1px solid #ddd", borderRadius: 7, padding: "8px 10px",
                      display: "flex", flexWrap: "wrap", gap: 6, backgroundColor: "#f8f9fa",
                    }}>
                      {getTeamMembers(activeTeam).map(name => (
                        <span key={name} style={{
                          display: "inline-flex", alignItems: "center",
                          backgroundColor: "#e8f0fe", color: "#2386ff",
                          borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600,
                        }}>
                          {name}
                        </span>
                      ))}
                      <span style={{ marginLeft: "auto", fontSize: 11, color: "#b07d00", fontWeight: 600, alignSelf: "center" }}>
                        🔒 All
                      </span>
                    </div>
                    <p style={{ margin: "5px 0 0", fontSize: 11, color: "#888" }}>
                      All {getTeamMembers(activeTeam).length} active member{getTeamMembers(activeTeam).length !== 1 ? "s" : ""} of Team {activeTeam} will be assigned — each marks done independently.
                    </p>
                  </>
                )}
              </>
            )}

            {/* ── Individual — unlocked multi-select, pre-filtered to TL's team ── */}
            {tlMode === "individual" && (
              <>
                {tlTeamUsers.length === 0 ? (
                  <p style={{
                    fontSize: 12, color: "#c0392b", backgroundColor: "#fdecea",
                    border: "1px solid #f5c6c2", borderRadius: 6, padding: "8px 12px", margin: 0,
                  }}>
                    ⚠ No active members found in Team {activeTeam}.
                  </p>
                ) : (
                  <>
                    <AssigneeSelector
                      users={tlTeamUsers}
                      selectedNames={assignees}
                      onChange={setAssignees}
                      currentUserName={session?.name}
                    />
                    {assignees.length > 0 ? (
                      <p style={{ margin: "4px 0 0", fontSize: 11, color: "#888" }}>
                        {assignees.length} member{assignees.length !== 1 ? "s" : ""} selected — each will mark done independently
                      </p>
                    ) : (
                      <p style={{ margin: "4px 0 0", fontSize: 11, color: "#b07d00" }}>
                        Select at least one team member to assign this task.
                      </p>
                    )}
                  </>
                )}
              </>
            )}
          </Field>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          USER — read-only
         ════════════════════════════════════════════════════════════════════════ */}
      {!isManagerUp && !isTeamLeader && (
        <Field label="Assign To">
          <input style={{ ...inputStyle, opacity: 0.6 }} value={session?.name || ""} readOnly />
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#aaa" }}>
            Tasks can only be assigned by Team Leaders or above.
          </p>
        </Field>
      )}

      {/* ── Subtasks ── */}
      <Field label={`Subtasks${subtasks.length > 0 ? ` (${doneCount}/${subtasks.length} fully done)` : ""}`}>
        {subtasks.length > 0 && (
          <>
            <div style={{ height: 5, borderRadius: 3, backgroundColor: "#e0e0e0", overflow: "hidden", marginBottom: 6 }}>
              <div style={{
                height: "100%", borderRadius: 3, backgroundColor: "#2ecc71",
                transition: "width 0.3s",
                width: `${subtasks.length ? (doneCount / subtasks.length) * 100 : 0}%`,
              }} />
            </div>
            <p style={{ margin: "0 0 8px", fontSize: 11, color: "#bbb" }}>
              Each assignee marks subtasks done independently. A subtask is fully done when all assignees complete it.
            </p>
          </>
        )}

        {subtasks.map(s => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: "1px solid #f5f5f5" }}>
            <div
              onClick={() => toggleSubtask(s.id)}
              style={{
                width: 18, height: 18, borderRadius: 4,
                border: `2px solid ${s.done ? "#2ecc71" : "#ccc"}`,
                backgroundColor: s.done ? "#2ecc71" : "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", flexShrink: 0,
              }}
            >
              {s.done && <i className="fa-solid fa-check" style={{ color: "white", fontSize: 9 }} />}
            </div>
            <span style={{ flex: 1, fontSize: 13, color: s.done ? "#aaa" : "#333", textDecoration: s.done ? "line-through" : "none" }}>
              {s.title}
            </span>
            <button onClick={() => removeSubtask(s.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", fontSize: 13 }}>
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        ))}

        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <input
            value={newSubtask}
            onChange={e => setNewSubtask(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSubtask())}
            placeholder="Add a subtask…"
            style={{ ...inputStyle, flex: 1, padding: "7px 10px", fontSize: 13 }}
          />
          <button
            onClick={addSubtask}
            style={{
              padding: "7px 14px", borderRadius: 7, border: "none",
              backgroundColor: "#2386ff", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            Add
          </button>
        </div>
        <p style={{ margin: "5px 0 0", fontSize: 11, color: "#bbb" }}>Press Enter or click Add to create a subtask.</p>
      </Field>
    </Modal>
  );
}
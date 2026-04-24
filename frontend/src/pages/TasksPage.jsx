import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faPlus, faInbox, faPen, faXmark, faUsers, faBullseye, faClipboard, faClock } from "@fortawesome/free-solid-svg-icons";
import { SESSION } from "../constants/roles";
import { PRIORITY_STYLE, STATUS_STYLE, btnStyle } from "../utils/helpers";
import { Badge, Card, PageHeader } from "../components/ui/index";
import { TaskModal } from "../components/modals/TaskModal";
import { ConfirmModal } from "../components/modals/ConfirmModal";
import { RejectModal } from "../components/modals/RejectModal";

// ── Shared leader-role check (includes supervisor) ────────────────────────────
const isLeaderRole = (u) =>
  ["team_leader", "leader", "supervisor"].includes(u.role);

// ── assignedTo normaliser ─────────────────────────────────────────────────────
const getNames = t => {
  const raw = t.assignedTo ?? t.assigned_to ?? null;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed.filter(Boolean) : (trimmed ? [trimmed] : []);
      } catch { return trimmed ? [trimmed] : []; }
    }
    if (trimmed.includes(",")) return trimmed.split(",").map(s => s.trim()).filter(Boolean);
    return trimmed ? [trimmed] : [];
  }
  return [];
};

const getAssignedUserIds = (t) => {
  const raw = t.assignedUserIds ?? t.assigned_user_ids ?? t.assigned_user_id ?? null;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(Number).filter(Number.isInteger);
  if (typeof raw === "number") return Number.isInteger(raw) ? [raw] : [];
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed.map(Number).filter(Number.isInteger) : [];
      } catch {
        return [];
      }
    }
    const parsed = Number(trimmed);
    return Number.isInteger(parsed) ? [parsed] : [];
  }
  return [];
};

const getTeam = t => t.team || null;
const getDesc = t => t.description || "";
const getSubs = t => t.subtasks || [];

// ── Per-user completion helpers ───────────────────────────────────────────────
const getUserCompletions = t => t.userCompletions || {};
const isUserDone         = (t, name) => getUserCompletions(t)[name]?.done ?? false;
const countDone          = t => getNames(t).filter(n => isUserDone(t, n)).length;

// ── TL-pending-assignment helpers ─────────────────────────────────────────────
const isTLPendingTask = (t, session) =>
  t.tlPendingAssignment === true &&
  (
    getAssignedUserIds(t).includes(session?.id) ||
    getNames(t).some(n => n?.toLowerCase().trim() === session?.name?.toLowerCase().trim())
  );

// ── Effective team resolution ─────────────────────────────────────────────────
const getEffectiveTeam = (t, users) => {
  if (t.team) return t.team;
  if (!users || !users.length) return null;
  for (const id of getAssignedUserIds(t)) {
    const u = users.find((user) => user.id === id);
    if (u?.team && !isLeaderRole(u)) return u.team;
  }
  for (const name of getNames(t)) {
    const u = users.find(u => u.name?.toLowerCase().trim() === name?.toLowerCase().trim());
    if (u?.team && !isLeaderRole(u)) return u.team;
  }
  return null;
};

// ── Review routing helpers ────────────────────────────────────────────────────
const needsTLReview  = (t, users) =>
  t.status === "Under Review" && !!getEffectiveTeam(t, users) && t.teamLeaderReviewed !== true;
const needsMgrReview = (t, users) =>
  t.status === "Under Review" && (!getEffectiveTeam(t, users) || t.teamLeaderReviewed === true);

// ── TL Assignment Panel ───────────────────────────────────────────────────────
function TLAssignmentPanel({ task, session, users, onAssigned }) {
  const teamMembers = (users ?? []).filter(
    u => u.team === session.team &&
         u.status === "Active" &&
         !isLeaderRole(u)
  );

  const [assignMode, setAssignMode] = useState(null);
  const [selected,   setSelected]   = useState([]);

  const toggleMember = name =>
    setSelected(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );

  const selectAll = () => setSelected(teamMembers.map(u => u.name).filter(Boolean));
  const clearAll  = () => setSelected([]);

  const handleModeChange = mode => {
    setAssignMode(mode);
    if (mode === "whole") {
      setSelected(teamMembers.map(u => u.name).filter(Boolean));
    } else {
      setSelected([]);
    }
  };

  const handleAssign = () => {
    if (selected.length === 0) return;

    const subtasks = getSubs(task).map(s => ({
      ...s,
      done: false,
      userDone: Object.fromEntries(selected.map(n => [n, false])),
    }));

    const updated = {
      ...task,
      assignedTo:          selected,
      assignedUserIds:     teamMembers.filter((u) => selected.includes(u.name)).map((u) => u.id),
      tlPendingAssignment: false,
      tlAssignedBy:        session.name,
      tlAssignedAt:        new Date().toISOString(),
      status:              "In Progress",
      userCompletions:     Object.fromEntries(selected.map(n => [n, { done: false }])),
      subtasks,
      team:                session.team,
    };

    onAssigned(updated);
  };

  return (
    <div style={{
      backgroundColor: "#f0f4ff",
      border: "1px solid #c5d8fc",
      borderRadius: 10,
      padding: "16px 18px",
      marginBottom: 20,
    }}>
      <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 800, color: "#2386ff", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        <FontAwesomeIcon icon={faClipboard} style={{ marginRight: 6 }} /> Assign to Team Members
      </p>
      <p style={{ margin: "0 0 14px", fontSize: 12, color: "#2386ff" }}>
        This task was delegated to you by <strong>{task.assignedByManager}</strong>. Choose how to distribute it.
      </p>

      {/* ── Mode selector ── */}
      {assignMode === null && (
        <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
          <button
            onClick={() => handleModeChange("whole")}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid #c5d8fc",
              background: "white", color: "#2386ff", fontSize: 13, fontWeight: 700,
              cursor: "pointer",
            }}>
            <FontAwesomeIcon icon={faUsers} style={{ marginRight: 6 }} /> Assign to Whole Team
          </button>
          <button
            onClick={() => handleModeChange("individual")}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid #c5d8fc",
              background: "white", color: "#2386ff", fontSize: 13, fontWeight: 700,
              cursor: "pointer",
            }}>
            <FontAwesomeIcon icon={faBullseye} style={{ marginRight: 6 }} /> Assign Individually
          </button>
        </div>
      )}

      {/* ── Whole-team mode ── */}
      {assignMode === "whole" && (
        <>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            backgroundColor: "#e8f0fe", border: "1px solid #c5d8fc",
            borderRadius: 8, padding: "10px 14px", marginBottom: 12,
          }}>
            <span style={{ fontSize: 13, color: "#2386ff", fontWeight: 600 }}>
              ✓ All {teamMembers.length} Team {session.team} members will be assigned
            </span>
            <button
              onClick={() => handleModeChange(null)}
              style={{ marginLeft: "auto", background: "none", border: "none", color: "#2386ff", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
              Change
            </button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
            {teamMembers.map(u => (
              <span key={u.name} style={{
                fontSize: 12, fontWeight: 600, backgroundColor: "#e6f9ed",
                color: "#27ae60", borderRadius: 20, padding: "3px 10px",
                border: "1px solid #a8e6bf",
              }}>
                ✓ {u.name}
              </span>
            ))}
          </div>
        </>
      )}

      {/* ── Individual mode ── */}
      {assignMode === "individual" && (
        <>
          <div style={{ display: "flex", gap: 6, marginBottom: 10, alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#2386ff" }}>Select members:</span>
            <button onClick={selectAll}
              style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "1px solid #c5d8fc",
                background: "#ddeeff", color: "#2386ff", cursor: "pointer", fontWeight: 700 }}>
              Select All
            </button>
            <button onClick={clearAll}
              style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "1px solid #ddd",
                background: "white", color: "#888", cursor: "pointer" }}>
              Clear
            </button>
            <button
              onClick={() => { setAssignMode(null); setSelected([]); }}
              style={{ marginLeft: "auto", fontSize: 11, padding: "4px 10px", borderRadius: 6,
                border: "1px solid #ddd", background: "white", color: "#888", cursor: "pointer" }}>
              ← Back
            </button>
          </div>

          {teamMembers.length === 0 ? (
            <p style={{ fontSize: 13, color: "#aaa", fontStyle: "italic" }}>
              No active team members found for Team {session.team}.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
              {teamMembers.map(u => {
                const checked = selected.includes(u.name);
                return (
                  <label key={u.name} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 12px", borderRadius: 7,
                    border: `1px solid ${checked ? "#a8e6bf" : "#dde8fc"}`,
                    backgroundColor: checked ? "#f0fdf4" : "white",
                    cursor: "pointer", transition: "all 0.15s",
                  }}>
                    <div
                      onClick={() => toggleMember(u.name)}
                      style={{
                        width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                        border: `2px solid ${checked ? "#27ae60" : "#ccc"}`,
                        backgroundColor: checked ? "#27ae60" : "white",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer",
                      }}>
                      {checked && <i className="fa-solid fa-check" style={{ color: "white", fontSize: 9 }} />}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: checked ? "#27ae60" : "#333" }}>
                      {u.name}
                    </span>
                    {u.position && (
                      <span style={{ fontSize: 11, color: "#aaa", marginLeft: "auto" }}>{u.position}</span>
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Assign button ── */}
      {assignMode !== null && (
        <button
          onClick={handleAssign}
          disabled={selected.length === 0}
          style={{
            width: "100%", padding: "10px 0", borderRadius: 8, border: "none",
            fontSize: 13, fontWeight: 700,
            cursor: selected.length ? "pointer" : "not-allowed",
            background: selected.length ? "#2386ff" : "#e0e0e0",
            color: selected.length ? "white" : "#aaa",
            transition: "background 0.2s",
          }}>
          {selected.length === 0
            ? "Select members to assign"
            : `Assign to ${selected.length} member${selected.length !== 1 ? "s" : ""}`}
        </button>
      )}
    </div>
  );
}

// ── TaskDetailPanel ───────────────────────────────────────────────────────────
function TaskDetailPanel({ task, role, session, onClose, onUpdateTask, users }) {
  const subtasks  = getSubs(task);
  const assignees = getNames(task);
  const myName    = session.name;

  const isUser       = role === "user";
  const isTeamLeader = role === "team_leader" || role === "supervisor";
  const isManagerUp  = ["manager", "admin"].includes(role);
  const canReview    = isTeamLeader || isManagerUp;

  const effectiveTeam   = getEffectiveTeam(task, users);
  const tlPending       = isTLPendingTask(task, session);

  const showTLActions      = isTeamLeader && needsTLReview(task, users) && effectiveTeam === session.team;
  const showManagerActions = isManagerUp  && needsMgrReview(task, users);

  const mySubsDoneCount = subtasks.filter(s => s.userDone?.[myName] ?? false).length;
  const mySubsDone      = subtasks.length === 0 || mySubsDoneCount === subtasks.length;
  const myPct           = subtasks.length ? Math.round((mySubsDoneCount / subtasks.length) * 100) : 0;
  const myMarkedDone    = isUserDone(task, myName);

  const overallSubsDone = subtasks.filter(s => s.done).length;
  const overallPct      = subtasks.length ? Math.round((overallSubsDone / subtasks.length) * 100) : 0;

  const teamDoneCount = countDone(task);
  const teamTotal     = assignees.length;

  const toggleSubtask = sid => {
    if (myMarkedDone) return;
    const newSubtasks = subtasks.map(s => {
      if (s.id !== sid) return s;
      const prev        = s.userDone?.[myName] ?? false;
      const newUserDone = { ...(s.userDone || {}), [myName]: !prev };
      const allDone     = assignees.length > 0 && assignees.every(n => newUserDone[n] ?? false);
      return { ...s, userDone: newUserDone, done: allDone };
    });
    onUpdateTask({ ...task, subtasks: newSubtasks });
  };

  const handleMarkComplete = () => {
    const updatedCompletions = {
      ...getUserCompletions(task),
      [myName]: { done: true, completedAt: new Date().toISOString() },
    };
    const allDone = assignees.length > 0 && assignees.every(n => updatedCompletions[n]?.done);
    const needsTL = allDone && !!effectiveTeam;

    onUpdateTask({
      ...task,
      userCompletions: updatedCompletions,
      ...(allDone ? {
        status:               "Under Review",
        rejectionReason:      null,
        rejectedBy:           null,
        teamLeaderReviewed:   needsTL ? false : null,
        teamLeaderApprovedBy: needsTL ? null : undefined,
        teamLeaderApprovedAt: needsTL ? null : undefined,
      } : {}),
    });
  };

  const handleTLApprove = () => {
    onUpdateTask({
      ...task,
      teamLeaderReviewed:   true,
      teamLeaderApprovedBy: myName,
      teamLeaderApprovedAt: new Date().toISOString(),
    });
  };

  const handleTLAssigned = updated => {
    onUpdateTask(updated);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 900, display: "flex" }} onClick={onClose}>
      <div style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.25)" }} />
      <div
        style={{
          width: 460, backgroundColor: "white", height: "100vh", overflowY: "auto",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.12)", display: "flex", flexDirection: "column",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: "22px 24px 16px", borderBottom: "1px solid #f0f0f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#1a1a1a", lineHeight: 1.3 }}>
              {task.title}
            </h2>
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#aaa", flexShrink: 0 }}>
              ×
            </button>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <Badge
              label={task.priority}
              style={{ backgroundColor: PRIORITY_STYLE[task.priority]?.bg, color: PRIORITY_STYLE[task.priority]?.text }}
            />
            {tlPending
              ? <Badge label="Pending Assignment" style={{ backgroundColor: "#e8f0fe", color: "#2386ff" }} />
              : <Badge label={task.status} style={{ backgroundColor: STATUS_STYLE[task.status]?.bg, color: STATUS_STYLE[task.status]?.text }} />
            }
            {effectiveTeam && (
              <Badge label={`Team ${effectiveTeam}`} style={{ backgroundColor: "#f0f0f0", color: "#555" }} />
            )}
            {!tlPending && teamTotal > 0 && (
              <Badge
                label={`${teamDoneCount}/${teamTotal} members done`}
                style={{
                  backgroundColor: teamDoneCount === teamTotal ? "#e6f9ed" : "#f0f0f0",
                  color: teamDoneCount === teamTotal ? "#27ae60" : "#888",
                }}
              />
            )}
          </div>
          {tlPending && task.assignedByManager && (
            <p style={{ margin: "8px 0 0", fontSize: 12, color: "#888" }}>
              Assigned to you by <strong>{task.assignedByManager}</strong>
              {task.assignedByManagerAt ? ` on ${new Date(task.assignedByManagerAt).toLocaleDateString()}` : ""}
            </p>
          )}
          {!tlPending && task.tlAssignedBy && (
            <p style={{ margin: "8px 0 0", fontSize: 12, color: "#888" }}>
              Distributed by <strong>{task.tlAssignedBy}</strong> (Team Leader)
            </p>
          )}
        </div>

        <div style={{ padding: "20px 24px", flex: 1 }}>

          {/* ── TL assignment panel ── */}
          {isTeamLeader && tlPending && (
            <TLAssignmentPanel
              task={task}
              session={session}
              users={users}
              onAssigned={handleTLAssigned}
            />
          )}

          {/* ── Rejection banner ── */}
          {task.rejectionReason && (
            <div style={{
              backgroundColor: "#fdecea", border: "1px solid #f5c6c2",
              borderRadius: 8, padding: "12px 14px", marginBottom: 20,
            }}>
              <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: "#c0392b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                ⚠ Rejected — Needs Revision
              </p>
              <p style={{ margin: 0, fontSize: 13, color: "#7b1e1e", lineHeight: 1.5 }}>{task.rejectionReason}</p>
              {task.rejectedBy && (
                <p style={{ margin: "6px 0 0", fontSize: 11, color: "#c0392b" }}>
                  by <strong>{task.rejectedBy}</strong>
                </p>
              )}
            </div>
          )}

          {/* ── TL review actions ── */}
          {showTLActions && (
            <div style={{
              backgroundColor: "#fff8e0", border: "1px solid #f5e090",
              borderRadius: 8, padding: "14px 16px", marginBottom: 20,
            }}>
              <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#b07d00", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <FontAwesomeIcon icon={faClock} style={{ marginRight: 4 }} /> Step 1 of 2 — Your Review Required
              </p>
              <p style={{ margin: "0 0 12px", fontSize: 12, color: "#b07d00" }}>
                All {teamTotal} assignee{teamTotal !== 1 ? "s" : ""} have completed their tasks.
                Approve to escalate to manager, or reject to send back.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={handleTLApprove}
                  style={{ flex: 1, padding: "8px 0", borderRadius: 7, border: "none", background: "#27ae60", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  ✓ Approve & Escalate to Manager
                </button>
                <button
                  onClick={() => onUpdateTask({ ...task, __requestReject: true })}
                  style={{ flex: 1, padding: "8px 0", borderRadius: 7, border: "none", background: "#c0392b", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  <FontAwesomeIcon icon={faXmark} style={{ marginRight: 4 }} /> Reject
                </button>
              </div>
            </div>
          )}

          {isTeamLeader && task.status === "Under Review" && task.teamLeaderReviewed === true && (
            <div style={{
              backgroundColor: "#e6f9ed", border: "1px solid #a8e6bf",
              borderRadius: 8, padding: "12px 14px", marginBottom: 20,
            }}>
              <p style={{ margin: 0, fontSize: 13, color: "#27ae60", fontWeight: 600 }}>
                ✓ You approved this task — awaiting final review by manager/admin.
              </p>
              {task.teamLeaderApprovedBy && (
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "#27ae60" }}>
                  Approved by <strong>{task.teamLeaderApprovedBy}</strong>
                </p>
              )}
            </div>
          )}

          {/* ── Manager review actions ── */}
          {showManagerActions && (
            <div style={{
              backgroundColor: "#fff8e0", border: "1px solid #f5e090",
              borderRadius: 8, padding: "14px 16px", marginBottom: 20,
            }}>
              <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#b07d00", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <FontAwesomeIcon icon={faClock} style={{ marginRight: 4 }} /> {effectiveTeam ? "Step 2 of 2 — Final Review" : "Review Required"}
              </p>
              {effectiveTeam && task.teamLeaderApprovedBy && (
                <p style={{ margin: "0 0 10px", fontSize: 12, color: "#b07d00" }}>
                  ✓ Pre-approved by team leader <strong>{task.teamLeaderApprovedBy}</strong>
                </p>
              )}
              {!effectiveTeam && (
                <p style={{ margin: "0 0 10px", fontSize: 12, color: "#b07d00" }}>
                  Assignee has no team — task comes directly to you for review.
                </p>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => onUpdateTask({ ...task, status: "Completed", rejectionReason: null, rejectedBy: null, reviewedBy: myName })}
                  style={{ flex: 1, padding: "8px 0", borderRadius: 7, border: "none", background: "#27ae60", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  ✓ Approve & Complete
                </button>
                <button
                  onClick={() => onUpdateTask({ ...task, __requestReject: true })}
                  style={{ flex: 1, padding: "8px 0", borderRadius: 7, border: "none", background: "#c0392b", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  <FontAwesomeIcon icon={faXmark} style={{ marginRight: 4 }} /> Reject
                </button>
              </div>
            </div>
          )}

          {isManagerUp && needsTLReview(task, users) && (
            <div style={{
              backgroundColor: "#f0f4ff", border: "1px solid #c5d8fc",
              borderRadius: 8, padding: "12px 14px", marginBottom: 20,
            }}>
              <p style={{ margin: 0, fontSize: 13, color: "#2386ff", fontWeight: 600 }}>
                <FontAwesomeIcon icon={faClock} style={{ marginRight: 4 }} /> Step 1 of 2 in progress — waiting for Team {effectiveTeam}'s leader to review before this reaches you.
              </p>
            </div>
          )}

          {isManagerUp && task.tlPendingAssignment && (
            <div style={{
              backgroundColor: "#f0f4ff", border: "1px solid #c5d8fc",
              borderRadius: 8, padding: "12px 14px", marginBottom: 20,
            }}>
              <p style={{ margin: 0, fontSize: 13, color: "#2386ff", fontWeight: 600 }}>
                <FontAwesomeIcon icon={faClipboard} style={{ marginRight: 4 }} /> Pending — waiting for <strong>{getNames(task)[0]}</strong> (Team Leader) to assign this to team members.
              </p>
            </div>
          )}

          {isUser && task.status === "Under Review" && (
            <div style={{
              backgroundColor: "#fff8e0", border: "1px solid #f5e090",
              borderRadius: 8, padding: "12px 14px", marginBottom: 20,
            }}>
              <p style={{ margin: 0, fontSize: 13, color: "#b07d00", fontWeight: 600 }}>
                <FontAwesomeIcon icon={faClock} style={{ marginRight: 4 }} />
                {effectiveTeam
                  ? "Submitted — your team leader will review first, then it goes to manager/admin."
                  : "Submitted — waiting for review by manager/admin."}
              </p>
            </div>
          )}

          {isUser && myMarkedDone && task.status !== "Under Review" && task.status !== "Completed" && (
            <div style={{
              backgroundColor: "#e6f9ed", border: "1px solid #a8e6bf",
              borderRadius: 8, padding: "12px 14px", marginBottom: 20,
            }}>
              <p style={{ margin: 0, fontSize: 13, color: "#27ae60", fontWeight: 600 }}>
                ✓ You've marked your part done — waiting for {teamTotal - teamDoneCount} other member{teamTotal - teamDoneCount !== 1 ? "s" : ""} to finish.
              </p>
            </div>
          )}

          {/* ── Meta grid ── */}
          {!tlPending && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 22 }}>
              <div style={{
                padding: "10px 14px", borderRadius: 8, backgroundColor: "#f8f9fa",
                gridColumn: assignees.length > 1 ? "1 / -1" : undefined,
              }}>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.5px" }}>Assigned To</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                  {assignees.length === 0
                    ? <span style={{ fontSize: 14, fontWeight: 600, color: "#bbb" }}>—</span>
                    : assignees.map(name => {
                        const done = isUserDone(task, name);
                        return (
                          <span key={name} style={{
                            fontSize: 12, fontWeight: 600,
                            color: done ? "#27ae60" : "#1a1a1a",
                            backgroundColor: done ? "#e6f9ed" : "#e8f0fe",
                            borderRadius: 20, padding: "3px 10px",
                            border: `1px solid ${done ? "#a8e6bf" : "transparent"}`,
                          }}>
                            {done ? "✓ " : ""}{name}
                          </span>
                        );
                      })
                  }
                </div>
              </div>
              <div style={{ padding: "10px 14px", borderRadius: 8, backgroundColor: "#f8f9fa" }}>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.5px" }}>Due Date</p>
                <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>{task.due || "—"}</p>
              </div>
            </div>
          )}

          {tlPending && (
            <div style={{ padding: "10px 14px", borderRadius: 8, backgroundColor: "#f8f9fa", marginBottom: 22 }}>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.5px" }}>Due Date</p>
              <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>{task.due || "—"}</p>
            </div>
          )}

          {/* ── Description ── */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.5px" }}>Description</p>
            {getDesc(task) ? (
              <p style={{ margin: 0, fontSize: 14, color: "#444", lineHeight: 1.65, backgroundColor: "#f8f9fa", borderRadius: 8, padding: "12px 14px" }}>
                {getDesc(task)}
              </p>
            ) : (
              <p style={{ margin: 0, fontSize: 13, color: "#bbb", fontStyle: "italic" }}>No description provided.</p>
            )}
          </div>

          {/* ── Team progress (reviewer view) ── */}
          {canReview && !tlPending && assignees.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.5px" }}>Team Progress</p>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#555" }}>{teamDoneCount}/{teamTotal} done</span>
              </div>
              {assignees.map(name => {
                const done     = isUserDone(task, name);
                const userSubs = subtasks.filter(s => s.userDone?.[name] ?? false).length;
                return (
                  <div key={name} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 12px", borderRadius: 8, marginBottom: 6,
                    backgroundColor: done ? "#f0fdf4" : "#f8f9fa",
                    border: `1px solid ${done ? "#a8e6bf" : "#e8e8e8"}`,
                  }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                      backgroundColor: done ? "#27ae60" : "#e0e0e0",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {done
                        ? <i className="fa-solid fa-check" style={{ color: "white", fontSize: 10 }} />
                        : <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#bbb", display: "block" }} />
                      }
                    </div>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: done ? "#27ae60" : "#333" }}>{name}</span>
                    {subtasks.length > 0 && (
                      <span style={{ fontSize: 11, color: "#aaa" }}>{userSubs}/{subtasks.length} subtasks</span>
                    )}
                    <span style={{ fontSize: 11, fontWeight: 700, color: done ? "#27ae60" : "#bbb" }}>
                      {done ? "Done ✓" : "Pending"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Subtasks ── */}
          {!tlPending && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {isUser ? "Your Subtasks" : "Subtasks (all members)"}
                </p>
                {subtasks.length > 0 && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#555" }}>
                    {isUser ? `${mySubsDoneCount}/${subtasks.length} your tasks` : `${overallSubsDone}/${subtasks.length} fully done`}
                  </span>
                )}
              </div>

              {subtasks.length > 0 && (
                <div style={{ height: 5, borderRadius: 3, backgroundColor: "#e0e0e0", overflow: "hidden", marginBottom: 12 }}>
                  <div style={{
                    height: "100%", borderRadius: 3,
                    backgroundColor: (isUser ? myPct : overallPct) === 100 ? "#2ecc71" : "#2386ff",
                    transition: "width 0.4s",
                    width: `${isUser ? myPct : overallPct}%`,
                  }} />
                </div>
              )}

              {subtasks.length === 0 ? (
                <p style={{ margin: 0, fontSize: 13, color: "#bbb", fontStyle: "italic" }}>No subtasks yet.</p>
              ) : (
                <>
                  {isUser && subtasks.map(s => {
                    const myDone = s.userDone?.[myName] ?? false;
                    return (
                      <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid #f5f5f5" }}>
                        <div
                          onClick={() => toggleSubtask(s.id)}
                          style={{
                            width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                            border: `2px solid ${myDone ? "#2ecc71" : "#ccc"}`,
                            backgroundColor: myDone ? "#2ecc71" : "white",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: myMarkedDone ? "default" : "pointer",
                            opacity: myMarkedDone ? 0.6 : 1, transition: "all 0.15s",
                          }}
                        >
                          {myDone && <i className="fa-solid fa-check" style={{ color: "white", fontSize: 10 }} />}
                        </div>
                        <span style={{ flex: 1, fontSize: 14, color: myDone ? "#bbb" : "#333", textDecoration: myDone ? "line-through" : "none", lineHeight: 1.4 }}>
                          {s.title}
                        </span>
                        {myDone && <span style={{ fontSize: 11, color: "#27ae60", fontWeight: 700 }}>✓ Done</span>}
                      </div>
                    );
                  })}

                  {canReview && subtasks.map(s => {
                    const doneByCount = assignees.filter(n => s.userDone?.[n] ?? false).length;
                    const allSubDone  = doneByCount === assignees.length && assignees.length > 0;
                    return (
                      <div key={s.id} style={{ padding: "9px 0", borderBottom: "1px solid #f5f5f5" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: assignees.length > 1 ? 6 : 0 }}>
                          <div style={{
                            width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                            border: `2px solid ${allSubDone ? "#2ecc71" : "#ccc"}`,
                            backgroundColor: allSubDone ? "#2ecc71" : "white",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            {allSubDone && <i className="fa-solid fa-check" style={{ color: "white", fontSize: 10 }} />}
                          </div>
                          <span style={{ flex: 1, fontSize: 14, color: allSubDone ? "#bbb" : "#333", textDecoration: allSubDone ? "line-through" : "none" }}>
                            {s.title}
                          </span>
                          <span style={{ fontSize: 11, color: "#888", fontWeight: 600 }}>{doneByCount}/{assignees.length}</span>
                        </div>
                        {assignees.length > 1 && (
                          <div style={{ display: "flex", gap: 4, paddingLeft: 30, flexWrap: "wrap" }}>
                            {assignees.map(n => {
                              const done = s.userDone?.[n] ?? false;
                              return (
                                <span key={n} style={{
                                  fontSize: 10, padding: "2px 8px", borderRadius: 20,
                                  backgroundColor: done ? "#e6f9ed" : "#f0f0f0",
                                  color: done ? "#27ae60" : "#aaa",
                                  fontWeight: 600, border: `1px solid ${done ? "#a8e6bf" : "transparent"}`,
                                }}>
                                  {done ? "✓ " : ""}{n}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}

              {isUser && task.status !== "Completed" && task.status !== "Under Review" && !myMarkedDone && (
                <button
                  onClick={handleMarkComplete}
                  disabled={!mySubsDone}
                  title={
                    !mySubsDone
                      ? `Complete all your subtasks first (${mySubsDoneCount}/${subtasks.length} done)`
                      : effectiveTeam
                        ? "Mark done — goes to your team leader for review first"
                        : "Mark done — goes directly to manager/admin for review"
                  }
                  style={{
                    marginTop: 16, width: "100%", padding: "10px 0", borderRadius: 8,
                    border: "none", fontSize: 13, fontWeight: 700,
                    cursor: mySubsDone ? "pointer" : "not-allowed",
                    background: mySubsDone ? "#27ae60" : "#e0e0e0",
                    color: mySubsDone ? "white" : "#aaa",
                    transition: "background 0.2s",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}>
                  <i className="fa-solid fa-check" />
                  {mySubsDone
                    ? "Mark as Done"
                    : `Complete your subtasks first (${mySubsDoneCount}/${subtasks.length})`}
                </button>
              )}

              {isUser && myMarkedDone && task.status !== "Completed" && task.status !== "Under Review" && (
                <div style={{ marginTop: 16, padding: "10px 16px", borderRadius: 8, backgroundColor: "#e6f9ed", border: "1px solid #a8e6bf", textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#27ae60" }}>
                    ✓ Marked as Done — awaiting {teamTotal - teamDoneCount} other{teamTotal - teamDoneCount !== 1 ? "s" : ""}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── TasksPage ─────────────────────────────────────────────────────────────────
export function TasksPage({
  role,
  tasks,
  users,
  settings = {},
  initialFilter = "All",
  sessionData,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
}) {
  const session = sessionData ?? SESSION[role];
  if (!session) return <div style={{ padding: 32 }}>Loading tasks...</div>;

  const isManagerUp  = ["manager", "admin"].includes(role);
  const isTeamLeader = role === "team_leader" || role === "supervisor";

  const [statusFilter, setStatusFilter] = useState(initialFilter);
  useEffect(() => { setStatusFilter(initialFilter); }, [initialFilter]);

  const [showAdd,      setShowAdd]      = useState(false);
  const [editTask,     setEditTask]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewTask,     setViewTask]     = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [search,       setSearch]       = useState("");

  const canAdd    = isTeamLeader || isManagerUp;
  const canEdit   = isTeamLeader || isManagerUp;
  const canDelete = isManagerUp;
  const canReview = isTeamLeader || isManagerUp;

  const maxTasksPerDay                 = settings?.maxTasksPerDay                 ?? 10;
  const requireApprovalForHighPriority = settings?.requireApprovalForHighPriority ?? false;
  const defaultPriority                = settings?.defaultPriority                ?? "Medium";

  // ── Badge counts ──────────────────────────────────────────────────────────
  const pendingReviewCount = (() => {
    if (!canReview) return 0;
    if (isTeamLeader) {
      return tasks.filter(t =>
        needsTLReview(t, users) && getEffectiveTeam(t, users) === session.team
      ).length;
    }
    return tasks.filter(t => needsMgrReview(t, users)).length;
  })();

  const pendingAssignmentCount = isTeamLeader
    ? tasks.filter(t => isTLPendingTask(t, session)).length
    : 0;

  const canReviewTask = t => {
    if (t.status !== "Under Review") return false;
    if (isTeamLeader)
      return needsTLReview(t, users) && getEffectiveTeam(t, users) === session.team;
    if (role === "manager" || role === "admin")
      return needsMgrReview(t, users);
    return false;
  };

  const validateNewTask = task => {
    const assignees = getNames(task);
    const team      = getTeam(task);
    const resolved  = team
      ? (users?.filter(u => u.team === team && !isLeaderRole(u)).map(u => u.name).filter(Boolean) ?? [])
      : assignees;

    if (resolved.length > 0) {
      const today = new Date().toDateString();
      for (const name of resolved) {
        const count = tasks.filter(t =>
          getNames(t).includes(name) && t.createdAt &&
          new Date(t.createdAt).toDateString() === today
        ).length;
        if (count >= maxTasksPerDay) {
          alert(`Task limit reached: "${name}" already has ${count} task(s) today (max: ${maxTasksPerDay}).`);
          return false;
        }
      }
    }
    if (requireApprovalForHighPriority && task.priority === "High" && !["manager", "admin"].includes(role)) {
      alert("High priority tasks require manager or admin approval.");
      return false;
    }
    return true;
  };

  const handleAddTask = task => {
    if (!validateNewTask(task)) return;
    onAddTask({ ...task, createdAt: new Date().toISOString() });
  };

  const handleUpdateTask = task => {
    if (task.__requestReject) {
      const { __requestReject, ...clean } = task;
      setRejectTarget(clean);
      return;
    }
    if (requireApprovalForHighPriority && task.priority === "High" && !["manager", "admin"].includes(role)) {
      alert("High priority tasks require manager or admin approval.");
      return;
    }
    onUpdateTask(task);
    if (viewTask?.id === task.id) setViewTask(task);
  };

  const handleReject = reason => {
    const resetCompletions = {};
    getNames(rejectTarget).forEach(n => { resetCompletions[n] = { done: false }; });
    const resetSubtasks = getSubs(rejectTarget).map(s => ({
      ...s, done: false,
      userDone: Object.fromEntries(getNames(rejectTarget).map(n => [n, false])),
    }));
    const rejected = {
      ...rejectTarget,
      status:               "In Progress",
      rejectionReason:      reason,
      rejectedBy:           session.name,
      reviewedBy:           null,
      teamLeaderReviewed:   false,
      teamLeaderApprovedBy: null,
      teamLeaderApprovedAt: null,
      userCompletions:      resetCompletions,
      subtasks:             resetSubtasks,
    };
    onUpdateTask(rejected);
    if (viewTask?.id === rejected.id) setViewTask(rejected);
    setRejectTarget(null);
  };

  const handleMarkDone = task => {
    const subtasks      = getSubs(task);
    const myName        = session.name;
    const effectiveTeam = getEffectiveTeam(task, users);

    if (subtasks.length > 0) {
      const myDoneCount = subtasks.filter(s => s.userDone?.[myName] ?? false).length;
      if (myDoneCount < subtasks.length) {
        alert(`Complete all your subtasks first (${myDoneCount}/${subtasks.length} done).`);
        return;
      }
    }

    const updatedCompletions = {
      ...getUserCompletions(task),
      [myName]: { done: true, completedAt: new Date().toISOString() },
    };
    const assignees = getNames(task);
    const allDone   = assignees.length > 0 && assignees.every(n => updatedCompletions[n]?.done);
    const needsTL   = allDone && !!effectiveTeam;

    const updated = {
      ...task,
      userCompletions: updatedCompletions,
      ...(allDone ? {
        status:               "Under Review",
        rejectionReason:      null,
        rejectedBy:           null,
        teamLeaderReviewed:   needsTL ? false : null,
        teamLeaderApprovedBy: needsTL ? null : undefined,
        teamLeaderApprovedAt: needsTL ? null : undefined,
      } : {}),
    };
    onUpdateTask(updated);
    if (viewTask?.id === updated.id) setViewTask(updated);
  };

  // ── Task scoping ──────────────────────────────────────────────────────────
  const rawTasks = (() => {
    if (role === "user") {
      const norm = session.name?.toLowerCase().trim();
      return tasks.filter(t =>
        !t.tlPendingAssignment &&
        getNames(t).some(n => n?.toLowerCase().trim() === norm)
      );
    }
    if (isTeamLeader) {
      return tasks.filter(t =>
        getEffectiveTeam(t, users) === session.team ||
        isTLPendingTask(t, session)
      );
    }
    return tasks;
  })();

  const filtered = rawTasks
    .filter(t => {
      if (statusFilter === "All") return true;
      if (t.tlPendingAssignment) return false;
      return t.status === statusFilter;
    })
    .filter(t => {
      const q = search.toLowerCase();
      return t.title.toLowerCase().includes(q) || getNames(t).some(n => n.toLowerCase().includes(q));
    });

  const scopeLabel = {
    user:        "Your assigned tasks",
    team_leader: `Team ${session.team} — all tasks`,
    supervisor:  `Team ${session.team} — all tasks`,
    manager:     "All department tasks",
    admin:       "All system tasks",
  }[role];

  return (
    <div>
      <PageHeader title="Tasks" subtitle={scopeLabel} />

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        {canAdd && (
          <button onClick={() => setShowAdd(true)} style={btnStyle("#38d96e", "#fff")}>
            <i className="fa-solid fa-plus" style={{ marginRight: 6 }} />Add Task
          </button>
        )}

        {isTeamLeader && pendingAssignmentCount > 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "6px 14px", borderRadius: 20,
            backgroundColor: "#e8f0fe", border: "1px solid #c5d8fc",
            fontSize: 12, fontWeight: 700, color: "#2386ff",
          }}>
            <span style={{
              width: 18, height: 18, borderRadius: "50%", backgroundColor: "#2386ff",
              color: "white", fontSize: 10, fontWeight: 800,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {pendingAssignmentCount}
            </span>
            task{pendingAssignmentCount !== 1 ? "s" : ""} awaiting your assignment
          </div>
        )}

        <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
          {["All", "Pending", "In Progress", "Under Review", "Completed"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              style={{
                padding: "7px 13px", borderRadius: 20, border: "1px solid", fontSize: 12, fontWeight: 600,
                cursor: "pointer", position: "relative",
                borderColor: statusFilter === s ? "#2386ff" : "#ddd",
                backgroundColor: statusFilter === s ? "#2386ff" : "white",
                color: statusFilter === s ? "white" : "#666",
              }}>
              {s}
              {s === "Under Review" && canReview && pendingReviewCount > 0 && (
                <span style={{
                  position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%",
                  backgroundColor: "#e74c3c", color: "white", fontSize: 9, fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid white",
                }}>
                  {pendingReviewCount > 9 ? "9+" : pendingReviewCount}
                </span>
              )}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search tasks…"
          style={{ padding: "7px 12px", borderRadius: 7, border: "1px solid #ddd", fontSize: 13, outline: "none", width: 180 }}
        />
      </div>

      {filtered.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 48, color: "#aaa" }}>
          <i className="fa-solid fa-inbox" style={{ fontSize: 32, marginBottom: 12, display: "block" }} />
          <p style={{ margin: 0, fontSize: 15 }}>
            {statusFilter === "Under Review" ? "No tasks pending review." : "No tasks found."}
          </p>
        </Card>
      ) : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div className="scroll-panel">
            <div className="table-responsive">
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8f9fa", borderBottom: "1px solid #eee" }}>
                {["Task", "Assigned To", "Team", "Priority", "Status", "Due", "Progress", "Actions"].map(h => (
                  <th key={h} style={{
                    padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700,
                    color: "#aaa", textTransform: "uppercase", letterSpacing: "0.6px", whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => {
                const subtasks      = getSubs(t);
                const assignees     = getNames(t);
                const effectiveTeam = getEffectiveTeam(t, users);
                const isUnderReview = t.status === "Under Review";
                const isCompleted   = t.status === "Completed";
                const isTLPending   = t.tlPendingAssignment === true;
                const myName        = session.name;

                const mySubsDoneCount = subtasks.filter(s => s.userDone?.[myName] ?? false).length;
                const mySubsDone      = subtasks.length === 0 || mySubsDoneCount === subtasks.length;
                const myMarkedDone    = isUserDone(t, myName);
                const canSubmit       = !myMarkedDone && !isCompleted && !isUnderReview && mySubsDone;

                const teamDone    = countDone(t);
                const teamTotal   = assignees.length;
                const overallDone = subtasks.filter(s => s.done).length;

                const showMyProgress      = role === "user" && subtasks.length > 0;
                const showTeamProgress    = canReview && teamTotal > 1 && !isTLPending;
                const showOverallSubtasks = canReview && subtasks.length > 0 && !isTLPending;
                const thisCanReview       = canReviewTask(t);

                const rowBg = isTLPending ? "#f0f4ff"
                  : isUnderReview ? "#fffdf0"
                  : "transparent";

                return (
                  <tr key={t.id}
                    onClick={() => setViewTask(t)}
                    style={{
                      borderBottom: i < filtered.length - 1 ? "1px solid #f0f0f0" : "none",
                      cursor: "pointer", backgroundColor: rowBg,
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "#fafbff"}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = rowBg}
                  >
                    {/* Task name */}
                    <td style={{ padding: "12px 16px", maxWidth: 220 }}>
                      <p style={{
                        margin: 0, fontSize: 14, fontWeight: 600,
                        color: isCompleted ? "#aaa" : "#222",
                        textDecoration: isCompleted ? "line-through" : "none",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}>
                        {t.title}
                      </p>
                      {getDesc(t) && (
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: "#bbb", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {getDesc(t)}
                        </p>
                      )}
                      {t.rejectionReason && (
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: "#c0392b", fontWeight: 600 }}>
                          ⚠ Rejected — needs revision
                        </p>
                      )}
                      {isTLPending && isTeamLeader && (
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: "#2386ff", fontWeight: 600 }}>
                          <FontAwesomeIcon icon={faClipboard} style={{ marginRight: 4 }} /> Assign to your team members
                        </p>
                      )}
                      {isTLPending && isManagerUp && (
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: "#2386ff", fontWeight: 600 }}>
                          <FontAwesomeIcon icon={faClipboard} style={{ marginRight: 4 }} /> Waiting for TL to assign
                        </p>
                      )}
                      {isUnderReview && thisCanReview && (
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: "#b07d00", fontWeight: 600 }}>
                          <FontAwesomeIcon icon={faClock} style={{ marginRight: 4 }} /> {isTeamLeader ? "Step 1: Needs your review" : "Step 2: Needs your review"}
                        </p>
                      )}
                      {isUnderReview && isManagerUp && !thisCanReview && effectiveTeam && (
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: "#2386ff", fontWeight: 600 }}>
                          <FontAwesomeIcon icon={faClock} style={{ marginRight: 4 }} /> Awaiting Team {effectiveTeam} leader review
                        </p>
                      )}
                    </td>

                    {/* Assigned To */}
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#555" }}>
                      {isTLPending ? (
                        <span style={{ fontSize: 11, color: "#2386ff", fontWeight: 600, fontStyle: "italic" }}>Not yet assigned</span>
                      ) : assignees.length === 0 ? (
                        <span style={{ color: "#ccc" }}>Unassigned</span>
                      ) : assignees.length === 1 ? (
                        <span>{assignees[0]}</span>
                      ) : (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {assignees.slice(0, 2).map(n => (
                            <span key={n} style={{
                              fontSize: 11, borderRadius: 10, padding: "2px 8px", fontWeight: 600, whiteSpace: "nowrap",
                              backgroundColor: isUserDone(t, n) ? "#e6f9ed" : "#e8f0fe",
                              color: isUserDone(t, n) ? "#27ae60" : "#2386ff",
                            }}>
                              {isUserDone(t, n) ? "✓ " : ""}{n}
                            </span>
                          ))}
                          {assignees.length > 2 && (
                            <span style={{ fontSize: 11, backgroundColor: "#f0f0f0", color: "#888", borderRadius: 10, padding: "2px 8px", fontWeight: 600 }}>
                              +{assignees.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Team */}
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#777" }}>
                      {effectiveTeam
                        ? <Badge label={`Team ${effectiveTeam}`} style={{ backgroundColor: "#f0f4ff", color: "#2386ff" }} />
                        : session.team && isTLPending
                          ? <Badge label={`Team ${session.team}`} style={{ backgroundColor: "#f0f4ff", color: "#2386ff" }} />
                          : "—"}
                    </td>

                    {/* Priority */}
                    <td style={{ padding: "12px 16px" }}>
                      <Badge
                        label={t.priority || "—"}
                        style={{
                          backgroundColor: PRIORITY_STYLE[t.priority]?.bg || "#f0f0f0",
                          color: PRIORITY_STYLE[t.priority]?.text || "#888",
                        }}
                      />
                    </td>

                    {/* Status */}
                    <td style={{ padding: "12px 16px" }}>
                      {isTLPending ? (
                        <span style={{
                          background: "#e8f0fe", color: "#2386ff",
                          borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 700,
                          whiteSpace: "nowrap", display: "inline-block",
                        }}>
                          Pending Assignment
                        </span>
                      ) : (
                        <span style={{
                          background: STATUS_STYLE[t.status]?.bg, color: STATUS_STYLE[t.status]?.text,
                          borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 700,
                          whiteSpace: "nowrap", display: "inline-block",
                        }}>
                          {t.status}
                        </span>
                      )}
                    </td>

                    {/* Due */}
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#888", whiteSpace: "nowrap" }}>{t.due || "—"}</td>

                    {/* Progress */}
                    <td style={{ padding: "12px 16px", minWidth: 130 }}>
                      {isTLPending ? (
                        <span style={{ fontSize: 12, color: "#ccc" }}>—</span>
                      ) : (
                        <>
                          {showMyProgress && (
                            <div style={{ marginBottom: showTeamProgress ? 6 : 0 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                                <span style={{ fontSize: 10, color: "#aaa" }}>Your subtasks</span>
                                <span style={{ fontSize: 10, color: mySubsDone ? "#27ae60" : "#888", fontWeight: 700 }}>
                                  {mySubsDoneCount}/{subtasks.length}
                                </span>
                              </div>
                              <div style={{ height: 4, borderRadius: 2, backgroundColor: "#e0e0e0", overflow: "hidden" }}>
                                <div style={{
                                  height: "100%", borderRadius: 2,
                                  backgroundColor: mySubsDone ? "#2ecc71" : "#2386ff",
                                  width: `${subtasks.length ? (mySubsDoneCount / subtasks.length) * 100 : 0}%`,
                                  transition: "width 0.3s",
                                }} />
                              </div>
                            </div>
                          )}
                          {showTeamProgress && (
                            <div style={{ marginBottom: showOverallSubtasks ? 5 : 0 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                                <span style={{ fontSize: 10, color: "#aaa" }}>Members done</span>
                                <span style={{ fontSize: 10, color: teamDone === teamTotal ? "#27ae60" : "#888", fontWeight: 700 }}>
                                  {teamDone}/{teamTotal}
                                </span>
                              </div>
                              <div style={{ height: 4, borderRadius: 2, backgroundColor: "#e0e0e0", overflow: "hidden" }}>
                                <div style={{
                                  height: "100%", borderRadius: 2,
                                  backgroundColor: teamDone === teamTotal ? "#2ecc71" : "#2386ff",
                                  width: `${teamTotal ? (teamDone / teamTotal) * 100 : 0}%`,
                                  transition: "width 0.3s",
                                }} />
                              </div>
                            </div>
                          )}
                          {showOverallSubtasks && (
                            <div>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                                <span style={{ fontSize: 10, color: "#aaa" }}>Subtasks</span>
                                <span style={{ fontSize: 10, color: "#888", fontWeight: 700 }}>
                                  {overallDone}/{subtasks.length}
                                </span>
                              </div>
                              <div style={{ height: 4, borderRadius: 2, backgroundColor: "#e0e0e0", overflow: "hidden" }}>
                                <div style={{
                                  height: "100%", borderRadius: 2,
                                  backgroundColor: overallDone === subtasks.length ? "#2ecc71" : "#aaa",
                                  width: `${subtasks.length ? (overallDone / subtasks.length) * 100 : 0}%`,
                                  transition: "width 0.3s",
                                }} />
                              </div>
                            </div>
                          )}
                          {!showMyProgress && !showTeamProgress && !showOverallSubtasks && (
                            <span style={{ fontSize: 12, color: "#ccc" }}>—</span>
                          )}
                        </>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "12px 16px" }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: "flex", gap: 6 }}>
                        {canEdit ? (
                          <>
                            {isTLPending && isTeamLeader ? (
                              <button
                                onClick={() => setViewTask(t)}
                                style={{
                                  background: "#e8f0fe", border: "1px solid #c5d8fc", borderRadius: 5,
                                  padding: "4px 12px", fontSize: 12, color: "#2386ff", cursor: "pointer", fontWeight: 700,
                                }}>
                                <FontAwesomeIcon icon={faClipboard} style={{ marginRight: 4 }} /> Assign
                              </button>
                            ) : (
                              <button
                                onClick={() => setEditTask(t)}
                                style={{
                                  background: "#f0f7ff", border: "1px solid #d9e8fc", borderRadius: 5,
                                  padding: "4px 10px", fontSize: 12, color: "#2386ff", cursor: "pointer",
                                }}>
                                <i className="fa-solid fa-pen" />
                              </button>
                            )}
                            {thisCanReview && !isTLPending && (
                              <>
                                <button
                                  onClick={() => {
                                    if (isTeamLeader) {
                                      handleUpdateTask({
                                        ...t,
                                        teamLeaderReviewed:   true,
                                        teamLeaderApprovedBy: session.name,
                                        teamLeaderApprovedAt: new Date().toISOString(),
                                      });
                                    } else {
                                      handleUpdateTask({
                                        ...t, status: "Completed",
                                        rejectionReason: null, rejectedBy: null, reviewedBy: session.name,
                                      });
                                    }
                                  }}
                                  title={isTeamLeader ? "Approve & Escalate to Manager" : "Approve & Complete"}
                                  style={{
                                    background: "#e6f9ed", border: "1px solid #a8e6bf", borderRadius: 5,
                                    padding: "4px 10px", fontSize: 12, color: "#27ae60", cursor: "pointer", fontWeight: 700,
                                  }}>
                                  ✓
                                </button>
                                <button
                                  onClick={() => setRejectTarget(t)}
                                  title="Reject"
                                  style={{
                                    background: "#fdecea", border: "1px solid #f5c6c2", borderRadius: 5,
                                    padding: "4px 10px", fontSize: 12, color: "#c0392b", cursor: "pointer", fontWeight: 700,
                                  }}>
                                  <FontAwesomeIcon icon={faXmark} />
                                </button>
                              </>
                            )}
                          </>
                        ) : (
                          <button
                            onClick={() => handleMarkDone(t)}
                            disabled={!canSubmit}
                            title={
                              isCompleted     ? "Task completed"
                              : isUnderReview ? "Waiting for review"
                              : myMarkedDone  ? "You've already marked your part done"
                              : !mySubsDone   ? `Complete your subtasks first (${mySubsDoneCount}/${subtasks.length})`
                              : effectiveTeam ? "Mark done — goes to team leader first"
                                              : "Mark done — goes to manager/admin"
                            }
                            style={{
                              background: myMarkedDone || isCompleted ? "#e6f9ed" : canSubmit ? "#e6f9ed" : "#f0f0f0",
                              border: `1px solid ${myMarkedDone || isCompleted ? "#a8e6bf" : canSubmit ? "#a8e6bf" : "#ddd"}`,
                              borderRadius: 5, padding: "4px 10px", fontSize: 12,
                              color: myMarkedDone || isCompleted ? "#27ae60" : canSubmit ? "#27ae60" : "#bbb",
                              cursor: canSubmit ? "pointer" : "default",
                              fontWeight: 600, whiteSpace: "nowrap",
                              display: "inline-flex", alignItems: "center", gap: 4,
                            }}>
                            {!isUnderReview && <i className="fa-solid fa-check" />}
                            {isCompleted     ? "Done"
                             : isUnderReview ? "In Review"
                             : myMarkedDone  ? "Your Part"
                                             : "Mark Done"}
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setDeleteTarget(t)}
                            style={{
                              background: "#fdecea", border: "1px solid #f5c6c2", borderRadius: 5,
                              padding: "4px 10px", fontSize: 12, color: "#c0392b", cursor: "pointer",
                            }}>
                            <i className="fa-solid fa-trash" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
            </div>
          </div>
        </Card>
      )}

      {viewTask && (
        <TaskDetailPanel
          task={viewTask} role={role} session={session} users={users}
          onClose={() => setViewTask(null)} onUpdateTask={handleUpdateTask}
        />
      )}
      {showAdd && (
        <TaskModal
          mode="add" role={role} users={users} session={session} defaultPriority={defaultPriority}
          onSave={handleAddTask} onClose={() => setShowAdd(false)}
        />
      )}
      {editTask && (
        <TaskModal
          mode="edit" role={role} users={users} session={session} initial={editTask} defaultPriority={defaultPriority}
          onSave={t => { handleUpdateTask(t); setEditTask(null); }}
          onClose={() => setEditTask(null)}
        />
      )}
      {deleteTarget && (
        <ConfirmModal
          message={`Delete "${deleteTarget.title}"? This cannot be undone.`}
          onConfirm={() => {
            onDeleteTask(deleteTarget.id);
            setDeleteTarget(null);
            if (viewTask?.id === deleteTarget.id) setViewTask(null);
          }}
          onClose={() => setDeleteTarget(null)}
        />
      )}
      {rejectTarget && (
        <RejectModal task={rejectTarget} onConfirm={handleReject} onClose={() => setRejectTarget(null)} />
      )}
    </div>
  );
}

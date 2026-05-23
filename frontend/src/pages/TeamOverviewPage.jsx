import { useState } from "react";
import { SESSION, ROLES } from "../constants/roles";
import { Avatar, Badge, Card, SectionTitle, PageHeader } from "../components/ui/index";
import { RejectModal } from "../components/modals/RejectModal";
import { PRIORITY_STYLE, STATUS_STYLE, POINTS_BY_PRIORITY, calcPoints } from "../utils/helpers";

const isTaskAssignedToUser = (task, user) => {
  const assignedUserIds = Array.isArray(task.assignedUserIds)
    ? task.assignedUserIds
    : [task.assigned_user_id].filter((id) => Number.isInteger(id));
  const assignees = Array.isArray(task.assignedTo)
    ? task.assignedTo
    : [task.assignedTo ?? task.assigned_to].filter(Boolean);
  return assignedUserIds.includes(user.id) || assignees.some(name => name === user.name);
};

function MemberTaskDrawer({ member, tasks, onClose }) {
  const [statusFilter, setStatusFilter] = useState("All");
  const memberTasks = tasks.filter(t => isTaskAssignedToUser(t, member));
  const points = calcPoints(tasks, member.name);

  const filtered = statusFilter === "All"
    ? memberTasks
    : memberTasks.filter(t => t.status === statusFilter);

  const done      = memberTasks.filter(t => t.status === "Completed").length;
  const inProg    = memberTasks.filter(t => t.status === "In Progress").length;
  const pending   = memberTasks.filter(t => t.status === "Pending").length;
  const reviewing = memberTasks.filter(t => t.status === "Under Review").length;

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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <Avatar initials={member.avatar} color={ROLES[member.role]?.color || "#888"} size={44} />
              <div>
                <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: "#1a1a1a" }}>{member.name}</p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>{member.email}</p>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#aaa" }}>×</button>
          </div>

          {/* Points + stats row */}
          <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            <div style={{ padding: "8px 14px", borderRadius: 10, backgroundColor: "#fff8e0", border: "1px solid #f5e090", textAlign: "center", flex: 1 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#b07d00", textTransform: "uppercase" }}>Points</p>
              <p style={{ margin: "2px 0 0", fontSize: 22, fontWeight: 900, color: "#b07d00" }}>{points}</p>
            </div>
            <div style={{ padding: "8px 14px", borderRadius: 10, backgroundColor: "#e6f9ed", border: "1px solid #a8e6bf", textAlign: "center", flex: 1 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#27ae60", textTransform: "uppercase" }}>Completed</p>
              <p style={{ margin: "2px 0 0", fontSize: 22, fontWeight: 900, color: "#27ae60" }}>{done}</p>
            </div>
            <div style={{ padding: "8px 14px", borderRadius: 10, backgroundColor: "#ede9fc", border: "1px solid #c5b8f5", textAlign: "center", flex: 1 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#694AD7", textTransform: "uppercase" }}>In Progress</p>
              <p style={{ margin: "2px 0 0", fontSize: 22, fontWeight: 900, color: "#694AD7" }}>{inProg}</p>
            </div>
            <div style={{ padding: "8px 14px", borderRadius: 10, backgroundColor: "#f0f0f0", border: "1px solid #ddd", textAlign: "center", flex: 1 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase" }}>Pending</p>
              <p style={{ margin: "2px 0 0", fontSize: 22, fontWeight: 900, color: "#888" }}>{pending + reviewing}</p>
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ padding: "12px 24px", borderBottom: "1px solid #f0f0f0", display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["All", "Pending", "In Progress", "Under Review", "Completed"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              style={{
                padding: "5px 12px", borderRadius: 20, border: "1px solid", fontSize: 11, fontWeight: 600, cursor: "pointer",
                borderColor: statusFilter === s ? "#694AD7" : "#ddd",
                backgroundColor: statusFilter === s ? "#694AD7" : "white",
                color: statusFilter === s ? "white" : "#666",
              }}>
              {s}
            </button>
          ))}
        </div>

        {/* Task list */}
        <div style={{ padding: "16px 24px", flex: 1 }}>
          {filtered.length === 0 ? (
            <p style={{ color: "#bbb", fontSize: 13, fontStyle: "italic", textAlign: "center", marginTop: 32 }}>No tasks found.</p>
          ) : (
            filtered.map(t => {
              const pts = POINTS_BY_PRIORITY[t.priority] ?? 10;
              return (
                <div key={t.id} style={{
                  padding: "12px 14px", borderRadius: 10, marginBottom: 10,
                  border: "1px solid #f0f0f0", backgroundColor: "#fafbff",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <p style={{
                      margin: 0, fontSize: 14, fontWeight: 600, color: t.status === "Completed" ? "#aaa" : "#1a1a1a",
                      textDecoration: t.status === "Completed" ? "line-through" : "none", flex: 1,
                    }}>{t.title}</p>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap",
                      backgroundColor: t.status === "Completed" ? "#fff8e0" : "#f0f0f0",
                      color: t.status === "Completed" ? "#b07d00" : "#888",
                    }}>
                      {t.status === "Completed" ? `+${pts} pts` : `${pts} pts`}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                      backgroundColor: PRIORITY_STYLE[t.priority]?.bg || "#f0f0f0",
                      color: PRIORITY_STYLE[t.priority]?.text || "#888",
                    }}>{t.priority}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                      backgroundColor: STATUS_STYLE[t.status]?.bg || "#f0f0f0",
                      color: STATUS_STYLE[t.status]?.text || "#888",
                    }}>{t.status}</span>
                    {t.due && <span style={{ fontSize: 11, color: "#aaa" }}>Due: {t.due}</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export function TeamOverviewPage({ role, tasks, users, onUpdateTask }) {
  const session = SESSION[role];
  if (!session) return <div style={{ padding: 32 }}>Loading team overview...</div>;

  const [rejectTarget,  setRejectTarget]  = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);

  const members       = users.filter(u => u.team === session.team && u.role === "user");
  const pendingReview = tasks.filter(t =>
    t.status === "Under Review" &&
    t.teamLeaderReviewed !== true &&
    (t.team === session.team || members.some(u => isTaskAssignedToUser(t, u)))
  );

  const handleApprove = t => onUpdateTask({
    ...t,
    teamLeaderReviewed:   true,
    teamLeaderApprovedBy: session.name,
    teamLeaderApprovedAt: new Date().toISOString(),
  });

  const handleReject = reason => {
    const assignees = Array.isArray(rejectTarget.assignedTo)
      ? rejectTarget.assignedTo
      : [rejectTarget.assignedTo ?? rejectTarget.assigned_to].filter(Boolean);
    const resetCompletions = Object.fromEntries(assignees.map(n => [n, { done: false }]));
    const resetSubtasks = (rejectTarget.subtasks || []).map(s => ({
      ...s, done: false,
      userDone: Object.fromEntries(assignees.map(n => [n, false])),
    }));
    onUpdateTask({
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
    });
    setRejectTarget(null);
  };

  return (
    <div>
      <PageHeader title="Team Overview" subtitle={`Team ${session.team} — your direct reports`} />
      <div className="grid-responsive" style={{ maxWidth: "100%", marginBottom: 30 }}>
        {members.map(u => {
          const ut     = tasks.filter(t => isTaskAssignedToUser(t, u));
          const done   = ut.filter(t => t.status === "Completed").length;
          const pct    = ut.length ? Math.round((done / ut.length) * 100) : 0;
          const points = calcPoints(tasks, u.name);
          return (
            <Card
              key={u.id}
              style={{ display: "flex", gap: 14, alignItems: "flex-start", cursor: "pointer", transition: "box-shadow 0.15s" }}
              onClick={() => setSelectedMember(u)}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.10)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = ""}
            >
              <Avatar initials={u.avatar} color={ROLES[u.role]?.color || "#888"} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#1a1a1a" }}>{u.name}</p>
                <p style={{ margin: "2px 0 10px", fontSize: 12, color: "#888" }}>{u.email}</p>
                <div style={{ display: "flex", gap: 14, fontSize: 12, color: "#555", flexWrap: "wrap" }}>
                  <span>Tasks <strong>{ut.length}</strong></span>
                  <span>Done <strong style={{ color: "#27ae60" }}>{done}</strong></span>
                  <span><i className="fa-solid fa-fire" style={{ color: "#e74c3c", marginRight: 3 }} />{u.streak || 0}d</span>
                  <span style={{ marginLeft: "auto", fontWeight: 700, color: "#b07d00" }}>
                    <i className="fa-solid fa-star" style={{ marginRight: 4, fontSize: 11 }} />{points} pts
                  </span>
                </div>
                <div style={{ marginTop: 10, height: 5, borderRadius: 3, backgroundColor: "#e0e0e0", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, backgroundColor: pct >= 70 ? "#2ecc71" : pct >= 40 ? "#f0ad00" : "#e74c3c", borderRadius: 3 }} />
                </div>
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "#aaa" }}>{pct}% complete</p>
              </div>
            </Card>
          );
        })}
      </div>

      {pendingReview.length > 0 && (
        <Card>
          <SectionTitle icon="fa-solid fa-clock">Tasks Awaiting Your Review ({pendingReview.length})</SectionTitle>
          {pendingReview.map(t => {
            const assignees = Array.isArray(t.assignedTo)
              ? t.assignedTo
              : [t.assignedTo ?? t.assigned_to].filter(Boolean);
            return (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #f5f5f5" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{t.title}</p>
                  <p style={{ margin: 0, fontSize: 12, color: "#888" }}>
                    {assignees.join(", ") || "Unassigned"} — due {t.due || "—"}
                  </p>
                </div>
                <Badge label="Under Review" style={{ backgroundColor: "#fff8e0", color: "#c47b00" }} />
                <button
                  onClick={() => handleApprove(t)}
                  style={{ background: "#e6f9ed", border: "1px solid #a8e6bf", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 600, color: "#27ae60", cursor: "pointer" }}>
                  ✓ Approve
                </button>
                <button
                  onClick={() => setRejectTarget(t)}
                  style={{ background: "#fdecea", border: "1px solid #f5c6c2", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 600, color: "#c0392b", cursor: "pointer" }}>
                  Reject
                </button>
              </div>
            );
          })}
        </Card>
      )}

      {selectedMember && (
        <MemberTaskDrawer
          member={selectedMember}
          tasks={tasks}
          onClose={() => setSelectedMember(null)}
        />
      )}

      {rejectTarget && (
        <RejectModal task={rejectTarget} onConfirm={handleReject} onClose={() => setRejectTarget(null)} />
      )}
    </div>
  );
}

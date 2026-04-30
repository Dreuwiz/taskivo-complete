import { useState } from "react";
import { SESSION, ROLES } from "../constants/roles";
import { Avatar, Badge, Card, SectionTitle, PageHeader } from "../components/ui/index";
import { RejectModal } from "../components/modals/RejectModal";

const isTaskAssignedToUser = (task, user) => {
  const assignedUserIds = Array.isArray(task.assignedUserIds)
    ? task.assignedUserIds
    : [task.assigned_user_id].filter((id) => Number.isInteger(id));
  const assignees = Array.isArray(task.assignedTo)
    ? task.assignedTo
    : [task.assignedTo ?? task.assigned_to].filter(Boolean);

  return assignedUserIds.includes(user.id) || assignees.some(name => name === user.name);
};

export function TeamOverviewPage({ role, tasks, users, onUpdateTask }) {
  const session = SESSION[role];

  // ← null guard
  if (!session) return <div style={{ padding:32 }}>Loading team overview...</div>;

  const [rejectTarget, setRejectTarget] = useState(null);

  const members        = users.filter(u => u.team===session.team && u.role==="user");
  const pendingReview  = tasks.filter(t =>
    t.status==="Under Review" &&
    t.teamLeaderReviewed !== true &&
    (t.team===session.team || members.some(u => isTaskAssignedToUser(t, u)))
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
      <PageHeader title="Team Overview" subtitle={`Team ${session.team} — your direct reports`}/>
      <div className="grid-responsive" style={{ maxWidth:"100%", marginBottom:30 }}>
        {members.map(u => {
          const ut   = tasks.filter(t => isTaskAssignedToUser(t, u));
          const done = ut.filter(t => t.status==="Completed").length;
          const pct  = ut.length ? Math.round((done/ut.length)*100) : 0;
          return (
            <Card key={u.id} style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
              <Avatar initials={u.avatar} color={ROLES[u.role]?.color||"#888"}/>
              <div style={{ flex:1 }}>
                <p style={{ margin:0, fontWeight:700, fontSize:14, color:"#1a1a1a" }}>{u.name}</p>
                <p style={{ margin:"2px 0 10px", fontSize:12, color:"#888" }}>{u.email}</p>
                <div style={{ display:"flex", gap:18, fontSize:12, color:"#555" }}>
                  <span>Tasks <strong>{ut.length}</strong></span>
                  <span>Done <strong style={{ color:"#27ae60" }}>{done}</strong></span>
                  <span><i className="fa-solid fa-fire" style={{ color:"#e74c3c", marginRight:3 }}/>{u.streak||0}d</span>
                </div>
                <div style={{ marginTop:10, height:5, borderRadius:3, backgroundColor:"#e0e0e0", overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${pct}%`, backgroundColor:pct>=70?"#2ecc71":pct>=40?"#f0ad00":"#e74c3c", borderRadius:3 }}/>
                </div>
                <p style={{ margin:"4px 0 0", fontSize:11, color:"#aaa" }}>{pct}% complete</p>
              </div>
            </Card>
          );
        })}
      </div>

      {pendingReview.length > 0 && (
        <Card>
          <SectionTitle icon="🕐">Tasks Awaiting Your Review ({pendingReview.length})</SectionTitle>
          {pendingReview.map(t => {
            const assignees = Array.isArray(t.assignedTo)
              ? t.assignedTo
              : [t.assignedTo ?? t.assigned_to].filter(Boolean);
            return (
              <div key={t.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:"1px solid #f5f5f5" }}>
                <div style={{ flex:1 }}>
                  <p style={{ margin:0, fontWeight:600, fontSize:14 }}>{t.title}</p>
                  <p style={{ margin:0, fontSize:12, color:"#888" }}>
                    {assignees.join(", ") || "Unassigned"} — due {t.due || "—"}
                  </p>
                </div>
                <Badge label="Under Review" style={{ backgroundColor:"#fff8e0", color:"#c47b00" }}/>
                <button
                  onClick={() => handleApprove(t)}
                  style={{ background:"#e6f9ed", border:"1px solid #a8e6bf", borderRadius:6, padding:"5px 12px", fontSize:12, fontWeight:600, color:"#27ae60", cursor:"pointer" }}>
                  ✓ Approve
                </button>
                <button
                  onClick={() => setRejectTarget(t)}
                  style={{ background:"#fdecea", border:"1px solid #f5c6c2", borderRadius:6, padding:"5px 12px", fontSize:12, fontWeight:600, color:"#c0392b", cursor:"pointer" }}>
                  Reject
                </button>
              </div>
            );
          })}
        </Card>
      )}

      {rejectTarget && (
        <RejectModal task={rejectTarget} onConfirm={handleReject} onClose={() => setRejectTarget(null)} />
      )}
    </div>
  );
}

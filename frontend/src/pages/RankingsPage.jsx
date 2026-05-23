import { useState } from "react";
import { ROLES } from "../constants/roles";
import { Avatar, Card, PageHeader } from "../components/ui/index";
import { POINTS_BY_PRIORITY, PRIORITY_STYLE, STATUS_STYLE, calcPoints } from "../utils/helpers";

const isTaskAssignedToUser = (task, user) => {
  const ids = Array.isArray(task.assignedUserIds)
    ? task.assignedUserIds
    : [task.assigned_user_id].filter(id => Number.isInteger(id));
  const names = Array.isArray(task.assignedTo)
    ? task.assignedTo
    : [task.assignedTo ?? task.assigned_to].filter(Boolean);
  return ids.includes(user.id) || names.some(n => n === user.name);
};

const MEDAL = ["🥇", "🥈", "🥉"];

function RankBadge({ rank }) {
  if (rank <= 3) return <span style={{ fontSize: 20 }}>{MEDAL[rank - 1]}</span>;
  return (
    <span style={{
      width: 28, height: 28, borderRadius: "50%", backgroundColor: "#f0f0f0",
      color: "#888", fontSize: 12, fontWeight: 800,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
    }}>{rank}</span>
  );
}

function MemberRow({ rank, user, points, tasks, onClick }) {
  const ut   = tasks.filter(t => isTaskAssignedToUser(t, user));
  const done = ut.filter(t => t.status === "Completed").length;
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "12px 16px", borderRadius: 10, marginBottom: 8,
        backgroundColor: rank === 1 ? "#fffdf0" : rank === 2 ? "#fafafa" : "white",
        border: `1px solid ${rank === 1 ? "#f5e090" : "#f0f0f0"}`,
        cursor: onClick ? "pointer" : "default",
        transition: "box-shadow 0.15s",
      }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.08)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = ""; }}
    >
      <RankBadge rank={rank} />
      <Avatar initials={user.avatar} color={ROLES[user.role]?.color || "#888"} size={36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#1a1a1a" }}>{user.name}</p>
        <p style={{ margin: 0, fontSize: 11, color: "#aaa" }}>
          {user.team ? `Team ${user.team}` : ROLES[user.role]?.label} · {done}/{ut.length} tasks done
        </p>
      </div>
      <div style={{ textAlign: "right" }}>
        <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#b07d00" }}>{points}</p>
        <p style={{ margin: 0, fontSize: 10, color: "#aaa", fontWeight: 600 }}>POINTS</p>
      </div>
    </div>
  );
}

function MemberDetailDrawer({ user, tasks, onClose }) {
  const [statusFilter, setStatusFilter] = useState("All");
  const memberTasks = tasks.filter(t => isTaskAssignedToUser(t, user));
  const points = calcPoints(tasks, user.name);
  const filtered = statusFilter === "All" ? memberTasks : memberTasks.filter(t => t.status === statusFilter);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 900, display: "flex" }} onClick={onClose}>
      <div style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.25)" }} />
      <div
        style={{ width: 460, backgroundColor: "white", height: "100vh", overflowY: "auto", boxShadow: "-4px 0 24px rgba(0,0,0,0.12)", display: "flex", flexDirection: "column" }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: "22px 24px 16px", borderBottom: "1px solid #f0f0f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <Avatar initials={user.avatar} color={ROLES[user.role]?.color || "#888"} size={44} />
              <div>
                <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: "#1a1a1a" }}>{user.name}</p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>{user.email}</p>
                {user.team && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#694AD7", fontWeight: 600 }}>Team {user.team}</p>}
              </div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#aaa" }}>×</button>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <div style={{ flex: 1, padding: "8px 14px", borderRadius: 10, backgroundColor: "#fff8e0", border: "1px solid #f5e090", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#b07d00", textTransform: "uppercase" }}>Total Points</p>
              <p style={{ margin: "2px 0 0", fontSize: 24, fontWeight: 900, color: "#b07d00" }}>{points}</p>
            </div>
            <div style={{ flex: 1, padding: "8px 14px", borderRadius: 10, backgroundColor: "#e6f9ed", border: "1px solid #a8e6bf", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#27ae60", textTransform: "uppercase" }}>Completed</p>
              <p style={{ margin: "2px 0 0", fontSize: 24, fontWeight: 900, color: "#27ae60" }}>{memberTasks.filter(t => t.status === "Completed").length}</p>
            </div>
            <div style={{ flex: 1, padding: "8px 14px", borderRadius: 10, backgroundColor: "#f0f0f0", border: "1px solid #ddd", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase" }}>Total Tasks</p>
              <p style={{ margin: "2px 0 0", fontSize: 24, fontWeight: 900, color: "#888" }}>{memberTasks.length}</p>
            </div>
          </div>
        </div>

        <div style={{ padding: "12px 24px", borderBottom: "1px solid #f0f0f0", display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["All", "Pending", "In Progress", "Under Review", "Completed"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              style={{
                padding: "5px 12px", borderRadius: 20, border: "1px solid", fontSize: 11, fontWeight: 600, cursor: "pointer",
                borderColor: statusFilter === s ? "#c0392b" : "#ddd",
                backgroundColor: statusFilter === s ? "#c0392b" : "white",
                color: statusFilter === s ? "white" : "#666",
              }}>{s}</button>
          ))}
        </div>

        <div style={{ padding: "16px 24px", flex: 1 }}>
          {filtered.length === 0
            ? <p style={{ color: "#bbb", fontSize: 13, fontStyle: "italic", textAlign: "center", marginTop: 32 }}>No tasks found.</p>
            : filtered.map(t => {
                const pts = POINTS_BY_PRIORITY[t.priority] ?? 10;
                return (
                  <div key={t.id} style={{ padding: "12px 14px", borderRadius: 10, marginBottom: 10, border: "1px solid #f0f0f0", backgroundColor: "#fafbff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: t.status === "Completed" ? "#aaa" : "#1a1a1a", textDecoration: t.status === "Completed" ? "line-through" : "none", flex: 1 }}>{t.title}</p>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap", backgroundColor: t.status === "Completed" ? "#fff8e0" : "#f0f0f0", color: t.status === "Completed" ? "#b07d00" : "#888" }}>
                        {t.status === "Completed" ? `+${pts} pts` : `${pts} pts`}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, backgroundColor: PRIORITY_STYLE[t.priority]?.bg || "#f0f0f0", color: PRIORITY_STYLE[t.priority]?.text || "#888" }}>{t.priority}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, backgroundColor: STATUS_STYLE[t.status]?.bg || "#f0f0f0", color: STATUS_STYLE[t.status]?.text || "#888" }}>{t.status}</span>
                      {t.due && <span style={{ fontSize: 11, color: "#aaa" }}>Due: {t.due}</span>}
                    </div>
                  </div>
                );
              })
          }
        </div>
      </div>
    </div>
  );
}

export function RankingsPage({ users, tasks }) {
  const [tab, setTab] = useState("overall");
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);

  const staffUsers = users.filter(u => u.role === "user" || u.role === "team_leader");
  const teams = [...new Set(users.map(u => u.team).filter(Boolean))].sort();

  // Build ranked list for overall tab
  const ranked = staffUsers
    .map(u => ({ user: u, points: calcPoints(tasks, u.name) }))
    .sort((a, b) => b.points - a.points);

  // Build per-team ranked lists
  const byTeam = teams.map(team => {
    const members = staffUsers
      .filter(u => u.team === team)
      .map(u => ({ user: u, points: calcPoints(tasks, u.name) }))
      .sort((a, b) => b.points - a.points);
    const teamPoints = members.reduce((s, m) => s + m.points, 0);
    return { team, members, teamPoints };
  }).sort((a, b) => b.teamPoints - a.teamPoints);

  const TABS = [
    { id: "overall", label: "🏆 By Rank",   desc: "All members ranked by points" },
    { id: "team",    label: "👥 By Team",    desc: "Teams ranked by total points" },
    { id: "member",  label: "👤 By Member",  desc: "Drill down into any member" },
  ];

  return (
    <div>
      <PageHeader title="Rankings" subtitle="Top performers across all teams — Admin view" />

      {/* Points legend */}
      <Card style={{ marginBottom: 20, padding: "14px 18px" }}>
        <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.5px" }}>Points per Task Difficulty</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {Object.entries(POINTS_BY_PRIORITY).map(([priority, pts]) => (
            <span key={priority} style={{
              padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
              backgroundColor: PRIORITY_STYLE[priority]?.bg, color: PRIORITY_STYLE[priority]?.text,
            }}>
              {priority}: +{pts} pts
            </span>
          ))}
        </div>
      </Card>

      {/* Tab switcher */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setSelectedTeam(null); }}
            style={{
              padding: "9px 18px", borderRadius: 10, border: "1px solid", fontSize: 13, fontWeight: 700, cursor: "pointer",
              borderColor: tab === t.id ? "#c0392b" : "#ddd",
              backgroundColor: tab === t.id ? "#c0392b" : "white",
              color: tab === t.id ? "white" : "#555",
            }}>{t.label}</button>
        ))}
      </div>

      {/* ── Overall Rankings ── */}
      {tab === "overall" && (
        <Card style={{ padding: "16px 16px" }}>
          <p style={{ margin: "0 0 16px", fontSize: 12, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            All Members — Ranked by Points
          </p>
          {ranked.length === 0
            ? <p style={{ color: "#bbb", fontSize: 13, fontStyle: "italic" }}>No members found.</p>
            : ranked.map(({ user, points }, i) => (
                <MemberRow
                  key={user.id}
                  rank={i + 1}
                  user={user}
                  points={points}
                  tasks={tasks}
                  onClick={() => setSelectedMember(user)}
                />
              ))
          }
        </Card>
      )}

      {/* ── By Team ── */}
      {tab === "team" && (
        <>
          {selectedTeam === null ? (
            <Card style={{ padding: "16px 16px" }}>
              <p style={{ margin: "0 0 16px", fontSize: 12, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Teams — Ranked by Total Points
              </p>
              {byTeam.map(({ team, members, teamPoints }, i) => (
                <div
                  key={team}
                  onClick={() => setSelectedTeam(team)}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "14px 16px", borderRadius: 10, marginBottom: 8,
                    backgroundColor: i === 0 ? "#fffdf0" : "white",
                    border: `1px solid ${i === 0 ? "#f5e090" : "#f0f0f0"}`,
                    cursor: "pointer", transition: "box-shadow 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.08)"}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = ""}
                >
                  <RankBadge rank={i + 1} />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: "#1a1a1a" }}>Team {team}</p>
                    <p style={{ margin: 0, fontSize: 12, color: "#aaa" }}>{members.length} member{members.length !== 1 ? "s" : ""} · click to see rankings</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#b07d00" }}>{teamPoints}</p>
                    <p style={{ margin: 0, fontSize: 10, color: "#aaa", fontWeight: 600 }}>TOTAL PTS</p>
                  </div>
                </div>
              ))}
            </Card>
          ) : (
            <Card style={{ padding: "16px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <button onClick={() => setSelectedTeam(null)}
                  style={{ background: "#f0f0f0", border: "none", borderRadius: 7, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", color: "#555" }}>
                  ← Back
                </button>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#1a1a1a" }}>Team {selectedTeam} — Member Rankings</p>
              </div>
              {(byTeam.find(t => t.team === selectedTeam)?.members || []).map(({ user, points }, i) => (
                <MemberRow
                  key={user.id}
                  rank={i + 1}
                  user={user}
                  points={points}
                  tasks={tasks}
                  onClick={() => setSelectedMember(user)}
                />
              ))}
            </Card>
          )}
        </>
      )}

      {/* ── By Member ── */}
      {tab === "member" && (
        <Card style={{ padding: "16px 16px" }}>
          <p style={{ margin: "0 0 16px", fontSize: 12, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            All Members — Click to view tasks & points
          </p>
          {ranked.map(({ user, points }, i) => (
            <MemberRow
              key={user.id}
              rank={i + 1}
              user={user}
              points={points}
              tasks={tasks}
              onClick={() => setSelectedMember(user)}
            />
          ))}
        </Card>
      )}

      {selectedMember && (
        <MemberDetailDrawer
          user={selectedMember}
          tasks={tasks}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </div>
  );
}

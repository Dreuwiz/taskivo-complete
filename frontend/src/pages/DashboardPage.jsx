import { SESSION } from "../constants/roles";
import { DAYS, getWeekCounts } from "../utils/helpers";
import { StatCard, Card, SectionTitle, PageHeader, WeekRow, Badge } from "../components/ui/index";

// ── Same helper as TasksPage — handles array, JSON string, or comma-separated ──
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

const getAssignedUserIds = t => {
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

const isLeaderRole = user => ["team_leader", "leader", "supervisor"].includes(user?.role);

const getEffectiveTeam = (task, users) => {
  if (task.team) return task.team;

  for (const id of getAssignedUserIds(task)) {
    const user = users.find(u => u.id === id);
    if (user?.team && !isLeaderRole(user)) return user.team;
  }

  for (const name of getNames(task)) {
    const user = users.find(u => u.name?.toLowerCase().trim() === name?.toLowerCase().trim());
    if (user?.team && !isLeaderRole(user)) return user.team;
  }

  return null;
};

const isTLPendingTask = (task, session) =>
  task.tlPendingAssignment === true &&
  (
    getAssignedUserIds(task).includes(session?.id) ||
    getNames(task).some(name => name?.toLowerCase().trim() === session?.name?.toLowerCase().trim())
  );

const needsTLReview = (task, users) =>
  task.status === "Under Review" && !!getEffectiveTeam(task, users) && task.teamLeaderReviewed !== true;

const needsManagerReview = (task, users) =>
  task.status === "Under Review" && (!getEffectiveTeam(task, users) || task.teamLeaderReviewed === true);

const isActiveTask = t => ["Pending", "In Progress", "Under Review"].includes(t.status);

const parseDate = value => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const fmtDue = value => {
  const date = parseDate(value);
  if (!date) return "No due date";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const getDueMeta = task => {
  const dueDate = parseDate(task.due);
  if (!dueDate || task.status === "Completed") return { overdue: false, soon: false };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDay = new Date(dueDate);
  dueDay.setHours(0, 0, 0, 0);

  const daysAway = Math.ceil((dueDay - today) / 86400000);
  return {
    overdue: daysAway < 0,
    soon: daysAway >= 0 && daysAway <= 7,
  };
};

const taskSortByDue = (a, b) => {
  const ad = parseDate(a.due)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const bd = parseDate(b.due)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  return ad - bd;
};

const completedTime = task =>
  parseDate(task.completedAt ?? task.completed_at ?? task.teamLeaderApprovedAt ?? task.updatedAt ?? task.updated_at ?? task.due)?.getTime() ?? 0;

const taskSortByRecentCompletion = (a, b) => completedTime(b) - completedTime(a);

function MiniTaskRow({ task, tone = "#2386ff", note }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr auto",
      gap: 12,
      alignItems: "center",
      padding: "10px 0",
      borderBottom: "1px solid #f2f2f2",
    }}>
      <div style={{ minWidth: 0 }}>
        <p style={{
          margin: 0,
          fontSize: 13,
          fontWeight: 700,
          color: "#1a1a1a",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}>
          {task.title}
        </p>
        <p style={{ margin: "3px 0 0", fontSize: 11, color: "#888" }}>
          {note || `Due ${fmtDue(task.due)}`}
        </p>
      </div>
      <Badge
        label={task.status || "Open"}
        style={{ backgroundColor: `${tone}17`, color: tone, border: `1px solid ${tone}33`, whiteSpace: "nowrap" }}
      />
    </div>
  );
}

function AttentionPanel({ title, icon, children, empty }) {
  const hasContent = Array.isArray(children) ? children.length > 0 : !!children;

  return (
    <Card style={{ padding: 20, minHeight: 220, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <i className={icon} style={{ color: "#2386ff", fontSize: 14, width: 16, textAlign: "center" }} />
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#1a1a1a" }}>{title}</h3>
      </div>
      <div style={{ flex: 1 }}>
        {hasContent ? children : (
          <div style={{
            height: "100%",
            minHeight: 130,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            color: "#aaa",
            fontSize: 13,
            fontWeight: 600,
          }}>
            {empty}
          </div>
        )}
      </div>
    </Card>
  );
}

function AttentionMetric({ label, value, tone = "#2386ff" }) {
  return (
    <div style={{
      padding: "12px 14px",
      borderRadius: 8,
      backgroundColor: `${tone}12`,
      border: `1px solid ${tone}28`,
      minWidth: 0,
    }}>
      <p style={{ margin: 0, fontSize: 22, lineHeight: 1, fontWeight: 900, color: "#1a1a1a" }}>{value}</p>
      <p style={{ margin: "5px 0 0", fontSize: 11, fontWeight: 700, color: tone, textTransform: "uppercase" }}>{label}</p>
    </div>
  );
}

function TeamRiskRow({ label, overdue, review, active }) {
  const tone = overdue > 0 ? "#c0392b" : review > 0 ? "#c47b00" : "#27ae60";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #f2f2f2" }}>
      <div style={{ width: 9, height: 9, borderRadius: "50%", backgroundColor: tone, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>{label}</p>
        <p style={{ margin: "3px 0 0", fontSize: 11, color: "#888" }}>
          {overdue} overdue · {review} in review · {active} active
        </p>
      </div>
    </div>
  );
}

function DashboardAttention({ role, tasks, users, session }) {
  const overdueTasks = tasks.filter(t => getDueMeta(t).overdue).sort(taskSortByDue);
  const dueSoonTasks = tasks.filter(t => getDueMeta(t).soon).sort(taskSortByDue);
  const reviewTasks = tasks.filter(t => t.status === "Under Review");
  const activeTasks = tasks.filter(isActiveTask);

  if (role === "user") {
    const needsUpdate = activeTasks.filter(t => t.status !== "Under Review").sort(taskSortByDue).slice(0, 4);
    const completed = tasks.filter(t => t.status === "Completed").sort(taskSortByRecentCompletion).slice(0, 4);

    return (
      <div className="dashboard-attention-grid">
        <AttentionPanel title="Due Soon" icon="fa-solid fa-calendar-day" empty="No upcoming deadlines">
          {dueSoonTasks.slice(0, 4).map(t => <MiniTaskRow key={t.id} task={t} tone="#c47b00" />)}
        </AttentionPanel>
        <AttentionPanel title="Needs Update" icon="fa-solid fa-list-check" empty="Nothing needs action right now">
          {needsUpdate.map(t => <MiniTaskRow key={t.id} task={t} tone="#694AD7" />)}
        </AttentionPanel>
        <AttentionPanel title="Recently Completed" icon="fa-regular fa-circle-check" empty="No completed tasks yet">
          {completed.map(t => <MiniTaskRow key={t.id} task={t} tone="#27ae60" note={`Completed · Due ${fmtDue(t.due)}`} />)}
        </AttentionPanel>
      </div>
    );
  }

  if (role === "team_leader") {
    const teamMembers = users.filter(u => u.team === session.team && u.role === "user");
    const memberAttention = teamMembers
      .map(u => {
        const memberTasks = tasks.filter(t => getNames(t).includes(u.name));
        return {
          user: u,
          overdue: memberTasks.filter(t => getDueMeta(t).overdue).length,
          active: memberTasks.filter(isActiveTask).length,
        };
      })
      .filter(row => row.overdue > 0 || row.active > 0)
      .sort((a, b) => b.overdue - a.overdue || b.active - a.active)
      .slice(0, 4);
    const pendingAssignments = tasks.filter(t => isTLPendingTask(t, session)).slice(0, 4);

    return (
      <div className="dashboard-attention-grid">
        <AttentionPanel title="Needs Your Review" icon="fa-solid fa-clipboard-check" empty="No reviews waiting">
          {reviewTasks.filter(t => needsTLReview(t, users) && getEffectiveTeam(t, users) === session.team).slice(0, 4).map(t => (
            <MiniTaskRow key={t.id} task={t} tone="#c47b00" note="Ready for supervisor review" />
          ))}
        </AttentionPanel>
        <AttentionPanel title="Member Attention" icon="fa-solid fa-user-clock" empty="Team workload looks clear">
          {memberAttention.map(({ user, overdue, active }) => (
            <TeamRiskRow key={user.id} label={user.name} overdue={overdue} review={0} active={active} />
          ))}
        </AttentionPanel>
        <AttentionPanel title="Pending Assignment" icon="fa-solid fa-share-nodes" empty="No delegated tasks to assign">
          {pendingAssignments.map(t => <MiniTaskRow key={t.id} task={t} tone="#2386ff" note="Waiting for team assignment" />)}
        </AttentionPanel>
      </div>
    );
  }

  if (role === "manager") {
    const managerReview = reviewTasks.filter(t => needsManagerReview(t, users)).slice(0, 4);
    const teamNames = [...new Set(users.filter(u => u.team).map(u => u.team))];
    const teamRisks = teamNames
      .map(team => {
        const teamTasks = tasks.filter(t => t.team === team);
        return {
          team,
          overdue: teamTasks.filter(t => getDueMeta(t).overdue).length,
          review: teamTasks.filter(t => t.status === "Under Review").length,
          active: teamTasks.filter(isActiveTask).length,
        };
      })
      .filter(row => row.overdue > 0 || row.review > 0 || row.active > 0)
      .sort((a, b) => b.overdue - a.overdue || b.review - a.review || b.active - a.active)
      .slice(0, 4);

    return (
      <div className="dashboard-attention-grid">
        <AttentionPanel title="Approval Queue" icon="fa-solid fa-stamp" empty="No manager approvals waiting">
          {managerReview.map(t => <MiniTaskRow key={t.id} task={t} tone="#c47b00" note={t.team ? `Team ${t.team} approved by supervisor` : "Direct manager review"} />)}
        </AttentionPanel>
        <AttentionPanel title="Team Risk Summary" icon="fa-solid fa-triangle-exclamation" empty="No team risks showing">
          {teamRisks.map(row => <TeamRiskRow key={row.team} label={`Team ${row.team}`} {...row} />)}
        </AttentionPanel>
        <AttentionPanel title="Overdue Across Teams" icon="fa-solid fa-clock" empty="No overdue work">
          {overdueTasks.slice(0, 4).map(t => <MiniTaskRow key={t.id} task={t} tone="#c0392b" note={`${t.team ? `Team ${t.team}` : "No team"} · due ${fmtDue(t.due)}`} />)}
        </AttentionPanel>
      </div>
    );
  }

  const unassignedTasks = tasks.filter(t => getNames(t).length === 0);
  const inactiveUsers = users.filter(u => u.status && u.status !== "Active");
  const usersWithoutTeam = users.filter(u => ["user", "team_leader"].includes(u.role) && !u.team);
  const teams = [...new Set(users.filter(u => u.team).map(u => u.team))];
  const teamsWithoutLeader = teams.filter(team => !users.some(u => u.team === team && u.role === "team_leader"));
  const recentCompleted = tasks.filter(t => t.status === "Completed").sort(taskSortByRecentCompletion).slice(0, 4);

  return (
    <div className="dashboard-attention-grid">
      <AttentionPanel title="System Alerts" icon="fa-solid fa-bell" empty="No system alerts">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
          <AttentionMetric label="Unassigned Tasks" value={unassignedTasks.length} tone="#c0392b" />
          <AttentionMetric label="Inactive Users" value={inactiveUsers.length} tone="#c47b00" />
          <AttentionMetric label="Users No Team" value={usersWithoutTeam.length} tone="#694AD7" />
          <AttentionMetric label="Teams No Leader" value={teamsWithoutLeader.length} tone="#2386ff" />
        </div>
      </AttentionPanel>
      <AttentionPanel title="Setup Issues" icon="fa-solid fa-screwdriver-wrench" empty="Setup looks complete">
        {[
          ...usersWithoutTeam.slice(0, 2).map(u => ({ id: `user-${u.id}`, title: u.name, status: "No Team", note: u.email })),
          ...teamsWithoutLeader.slice(0, 2).map(team => ({ id: `team-${team}`, title: `Team ${team}`, status: "No Leader", note: "Assign a team leader" })),
        ].map(item => <MiniTaskRow key={item.id} task={item} tone="#c0392b" note={item.note} />)}
      </AttentionPanel>
      <AttentionPanel title="Recent Completions" icon="fa-regular fa-circle-check" empty="No completed tasks yet">
        {recentCompleted.map(t => <MiniTaskRow key={t.id} task={t} tone="#27ae60" note={`${t.team ? `Team ${t.team}` : "System"} · due ${fmtDue(t.due)}`} />)}
      </AttentionPanel>
    </div>
  );
}

export function DashboardPage({ role, tasks, users, sessionData }) {
  const session = sessionData || SESSION[role];

  if (!session) {
    return <div style={{ padding: 32 }}>Loading dashboard...</div>;
  }

  // ── FIX: use getNames() so array-based assignedTo is matched correctly ──
  const sessionNameNorm = session.name?.toLowerCase().trim();

  const myTasks   = tasks.filter(t =>
    getNames(t).some(n => n?.toLowerCase().trim() === sessionNameNorm)
  );
  const scoped    = role === "user"
    ? myTasks
    : role === "team_leader"
      ? tasks.filter(t => getEffectiveTeam(t, users) === session.team || isTLPendingTask(t, session))
      : tasks;
  const weekData  = getWeekCounts(scoped);

  const totalT  = scoped.length;
  const doneT   = scoped.filter(t => t.status === "Completed").length;
  const activeT = scoped.filter(t => ["Pending", "In Progress", "Under Review"].includes(t.status)).length;

  const statCfg = {
    user: [
      { label: "My Total Tasks", value: totalT,              icon: "fa-solid fa-file",           color: "#38827A" },
      { label: "Completed",      value: doneT,               icon: "fa-regular fa-circle-check", color: "#34C759" },
      { label: "Active Tasks",   value: activeT,             icon: "fa-solid fa-chart-line",     color: "#694AD7" },
      { label: "Current Streak", value: session.streak || 0, icon: "fa-solid fa-fire",           color: "#e74c3c" },
    ],
    team_leader: [
      { label: "Team Total Tasks", value: totalT, icon: "fa-solid fa-file",           color: "#694AD7" },
      { label: "Team Completed",   value: doneT,  icon: "fa-regular fa-circle-check", color: "#34C759" },
      { label: "Team Members",     value: users.filter(u => u.team === session.team && u.role === "user").length, icon: "fa-solid fa-people-group", color: "#2386ff" },
      { label: "Top Streak",       value: Math.max(0, ...users.filter(u => u.team === session.team).map(u => u.streak || 0)), icon: "fa-solid fa-fire", color: "#e74c3c" },
    ],
    manager: [
      { label: "Dept. Total Tasks", value: totalT,  icon: "fa-solid fa-file",           color: "#c47b00" },
      { label: "Dept. Completed",   value: doneT,   icon: "fa-regular fa-circle-check", color: "#34C759" },
      { label: "Active Teams",      value: [...new Set(users.filter(u => u.team).map(u => u.team))].length, icon: "fa-solid fa-sitemap", color: "#2386ff" },
      { label: "Active Tasks",      value: activeT, icon: "fa-solid fa-chart-line",     color: "#694AD7" },
    ],
    admin: [
      { label: "System Tasks", value: totalT,      icon: "fa-solid fa-file",           color: "#c0392b" },
      { label: "Completed",    value: doneT,        icon: "fa-regular fa-circle-check", color: "#34C759" },
      { label: "Total Users",  value: users.length, icon: "fa-solid fa-users",          color: "#2386ff" },
      { label: "Active Teams", value: [...new Set(users.filter(u => u.team).map(u => u.team))].length, icon: "fa-solid fa-sitemap", color: "#c47b00" },
    ],
  }[role];

  const subtitle = {
    user:        "Your personal task overview",
    team_leader: `Team ${session.team} — performance at a glance`,
    manager:     "Department-wide task overview",
    admin:       "System-wide snapshot",
  }[role];

  return (
    <div style={{ width: "100%", boxSizing: "border-box" }}>
      <PageHeader title="Dashboard" subtitle={subtitle} />

      <div className="grid-responsive" style={{ marginBottom: 24 }}>
        {statCfg.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      <Card style={{ width: "100%", padding: 24, boxSizing: "border-box" }}>

        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 6,
        }}>
          <SectionTitle icon="📅" style={{ margin: 0 }}>Weekly Activity</SectionTitle>

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#EAEFFF",
            border: "1.5px solid #c5d0f5",
            borderRadius: 20,
            padding: "6px 16px",
            flexShrink: 0,
          }}>
            <i className="fa-regular fa-circle-check" style={{ color: "#2386ff", fontSize: 16 }} />
            <div style={{ lineHeight: 1.3 }}>
              <p style={{ margin: 0, color: "#00379E", fontWeight: 700, fontSize: 12 }}>Today's Progress</p>
              <p style={{ margin: 0, fontSize: 11, color: "#666" }}>Task{doneT !== 1 ? "s" : ""} Completed</p>
            </div>
            <p style={{ margin: "0 0 0 10px", fontSize: 26, fontWeight: 900, color: "#1a1a1a", lineHeight: 1 }}>{doneT}</p>
          </div>
        </div>

        <div style={{ borderBottom: "1px solid #eee", marginBottom: 16 }} />

        <div style={{
          display: "grid",
          gridTemplateColumns: "110px 1fr 40px",
          alignItems: "center",
          gap: "10px 14px",
          width: "100%",
        }}>
          {DAYS.map(day => <WeekRow key={day} day={day} count={weekData[day] || 0} />)}
        </div>

      </Card>

      <div style={{ marginTop: 24 }}>
        <DashboardAttention role={role} tasks={scoped} users={users} session={session} />
      </div>
    </div>
  );
}

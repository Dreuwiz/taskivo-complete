import { SESSION } from "../constants/roles";
import { DAYS, getWeekCounts } from "../utils/helpers";
import { StatCard, Card, SectionTitle, PageHeader, WeekRow } from "../components/ui/index";

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

export function DashboardPage({ role, tasks, users, sessionData }) {
  const session = sessionData || SESSION[role];

  if (!session) {
    return <div style={{ padding: 32 }}>Loading dashboard...</div>;
  }

  const weekData = getWeekCounts(tasks);

  // ── FIX: use getNames() so array-based assignedTo is matched correctly ──
  const sessionNameNorm = session.name?.toLowerCase().trim();

  const myTasks   = tasks.filter(t =>
    getNames(t).some(n => n?.toLowerCase().trim() === sessionNameNorm)
  );
  const teamTasks = tasks.filter(t => t.team === session.team);
  const scoped    = role === "user" ? myTasks : role === "team_leader" ? teamTasks : tasks;

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
    </div>
  );
}
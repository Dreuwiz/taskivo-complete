import { SESSION } from "../constants/roles";
import { Card, PageHeader } from "../components/ui/index";

function getLevelInfo(totalXP) {
  let level = 1;
  let accumulated = 0;
  while (true) {
    const needed = 500 + (level - 1) * 100;
    if (accumulated + needed > totalXP) {
      return {
        level,
        currentXP: totalXP - accumulated,
        neededXP: needed,
        progress: Math.round(((totalXP - accumulated) / needed) * 100),
      };
    }
    accumulated += needed;
    level++;
  }
}

const LEVEL_TITLES = [
  "Newcomer", "Beginner", "Rising Star", "Achiever",
  "Expert", "Elite", "Master", "Champion", "Legend", "Mythic"
];

function getLevelTitle(level) {
  return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];
}

export function AchievementsPage({ role, tasks }) {
  const session = SESSION[role];
  const myTasks = tasks.filter(t => (t.assignedTo || t.assigned_to) === session.name);
  const myDone  = myTasks.filter(t => t.status === "Completed").length;

  const badges = [
    {
      icon: "fa-solid fa-fire",
      label: "7-Day Streak",
      desc: "Completed tasks 7 days in a row",
      earned: (session.streak || 0) >= 7,
      color: "#e74c3c",
      xp: 200,
    },
    {
      icon: "fa-solid fa-star",
      label: "Task Master",
      desc: "Completed 50 tasks total",
      earned: myDone >= 2,
      color: "#f0ad00",
      xp: 500,
    },
    {
      icon: "fa-solid fa-bolt",
      label: "Speed Runner",
      desc: "Completed 5 tasks in a single day",
      earned: false,
      color: "#694AD7",
      xp: 350,
    },
    {
      icon: "fa-solid fa-trophy",
      label: "Top Performer",
      desc: "Ranked #1 in team for the week",
      earned: role === "team_leader",
      color: "#c47b00",
      xp: 400,
    },
    {
      icon: "fa-solid fa-medal",
      label: "Perfect Week",
      desc: "Zero missed deadlines this week",
      earned: myDone > 0 && myTasks.every(t => t.status === "Completed"),
      color: "#2386ff",
      xp: 300,
    },
    {
      icon: "fa-solid fa-crown",
      label: "Legendary",
      desc: "Achieved a 30-day task streak",
      earned: (session.streak || 0) >= 14,
      color: "#27ae60",
      xp: 750,
    },
  ];

  const totalXP     = badges.filter(b => b.earned).reduce((sum, b) => sum + b.xp, 0);
  const earnedCount = badges.filter(b => b.earned).length;
  const { level, currentXP, neededXP, progress } = getLevelInfo(totalXP);
  const levelTitle  = getLevelTitle(level);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, height: "100%" }}>
      {/* Header */}
      <div>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#1a1a1a" }}>Achievements</h2>
        <p style={{ margin: "3px 0 0", color: "#888", fontSize: 13 }}>
          {earnedCount} of {badges.length} badges earned
        </p>
      </div>

      {/* Level Card — full width */}
      <div style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)",
        borderRadius: 16,
        padding: "20px 24px",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        gap: 20,
        width: "100%",
        boxSizing: "border-box",
      }}>
        {/* Level Badge */}
        <div style={{
          width: 68,
          height: 68,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #f0ad00, #e74c3c)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxShadow: "0 0 20px rgba(240,173,0,0.4)",
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.85, letterSpacing: 1 }}>LVL</span>
          <span style={{ fontSize: 22, fontWeight: 900, lineHeight: 1 }}>{level}</span>
        </div>

        {/* Level Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
            <span style={{ fontWeight: 800, fontSize: 16 }}>{levelTitle}</span>
            <span style={{ fontSize: 13, opacity: 0.7 }}>{currentXP} / {neededXP} XP</span>
          </div>
          <div style={{
            height: 10,
            borderRadius: 6,
            background: "rgba(255,255,255,0.15)",
            overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              width: `${progress}%`,
              borderRadius: 6,
              background: "linear-gradient(90deg, #f0ad00, #e74c3c)",
              transition: "width 0.6s ease",
            }} />
          </div>
          <div style={{ marginTop: 6, fontSize: 12, opacity: 0.6 }}>
            {totalXP} total XP earned · {neededXP - currentXP} XP to Level {level + 1}
          </div>
        </div>
      </div>

      {/* Badges Grid — full width, fills remaining space */}
      <div className="grid-responsive" style={{
        width: "100%",
        flex: 1,
        boxSizing: "border-box",
      }}>
        {badges.map(b => (
          <Card key={b.label} style={{
            opacity: b.earned ? 1 : 0.45,
            display: "flex",
            gap: 14,
            alignItems: "flex-start",
            padding: 18,
            border: `2px solid ${b.earned ? b.color + "55" : "#f0f0f0"}`,
            transition: "transform 0.15s, box-shadow 0.15s",
            position: "relative",
            overflow: "hidden",
            boxSizing: "border-box",
          }}>
            {b.earned && (
              <div style={{
                position: "absolute", top: 10, right: 10,
                backgroundColor: b.color + "22", borderRadius: 20, padding: "2px 8px",
              }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: b.color }}>✓ EARNED</span>
              </div>
            )}
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              backgroundColor: b.color + "22",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              border: `2px solid ${b.color}33`,
            }}>
              <i className={b.icon} style={{ color: b.color, fontSize: 20 }} />
            </div>
            <div style={{ paddingTop: 2 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#1a1a1a" }}>{b.label}</p>
              <p style={{ margin: "5px 0 6px", fontSize: 12, color: "#777", lineHeight: 1.4 }}>{b.desc}</p>
              <span style={{
                display: "inline-block",
                fontSize: 11,
                fontWeight: 700,
                color: b.earned ? b.color : "#bbb",
                background: b.earned ? b.color + "15" : "#f5f5f5",
                borderRadius: 10,
                padding: "2px 8px",
              }}>
                {b.earned ? `+${b.xp} XP` : `🔒 ${b.xp} XP`}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
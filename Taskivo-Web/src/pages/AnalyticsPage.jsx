import { useState } from "react";
import { Chart } from "react-google-charts";
import { SESSION, ROLES } from "../constants/roles";
import { PageHeader, Card, SectionTitle } from "../components/ui/index";

const BASE_OPTS = {
  backgroundColor: "transparent",
  fontName: "Segoe UI",
  legend: { position: "bottom", textStyle: { fontSize: 12 } },
  chartArea: { width: "85%", height: "68%" },
};

const isAssignee = (task, userName) => {
  const assignee = task.assignedTo || task.assigned_to || "";
  if (Array.isArray(assignee)) {
    return assignee.some(a =>
      (typeof a === "string" ? a : a?.name ?? a) === userName
    );
  }
  return assignee === userName;
};

const RANGE_OPTIONS = [
  { label: "Yesterday",  value: "yesterday" },
  { label: "Last 7 Days", value: "7d" },
  { label: "Last Month",  value: "30d" },
  { label: "Last Year",   value: "1y" },
];

function RangeFilter({ value, onChange }) {
  return (
    <div className="range-filter-responsive">
      {RANGE_OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            padding: "4px 14px",
            borderRadius: 20,
            border: "1.5px solid",
            borderColor: value === opt.value ? "#2386ff" : "#d0d0d0",
            background: value === opt.value ? "#2386ff" : "transparent",
            color: value === opt.value ? "#fff" : "#555",
            fontWeight: value === opt.value ? 600 : 400,
            fontSize: 12,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function ChartCard({ title, icon, children, style, className }) {
  return (
    <Card style={style} className={className}>
      <SectionTitle icon={icon}>{title}</SectionTitle>
      {children}
    </Card>
  );
}

function buildLineData(scopedTasks, range) {
  const today = new Date();

  if (range === "yesterday") {
    const d = new Date(today);
    d.setDate(d.getDate() - 1);
    const key   = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const ts    = scopedTasks.filter(t => t.due?.slice(0, 10) === key);
    return [
      ["Day", "Total Tasks", "Completed"],
      [label, ts.length, ts.filter(t => t.status === "Completed").length],
    ];
  }

  if (range === "7d" || range === "30d") {
    const days = range === "7d" ? 7 : 30;
    return [
      ["Day", "Total Tasks", "Completed"],
      ...Array.from({ length: days }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (days - 1 - i));
        const key   = d.toISOString().slice(0, 10);
        const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const ts    = scopedTasks.filter(t => t.due?.slice(0, 10) === key);
        return [label, ts.length, ts.filter(t => t.status === "Completed").length];
      }),
    ];
  }

  if (range === "1y") {
    return [
      ["Month", "Total Tasks", "Completed"],
      ...Array.from({ length: 12 }, (_, i) => {
        const d        = new Date(today.getFullYear(), today.getMonth() - (11 - i), 1);
        const monthKey = d.toISOString().slice(0, 7);
        const label    = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        const ts       = scopedTasks.filter(t => t.due?.slice(0, 7) === monthKey);
        return [label, ts.length, ts.filter(t => t.status === "Completed").length];
      }),
    ];
  }

  return [["Day", "Total Tasks", "Completed"]];
}

export function AnalyticsPage({ role, tasks, users }) {
  const session = SESSION[role];
  const [activityRange, setActivityRange] = useState("7d");

  if (!session) return <div style={{ padding: 32 }}>Loading analytics...</div>;

  const subtitle = {
    team_leader: `Team ${session.team} performance`,
    manager:     "Department analytics",
    admin:       "System-wide analytics",
  }[role];

  const scopedTasks = role === "team_leader"
    ? tasks.filter(t => t.team === session.team)
    : tasks;

  const barEntities = role === "team_leader"
    ? users.filter(u => u.team === session.team).map(u => {
        const ut   = tasks.filter(t => isAssignee(t, u.name));
        const rate = ut.length
          ? Math.round((ut.filter(t => t.status === "Completed").length / ut.length) * 100)
          : 0;
        return [u.name + (u.id === session.id ? " (You)" : ""), rate, `${rate}%`];
      })
    : [...new Set(scopedTasks.filter(t => t.team).map(t => t.team))].map(team => {
        const tt   = scopedTasks.filter(t => t.team === team);
        const rate = tt.length
          ? Math.round((tt.filter(t => t.status === "Completed").length / tt.length) * 100)
          : 0;
        return [`Team ${team}`, rate, `${rate}%`];
      });

  const barData = [
    ["Entity", "Completion %", { role: "annotation" }],
    ...(barEntities.length ? barEntities : [["No data", 0, "0%"]]),
  ];

  const pending    = scopedTasks.filter(t => t.status === "Pending").length;
  const inProgress = scopedTasks.filter(t => t.status === "In Progress").length;
  const completed  = scopedTasks.filter(t => t.status === "Completed").length;

  const pieData = [
    ["Status", "Count"],
    ["Pending",     pending],
    ["In Progress", inProgress],
    ["Completed",   completed],
  ];

  const lineData = buildLineData(scopedTasks, activityRange);
  const rangeLabel = RANGE_OPTIONS.find(o => o.value === activityRange)?.label ?? "";

  const visibleUsers = role === "team_leader"
    ? users.filter(u => u.team === session.team)
    : users;

  const tableData = [
    ["Name", "Role", "Team", "Total Tasks", "Completed", "Streak"],
    ...visibleUsers.map(u => {
      const ut   = tasks.filter(t => isAssignee(t, u.name));
      const done = ut.filter(t => t.status === "Completed").length;
      return [
        u.name,
        ROLES[u.role]?.label || u.role,
        u.team || "—",
        ut.length,
        done,
        `${u.streak || 0}d`,
      ];
    }),
  ];

  return (
    <div>
      <PageHeader title="Analytics" subtitle={subtitle} />
      <div className="analytics-grid">

        <ChartCard title="Completion Rate" icon="📊" className="card-responsive">
          <div className="chart-wrapper">
            <Chart
              chartVersion="current"  
              chartType="ColumnChart"
              width="100%"
              height="280px"
              data={barData}
              options={{
                ...BASE_OPTS,
                colors: ["#2386ff"],
                vAxis: { minValue: 0, maxValue: 100, format: "#'%" , textStyle: { fontSize: 11 }, gridlines: { color: "#f0f0f0" } },
                hAxis: { textStyle: { fontSize: 11 } },
                annotations: { alwaysOutside: true, textStyle: { fontSize: 11, color: "#555" } },
                bar: { groupWidth: "55%" },
              }}
            />
          </div>
        </ChartCard>

        <ChartCard title="Task Status Breakdown" icon="🍩" className="card-responsive">
          <div className="chart-wrapper">
            <Chart
              chartVersion="current"  
              chartType="PieChart"
              width="100%"
              height="280px"
              data={pieData}
              options={{
                ...BASE_OPTS,
                pieHole: 0.45,
                colors: ["#f0ad00", "#694AD7", "#2ecc71"],
                pieSliceTextStyle: { fontSize: 12 },
                slices: { 0: { offset: 0.04 }, 2: { offset: 0.04 } },
              }}
            />
          </div>
        </ChartCard>

        <ChartCard
          title={`Task Activity — ${rangeLabel}`}
          icon="📈"
          className="chart-full-width card-responsive"
        >
          <RangeFilter value={activityRange} onChange={setActivityRange} />
          <div className="chart-wrapper">
            <Chart
              chartVersion="current"  
              chartType="LineChart"
              width="100%"
              height="280px"
              data={lineData}
              options={{
                ...BASE_OPTS,
                colors: ["#2386ff", "#2ecc71"],
                curveType: "function",
                pointSize: 6,
                lineWidth: 2,
                hAxis: { textStyle: { fontSize: 11 }, gridlines: { color: "transparent" } },
                vAxis: { minValue: 0, format: "#", textStyle: { fontSize: 11 }, gridlines: { color: "#f0f0f0" } },
              }}
            />
          </div>
        </ChartCard>

        <ChartCard title="User Activity" icon="👥" className="chart-full-width card-responsive">
          <div className="scroll-panel" style={{ height: "56vh", overflowY: "scroll" }}>
            <div className="table-responsive">
              <Chart
                chartVersion="current"  
                chartType="Table"
                width="100%"
                data={tableData}
                options={{
                  showRowNumber: true,
                  allowHtml: true,
                  alternatingRowStyle: true,
                  width: "100%",
                }}
              />
            </div>
          </div>
        </ChartCard>

      </div>
    </div>
  );
}
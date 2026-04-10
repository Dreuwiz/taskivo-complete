export const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
export const MAX_PER_DAY = 10;

export const getBarColor = n => n===0 ? "#e74c3c" : n<=5 ? "#f0ad00" : "#2ecc71";

export const fmtDate = iso => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month:"short", day:"numeric" });
};

// Pending → In Progress → Under Review → Completed
// Reviewers can reject back to In Progress manually — not via this cycle
export const nextStatus = s =>
  s === "Pending"       ? "In Progress"   :
  s === "In Progress"   ? "Under Review"  :
  s === "Under Review"  ? "Under Review"  : // locked — reviewer must approve/reject
  "Pending";                                 // Completed → Pending (reopen)

export const PRIORITY_STYLE = {
  Critical: { bg:"#fdecea", text:"#c0392b" },
  High:     { bg:"#fff4e0", text:"#c47b00" },
  Medium:   { bg:"#e8f4fd", text:"#2386ff" },
  Low:      { bg:"#f0f0f0", text:"#666"    },
};

export const STATUS_STYLE = {
  "Pending":        { bg:"#f0f0f0", text:"#888"    },
  "In Progress":    { bg:"#ede9fc", text:"#694AD7" },
  "Under Review":   { bg:"#fff8e0", text:"#b07d00" },
  "Completed":      { bg:"#e6f9ed", text:"#27ae60" },
};

import { ROLES } from "../constants/roles";
export const roleBadge = r => ({
  backgroundColor: ROLES[r]?.lightBg,
  color: ROLES[r]?.color,
  border: `1px solid ${ROLES[r]?.color}44`,
});

export const getWeekCounts = (tasks) => {
  const counts = {Monday:0,Tuesday:0,Wednesday:0,Thursday:0,Friday:0,Saturday:0,Sunday:0};
  const completed = tasks.filter(t => t.status==="Completed");
  const dayNames  = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  completed.forEach((t, i) => {
    const day = dayNames[(i+1) % 7];
    counts[day] = (counts[day] || 0) + 1;
  });
  return counts;
};

export const btnStyle = (bg, color) => ({
  padding:"10px 18px", borderRadius:7, border:"none",
  backgroundColor:bg, color, fontSize:13, fontWeight:700,
  cursor:"pointer", boxShadow:"0 1px 4px rgba(0,0,0,0.1)",
});

export const inputStyle = {
  width:"100%", padding:"9px 12px", borderRadius:7,
  border:"1px solid #ddd", fontSize:14, fontFamily:"inherit",
  boxSizing:"border-box", outline:"none", color:"#1a1a1a",
};
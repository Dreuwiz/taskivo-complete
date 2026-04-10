import { MAX_PER_DAY, getBarColor } from "../../utils/helpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChartBar, faUsers, faCalendar, faClipboard, faPen, faTriangleExclamation, faCheck, faList } from "@fortawesome/free-solid-svg-icons";

export function Badge({ label, style }) {
  return (
    <span style={{ fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:20, ...style }}>
      {label}
    </span>
  );
}

export function Avatar({ initials, color, size=36 }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%",
      backgroundColor:color+"22", color, fontWeight:700,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:size*0.36, border:`2px solid ${color}44`, flexShrink:0,
    }}>
      {initials}
    </div>
  );
}

export function StatCard({ label, value, icon, color }) {
  return (
    <div style={{
      backgroundColor:"white", borderRadius:10, padding:"16px 16px 14px",
      position:"relative", boxShadow:"0 2px 8px rgba(0,0,0,0.08)",
      minHeight:90,
    }}>
      <p style={{ margin:"0 0 6px", fontSize:12, color:"#888", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.4px" }}>{label}</p>
      <i className={icon} style={{ position:"absolute", top:16, right:14, color, fontSize:18, opacity:0.85 }}/>
      <p style={{ fontSize:30, fontWeight:800, margin:0, color:"#1a1a1a", lineHeight:1 }}>{value}</p>
    </div>
  );
}

export function Card({ children, style }) {
  return (
    <div style={{
      backgroundColor:"white", borderRadius:10,
      boxShadow:"0 2px 8px rgba(0,0,0,0.09)", padding:20, ...style,
    }}>
      {children}
    </div>
  );
}

const emojiToIcon = {
  "📊": faChartBar,
  "👥": faUsers,
  "📅": faCalendar,
  "📋": faClipboard,
  "📝": faPen,
  "⚠️": faTriangleExclamation,
  "✅": faCheck,
  "🍩": faList, // for pie chart or something
};

export function SectionTitle({ icon, children }) {
  const faIcon = emojiToIcon[icon];
  return (
    <h3 style={{ margin:"0 0 16px", fontSize:15, fontWeight:700, color:"#333" }}>
      {icon && (
        faIcon ? <FontAwesomeIcon icon={faIcon} style={{ marginRight: 6 }} /> : <span style={{ marginRight:6 }}>{icon}</span>
      )}
      {children}
    </h3>
  );
}

export function PageHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom:28 }}>
      <h2 style={{ margin:0, fontSize:24, fontWeight:800, color:"#1a1a1a" }}>{title}</h2>
      {subtitle && <p style={{ margin:"4px 0 0", color:"#888", fontSize:13 }}>{subtitle}</p>}
    </div>
  );
}

export function WeekRow({ day, count }) {
  const pct = count===0 ? 100 : Math.min((count / MAX_PER_DAY) * 100, 100);
  return (
    <>
      <div style={{ fontSize:13, color:"#555" }}>{day}</div>
      <div style={{ width:"100%", height:8, borderRadius:4, backgroundColor:"#e0e0e0", overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`, borderRadius:4, backgroundColor:getBarColor(count), transition:"width 0.4s ease" }}/>
      </div>
      <span style={{ fontSize:13, fontWeight:700, color:"#333", textAlign:"right" }}>{count}</span>
    </>
  );
}

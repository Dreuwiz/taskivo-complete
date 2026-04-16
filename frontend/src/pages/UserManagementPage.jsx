import { useState } from "react";
import { ROLES } from "../constants/roles";
import { btnStyle, roleBadge } from "../utils/helpers";
import { Avatar, Badge, Card, PageHeader } from "../components/ui/index";
import { UserModal } from "../components/modals/UserModal";
import { ConfirmModal } from "../components/modals/ConfirmModal";

export function UserManagementPage({ users, tasks, onAddUser, onUpdateUser, onDeleteUser }) {
  const [showAdd,      setShowAdd]      = useState(false);
  const [editUser,     setEditUser]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search,       setSearch]       = useState("");
  const [roleFilter,   setRoleFilter]   = useState("All");

  const filtered = users
    .filter(u => roleFilter==="All" || u.role===roleFilter)
    .filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader title="User Management" subtitle="Add, edit, and remove system users — Admin only"/>

      <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap", alignItems:"center" }}>
        <button onClick={() => setShowAdd(true)} style={btnStyle("#c0392b","white")}>
          <i className="fa-solid fa-user-plus" style={{ marginRight:6 }}/>Add User
        </button>
        <div style={{ display:"flex", gap:6 }}>
          {["All","user","team_leader","manager","admin"].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              style={{ padding:"7px 13px", borderRadius:20, border:"1px solid", fontSize:12, fontWeight:600, cursor:"pointer",
                borderColor:roleFilter===r?"#c0392b":"#ddd",
                backgroundColor:roleFilter===r?"#c0392b":"white",
                color:roleFilter===r?"white":"#666" }}>
              {r==="All" ? "All" : ROLES[r]?.label}
            </button>
          ))}
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search users…"
          style={{ padding:"7px 12px", borderRadius:7, border:"1px solid #ddd", fontSize:13, outline:"none", width:200, marginLeft:"auto" }}/>
      </div>

      <Card style={{ padding:0, overflow:"hidden" }}>
        <div className="scroll-panel">
          <div className="table-responsive">
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ backgroundColor:"#f8f9fa", borderBottom:"1px solid #eee" }}>
                {["User","Email","Role","Team","Status","Tasks","Actions"].map(h => (
                  <th key={h} style={{ padding:"12px 16px", textAlign:"left", fontSize:11, fontWeight:700, color:"#aaa", textTransform:"uppercase", letterSpacing:"0.6px" }}>{h}</th>
                ))}
              </tr>
            </thead>
          <tbody>
            {filtered.map((u, i) => {
              const ut   = tasks.filter(t => t.assignedTo===u.name);
              const done = ut.filter(t => t.status==="Completed").length;
              return (
                <tr key={u.id} style={{ borderBottom:i<filtered.length-1?"1px solid #f0f0f0":"none" }}>
                  <td style={{ padding:"12px 16px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <Avatar initials={u.avatar} color={ROLES[u.role]?.color||"#888"} size={32}/>
                      <span style={{ fontSize:14, fontWeight:600, color:"#1a1a1a" }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ padding:"12px 16px", fontSize:13, color:"#555" }}>{u.email}</td>
                  <td style={{ padding:"12px 16px" }}>
                    <Badge label={ROLES[u.role]?.label||u.role} style={roleBadge(u.role)}/>
                  </td>
                  <td style={{ padding:"12px 16px", fontSize:13, color:"#777" }}>{u.team||"—"}</td>
                  <td style={{ padding:"12px 16px" }}>
                    <Badge label={u.status} style={{ backgroundColor:u.status==="Active"?"#e6f9ed":"#fdecea", color:u.status==="Active"?"#27ae60":"#c0392b" }}/>
                  </td>
                  <td style={{ padding:"12px 16px", fontSize:13, color:"#888" }}>{done}/{ut.length}</td>
                  <td style={{ padding:"12px 16px" }}>
                    <div style={{ display:"flex", gap:6 }}>
                      <button onClick={() => setEditUser(u)} style={{ background:"#f0f7ff", border:"1px solid #d9e8fc", borderRadius:5, padding:"4px 10px", fontSize:12, color:"#2386ff", cursor:"pointer" }}>
                        <i className="fa-solid fa-pen"/>
                      </button>
                      <button onClick={() => setDeleteTarget(u)} style={{ background:"#fdecea", border:"1px solid #f5c6c2", borderRadius:5, padding:"4px 10px", fontSize:12, color:"#c0392b", cursor:"pointer" }}>
                        <i className="fa-solid fa-trash"/>
                      </button>
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

      {showAdd      && <UserModal mode="add"  onSave={onAddUser}    onClose={() => setShowAdd(false)}/>}
      {editUser     && <UserModal mode="edit" initial={editUser} onSave={onUpdateUser} onClose={() => setEditUser(null)}/>}
      {deleteTarget && <ConfirmModal message={`Remove "${deleteTarget.name}"? Their tasks will remain.`} onConfirm={() => { onDeleteUser(deleteTarget.id); setDeleteTarget(null); }} onClose={() => setDeleteTarget(null)}/>}
    </div>
  );
}

import { useState } from "react";
import { ROLES } from "../constants/roles";
import { btnStyle, roleBadge } from "../utils/helpers";
import { Avatar, Badge, Card, SectionTitle, PageHeader } from "../components/ui/index";
import { TeamModal } from "../components/modals/TeamModal";
import { ConfirmModal } from "../components/modals/ConfirmModal";

export function TeamManagementPage({ role, tasks, users, onUpdateUser }) {
  const [showCreate,     setShowCreate]     = useState(false);
  const [editTeam,       setEditTeam]       = useState(null);
  const [dissolveTarget, setDissolveTarget] = useState(null);

  const allTeamNames = [...new Set(users.filter(u => u.team).map(u => u.team))];
  const teams = allTeamNames.map(name => {
    const members = users.filter(u => u.team===name);
    const leader  = members.find(u => u.role==="team_leader");
    const staff   = members.filter(u => u.role==="user");
    return { name, leader, staff, members };
  });

  const handleCreate = ({ name, leaderId, memberIds }) => {
    const leader = users.find(u => u.id===leaderId);
    if (leader) onUpdateUser({ ...leader, team:name });
    memberIds.forEach(id => {
      const u = users.find(x => x.id===id);
      if (u) onUpdateUser({ ...u, team:name });
    });
  };

  const handleEdit = ({ name: newName, leaderId, memberIds }, oldName) => {
    const newMemberSet = new Set([leaderId, ...memberIds]);

    const affected = users.filter(u => u.team === oldName || newMemberSet.has(u.id));

    affected.forEach(u => {
      if (u.id === leaderId) {
        onUpdateUser({ ...u, team: newName });
      } else if (memberIds.includes(u.id)) {
        onUpdateUser({ ...u, team: newName });
      } else {
        onUpdateUser({ ...u, team: null });
      }
    });
  };

  const handleDissolve = name => {
    users.filter(u => u.team===name).forEach(u => onUpdateUser({ ...u, team:null }));
    setDissolveTarget(null);
  };

  const unassigned = users.filter(u => (u.role==="user" || u.role==="team_leader") && !u.team);

  return (
    <div>
      <PageHeader title="Team Management" subtitle="Create teams, assign leaders and staff members"/>

      <div style={{ display:"flex", gap:12, marginBottom:24, alignItems:"center" }}>
        <button onClick={() => setShowCreate(true)} style={btnStyle("#694AD7","white")}>
          <i className="fa-solid fa-people-group" style={{ marginRight:8 }}/>Create New Team
        </button>
        <span style={{ fontSize:13, color:"#aaa" }}>
          {teams.length} team{teams.length!==1?"s":""} · {users.filter(u=>u.team).length} assigned · {unassigned.length} unassigned
        </span>
      </div>

      {teams.length===0 && (
        <Card style={{ textAlign:"center", padding:48, color:"#aaa", maxWidth:"100%" }}>
          <i className="fa-solid fa-people-group" style={{ fontSize:36, marginBottom:12, display:"block", opacity:0.3 }}/>
          <p style={{ margin:0, fontSize:15, fontWeight:600 }}>No teams yet</p>
          <p style={{ margin:"6px 0 0", fontSize:13 }}>Click "Create New Team" to get started.</p>
        </Card>
      )}

      {teams.map(({ name, leader, staff, members }) => {
        const teamTasks = tasks.filter(t => t.team===name);
        const done = teamTasks.filter(t => t.status==="Completed").length;
        const pct  = teamTasks.length ? Math.round((done/teamTasks.length)*100) : 0;
        return (
          <Card key={name} style={{ maxWidth:"100%", marginBottom:20 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
              <div>
                <h3 style={{ margin:0, fontSize:17, fontWeight:800, color:"#1a1a1a" }}>
                  <i className="fa-solid fa-people-group" style={{ marginRight:8, color:"#694AD7" }}/>Team {name}
                </h3>
                <p style={{ margin:"3px 0 0", fontSize:12, color:"#888" }}>{members.length} member{members.length!==1?"s":""} · {done}/{teamTasks.length} tasks done</p>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={() => setEditTeam({ name, leaderId:leader?.id||"", memberIds:staff.map(u=>u.id) })}
                  style={{ background:"#f0f7ff", border:"1px solid #d9e8fc", borderRadius:6, padding:"6px 14px", fontSize:12, fontWeight:600, color:"#2386ff", cursor:"pointer" }}>
                  <i className="fa-solid fa-pen" style={{ marginRight:6 }}/>Edit
                </button>
                <button onClick={() => setDissolveTarget(name)}
                  style={{ background:"#fdecea", border:"1px solid #f5c6c2", borderRadius:6, padding:"6px 14px", fontSize:12, fontWeight:600, color:"#c0392b", cursor:"pointer" }}>
                  <i className="fa-solid fa-trash" style={{ marginRight:6 }}/>Dissolve
                </button>
              </div>
            </div>

            <div style={{ height:5, borderRadius:3, backgroundColor:"#e0e0e0", overflow:"hidden", marginBottom:18 }}>
              <div style={{ height:"100%", width:`${pct}%`, backgroundColor:pct>=70?"#2ecc71":pct>=40?"#f0ad00":"#e74c3c", transition:"width 0.5s", borderRadius:3 }}/>
            </div>

            <p style={{ margin:"0 0 8px", fontSize:11, fontWeight:700, color:"#aaa", textTransform:"uppercase", letterSpacing:"0.5px" }}>Team Leader</p>
            {leader ? (
              <div style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", borderRadius:8, backgroundColor:"#ede9fc", marginBottom:14 }}>
                <Avatar initials={leader.avatar} color={ROLES.team_leader.color} size={32}/>
                <div style={{ flex:1 }}>
                  <p style={{ margin:0, fontWeight:700, fontSize:14, color:"#1a1a1a" }}>{leader.name}</p>
                  <p style={{ margin:0, fontSize:12, color:"#694AD7" }}>{leader.email}</p>
                </div>
                <Badge label="Team Leader" style={roleBadge("team_leader")}/>
              </div>
            ) : (
              <div style={{ padding:"10px 12px", borderRadius:8, backgroundColor:"#fff4e0", border:"1px solid #ffe0a0", marginBottom:14, fontSize:13, color:"#c47b00" }}>
                <i className="fa-solid fa-triangle-exclamation" style={{ marginRight:6 }}/>No Team Leader assigned
              </div>
            )}

            <p style={{ margin:"0 0 8px", fontSize:11, fontWeight:700, color:"#aaa", textTransform:"uppercase", letterSpacing:"0.5px" }}>Staff Members ({staff.length})</p>
            {staff.length===0 ? (
              <p style={{ margin:0, fontSize:13, color:"#bbb", fontStyle:"italic" }}>No staff assigned yet.</p>
            ) : staff.map((u, i) => (
              <div key={u.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"9px 0", borderBottom:i<staff.length-1?"1px solid #f5f5f5":"none" }}>
                <Avatar initials={u.avatar} color={ROLES.user.color} size={30}/>
                <div style={{ flex:1 }}>
                  <p style={{ margin:0, fontWeight:600, fontSize:13 }}>{u.name}</p>
                  <p style={{ margin:0, fontSize:11, color:"#888" }}>{u.email}</p>
                </div>
                <span style={{ fontSize:12, color:"#888" }}>
                  {tasks.filter(t=>t.assignedTo===u.name&&t.status==="Completed").length}/
                  {tasks.filter(t=>t.assignedTo===u.name).length} done
                </span>
              </div>
            ))}
          </Card>
        );
      })}

      {unassigned.length > 0 && (
        <Card style={{ maxWidth:"100%", backgroundColor:"#fffbe6", border:"1px solid #ffe58f" }}>
          <SectionTitle icon="⚠️">Unassigned Users</SectionTitle>
          <p style={{ margin:"0 0 12px", fontSize:13, color:"#888" }}>These users have no team.</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
            {unassigned.map(u => (
              <div key={u.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 12px", borderRadius:20, backgroundColor:"white", border:"1px solid #e0e0e0" }}>
                <Avatar initials={u.avatar} color={ROLES[u.role]?.color||"#888"} size={24}/>
                <span style={{ fontSize:13, fontWeight:600, color:"#333" }}>{u.name}</span>
                <Badge label={ROLES[u.role]?.label} style={roleBadge(u.role)}/>
              </div>
            ))}
          </div>
        </Card>
      )}

      {showCreate && <TeamModal mode="add" users={users} allTeams={allTeamNames} onSave={handleCreate} onClose={() => setShowCreate(false)}/>}
      {editTeam   && <TeamModal mode="edit" initial={editTeam} users={users} allTeams={allTeamNames} onSave={d => handleEdit(d, editTeam.name)} onClose={() => setEditTeam(null)}/>}
      {dissolveTarget && <ConfirmModal message={`Dissolve "Team ${dissolveTarget}"? All members will become unassigned.`} onConfirm={() => handleDissolve(dissolveTarget)} onClose={() => setDissolveTarget(null)}/>}
    </div>
  );
}
import { useState } from "react";
import { Modal, Field } from "../ui/Modal";
import { Avatar } from "../ui/index";
import { ROLES } from "../../constants/roles";
import { inputStyle } from "../../utils/helpers";

export function TeamModal({ mode, initial, users, allTeams, onSave, onClose }) {
  const [teamName,  setTeamName]  = useState(initial?.name || "");
  // ✅ FIXED: coerce to string so <select> value comparison works correctly
  const [leaderId,  setLeaderId]  = useState(String(initial?.leaderId ?? ""));
  const [memberIds, setMemberIds] = useState(initial?.memberIds || []);
  const [nameError, setNameError] = useState("");

  const eligibleLeaders = users.filter(u =>
    u.role==="team_leader" && (u.team===null || u.team===initial?.name)
  );
  const eligibleMembers = users.filter(u =>
    u.role==="user" && (u.team===null || u.team===initial?.name)
  );

  const toggleMember = id =>
    setMemberIds(p => p.includes(id) ? p.filter(x => x!==id) : [...p, id]);

  const handleSave = () => {
    const trimmed = teamName.trim();
    if (!trimmed) { setNameError("Team name is required."); return; }
    if (allTeams.includes(trimmed) && trimmed!==initial?.name) { setNameError("A team with that name already exists."); return; }
    if (!leaderId) { alert("Please assign a Team Leader."); return; }
    // ✅ Convert leaderId back to number to match user id type
    onSave({ name: trimmed, leaderId: Number(leaderId), memberIds });
    onClose();
  };

  return (
    <Modal
      title={mode==="add" ? "Create New Team" : "Edit Team"}
      onClose={onClose}
      onSubmit={handleSave}
      submitLabel={mode==="add" ? "Create Team" : "Save Changes"}
      submitColor="#694AD7"
    >
      <Field label="Team Name">
        <input
          style={{ ...inputStyle, borderColor:nameError?"#e74c3c":"#ddd" }}
          value={teamName}
          onChange={e => { setTeamName(e.target.value); setNameError(""); }}
          placeholder="e.g. Alpha, Delta, Phoenix…"
        />
        {nameError && <p style={{ margin:"4px 0 0", fontSize:12, color:"#c0392b" }}>{nameError}</p>}
      </Field>

      <Field label="Team Leader / Supervisor">
        {eligibleLeaders.length === 0 ? (
          <div style={{ padding:"10px 12px", borderRadius:7, border:"1px solid #f5c6c2", backgroundColor:"#fdecea", fontSize:13, color:"#c0392b" }}>
            No available Team Leaders. Add a user with the Team Leader role first.
          </div>
        ) : (
          <select style={inputStyle} value={leaderId} onChange={e => setLeaderId(e.target.value)}>
            <option value="">— Select a Team Leader —</option>
            {eligibleLeaders.map(u => (
              // ✅ value is u.id coerced to string by HTML automatically — matches leaderId state
              <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
            ))}
          </select>
        )}
      </Field>

      <Field label={`Staff Members (${memberIds.length} selected)`}>
        {eligibleMembers.length === 0 ? (
          <div style={{ padding:"10px 12px", borderRadius:7, border:"1px solid #ddd", backgroundColor:"#f8f8f8", fontSize:13, color:"#888" }}>
            No available staff. Add users with the User / Staff role first.
          </div>
        ) : (
          <div style={{ border:"1px solid #ddd", borderRadius:7, overflow:"hidden", maxHeight:200, overflowY:"auto" }}>
            {eligibleMembers.map((u, i) => {
              const checked = memberIds.includes(u.id);
              return (
                <div key={u.id}
                  onClick={() => toggleMember(u.id)}
                  style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", cursor:"pointer", backgroundColor:checked?"#f0f7ff":"white", borderBottom:i<eligibleMembers.length-1?"1px solid #f0f0f0":"none", transition:"background 0.1s" }}>
                  <div style={{ width:18, height:18, borderRadius:4, border:`2px solid ${checked?"#2386ff":"#ccc"}`, backgroundColor:checked?"#2386ff":"white", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.15s" }}>
                    {checked && <i className="fa-solid fa-check" style={{ color:"white", fontSize:10 }}/>}
                  </div>
                  <Avatar initials={u.avatar} color={ROLES[u.role]?.color||"#888"} size={28}/>
                  <div>
                    <p style={{ margin:0, fontSize:13, fontWeight:600, color:"#1a1a1a" }}>{u.name}</p>
                    <p style={{ margin:0, fontSize:11, color:"#888" }}>{u.email}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <p style={{ margin:"6px 0 0", fontSize:11, color:"#aaa" }}>Click to select or deselect staff members.</p>
      </Field>
    </Modal>
  );
}

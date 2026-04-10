export function Modal({ title, onClose, onSubmit, submitLabel="Save", submitColor="#2386ff", children }) {
  return (
    <div style={{ position:"fixed", inset:0, backgroundColor:"rgba(0,0,0,0.4)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ backgroundColor:"white", borderRadius:14, padding:28, width:480, maxWidth:"92vw", maxHeight:"88vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h3 style={{ margin:0, fontSize:17, fontWeight:800, color:"#1a1a1a" }}>{title}</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"#999", lineHeight:1, padding:"2px 6px" }}>×</button>
        </div>
        {children}
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:22 }}>
          <button onClick={onClose} style={{ padding:"9px 18px", borderRadius:7, border:"1px solid #e0e0e0", background:"white", fontSize:13, fontWeight:600, cursor:"pointer", color:"#666" }}>Cancel</button>
          <button onClick={onSubmit} style={{ padding:"9px 18px", borderRadius:7, border:"none", background:submitColor, fontSize:13, fontWeight:700, cursor:"pointer", color:"white" }}>{submitLabel}</button>
        </div>
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:"block", fontSize:12, fontWeight:700, color:"#555", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.4px" }}>{label}</label>
      {children}
    </div>
  );
}

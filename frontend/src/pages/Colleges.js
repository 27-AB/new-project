import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { PageHeader, Loader, ErrorMsg } from "../components/ui";

const API = localStorage.getItem("astu_college_url") || "http://localhost:4003";

export default function Colleges() {
  const { token } = useAuth();
  const [colleges, setColleges] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    fetch(`${API}/colleges`, { headers:{ Authorization:`Bearer ${token}` }})
      .then(r=>r.json()).then(d=>setColleges(d.colleges||[]))
      .catch(e=>setError(e.message)).finally(()=>setLoading(false));
  }, [token]);

  const handleSeed = async () => {
    await fetch(`${API}/seed`, { method:"POST", headers:{ Authorization:`Bearer ${token}` }});
    window.location.reload();
  };

  if (loading) return <Loader />;
  if (error)   return <ErrorMsg message={error} />;

  return (
    <div>
      <PageHeader title="Colleges & Institutes" sub={`${colleges.length} colleges at Adama Science and Technology University`}
        actions={colleges.length===0 && <button onClick={handleSeed} style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"9px 16px", color:"#94a3b8", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Seed Colleges</button>}
      />

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:18 }}>
        {colleges.map(col => (
          <div key={col._id} style={{ background:"#162030", border:`1px solid ${col.color}30`, borderRadius:14, padding:24, position:"relative", overflow:"hidden", transition:"transform .2s, border-color .2s", cursor:"default" }}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.borderColor=`${col.color}60`;}}
            onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.borderColor=`${col.color}30`;}}>

            {/* Color bar top */}
            <div style={{ position:"absolute", top:0, left:0, right:0, height:4, background:`linear-gradient(90deg,${col.color},${col.color}80)`, borderRadius:"14px 14px 0 0" }} />

            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:14 }}>
              <div style={{ width:46, height:46, borderRadius:12, background:`${col.color}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>🏛️</div>
              <span style={{ background:`${col.color}20`, color:col.color, padding:"3px 10px", borderRadius:99, fontSize:11, fontWeight:700 }}>{col.shortName}</span>
            </div>

            <h3 style={{ color:"#e2e8f0", fontSize:15, fontWeight:700, margin:"0 0 6px", lineHeight:1.3 }}>{col.name}</h3>
            <p style={{ color:"#64748b", fontSize:12, margin:"0 0 12px" }}>Dean: {col.dean} · Est. {col.established}</p>
            <p style={{ color:"#94a3b8", fontSize:12, margin:"0 0 14px", lineHeight:1.6 }}>{col.description}</p>

            <div>
              <p style={{ color:"#475569", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:".05em", marginBottom:8 }}>Departments</p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {(col.departments||[]).map(d=>(
                  <span key={d} style={{ background:"rgba(255,255,255,0.05)", color:"#94a3b8", padding:"3px 8px", borderRadius:6, fontSize:11 }}>{d}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

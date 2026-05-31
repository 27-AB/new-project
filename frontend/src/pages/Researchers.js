import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { PageHeader, SectionCard, Loader, ErrorMsg, Btn } from "../components/ui";

import { getServiceUrl } from "../config/api";

const API = getServiceUrl("college");

// Correct official colleges
const COLLEGES = [
  "College of Electrical Engineering & Computing",
  "College of Mechanical, Chemical & Materials Engineering",
  "College of Civil Engineering and Architecture",
  "College of Applied Natural Science",
  "College of Humanities and Social Science",
  "Postgraduate Programs",
];

export default function Researchers() {
  const { token } = useAuth();
  const [researchers, setResearchers] = useState([]);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [search,      setSearch]      = useState("");
  const [college,     setCollege]     = useState("");
  
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState("directory"); // "directory" or "network"
  const [selectedNode, setSelectedNode] = useState(null); // Dynamic profile drawer

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 100, ...(search && { search }), ...(college && { college }) });
      const res = await fetch(`${API}/researchers?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await res.json();
      setResearchers(d.researchers || []); setTotal(d.total || 0);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [token, search, college]);

  useEffect(() => { load(); }, [load]);

  const handleSeed = async () => {
    await fetch(`${API}/seed`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    load();
  };

  const totalPubs = researchers.reduce((s, r) => s + (r.publications || 0), 0);

  // --- Network Collaboration Map Calculations ---
  const generateNetworkData = () => {
    const nodes = [];
    const links = [];

    // 1. Create College Hub Nodes
    COLLEGES.forEach((colName, index) => {
      const angle = (index / COLLEGES.length) * 2 * Math.PI;
      const radius = 160;
      const x = 300 + radius * Math.cos(angle);
      const y = 250 + radius * Math.sin(angle);

      nodes.push({
        id: colName,
        label: colName.replace("College of ", "").split(" & ")[0].split(" and ")[0],
        type: "college",
        x,
        y,
        color: ["#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#06b6d4", "#ef4444"][index % 6],
        details: colName
      });
    });

    // 2. Map Researchers to College Hubs
    researchers.forEach((res, index) => {
      const parentCollege = nodes.find(n => n.id === res.college);
      if (!parentCollege) return;

      // Position researcher orbiting their parent college hub
      const orbitIndex = index;
      const orbitAngle = (orbitIndex / 4) * 2 * Math.PI + (Math.random() * 0.5);
      const orbitRadius = 60;
      const x = parentCollege.x + orbitRadius * Math.cos(orbitAngle);
      const y = parentCollege.y + orbitRadius * Math.sin(orbitAngle);

      const resNode = {
        id: res._id,
        label: res.name,
        type: "researcher",
        x,
        y,
        color: parentCollege.color,
        details: res
      };

      nodes.push(resNode);

      // Link researcher to their college hub
      links.push({
        source: res._id,
        target: res.college,
        color: parentCollege.color,
        width: 1.5
      });
    });

    // 3. Create cross-disciplinary collaboration paths (if researchers share interest tags)
    for (let i = 0; i < researchers.length; i++) {
      for (let j = i + 1; j < researchers.length; j++) {
        const r1 = researchers[i];
        const r2 = researchers[j];
        
        // If they share any specialization tag, draw a glowing collaboration bridge!
        const sharedTags = (r1.specialization || []).filter(tag => (r2.specialization || []).includes(tag));
        if (sharedTags.length > 0 && r1.college !== r2.college) {
          links.push({
            source: r1._id,
            target: r2._id,
            color: "rgba(255, 255, 255, 0.15)",
            width: 1,
            dashed: true,
            label: sharedTags[0]
          });
        }
      }
    }

    return { nodes, links };
  };

  const { nodes, links } = activeTab === "network" ? generateNetworkData() : { nodes: [], links: [] };

  return (
    <div style={{ position: "relative" }}>
      <PageHeader
        title="Researchers & Faculty"
        sub={`${total} active researchers · ${totalPubs} total publications`}
        actions={researchers.length === 0 && (
          <Btn onClick={handleSeed} variant="secondary">Seed Faculty Data</Btn>
        )}
      />

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 20, paddingBottom: 2 }}>
        <button
          onClick={() => { setActiveTab("directory"); setSelectedNode(null); }}
          style={{
            background: "transparent", border: "none",
            borderBottom: activeTab === "directory" ? "2px solid #22d3ee" : "2px solid transparent",
            color: activeTab === "directory" ? "#22d3ee" : "#64748b",
            padding: "10px 16px", cursor: "pointer", fontSize: 14, fontWeight: 600, transition: "all .15s"
          }}>
          📇 Faculty Cards Directory
        </button>
        <button
          onClick={() => { setActiveTab("network"); setSelectedNode(null); }}
          style={{
            background: "transparent", border: "none",
            borderBottom: activeTab === "network" ? "2px solid #22d3ee" : "2px solid transparent",
            color: activeTab === "network" ? "#22d3ee" : "#64748b",
            padding: "10px 16px", cursor: "pointer", fontSize: 14, fontWeight: 600, transition: "all .15s"
          }}>
          🕸️ Interdisciplinary Collaboration Graph
        </button>
      </div>

      {loading && <Loader />}
      {error   && <ErrorMsg message={error} />}

      {!loading && !error && (
        <>
          {/* Tab 1: Faculty Card Directory */}
          {activeTab === "directory" && (
            <>
              {/* Filters */}
              <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name or specialization…"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 14px", color: "#e2e8f0", fontSize: 13, width: 300, outline: "none", fontFamily: "inherit" }}
                />
                <select value={college} onChange={e => setCollege(e.target.value)}
                  style={{ background: "#162030", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 14px", color: "#94a3b8", fontSize: 13, outline: "none", fontFamily: "inherit", maxWidth: 260 }}>
                  <option value="">All Colleges</option>
                  {COLLEGES.map(c => <option key={c} value={c}>{c.replace("College of ", "")}</option>)}
                </select>
              </div>

              {/* Cards Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
                {researchers.map(r => (
                  <div
                    key={r._id}
                    onClick={() => setSelectedNode(r)}
                    style={{ background: "#162030", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 20, transition: "transform .2s, border-color .2s", cursor: "pointer" }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.borderColor = "rgba(34,211,238,0.4)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}>

                    {/* Avatar + name */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                      <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#1d4ed8,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                        {r.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                      </div>
                      <div>
                        <p style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 700, margin: 0 }}>{r.name}</p>
                        <p style={{ color: "#64748b", fontSize: 12, margin: "2px 0 0" }}>{r.title} · {r.department}</p>
                      </div>
                    </div>

                    <p style={{ color: "#64748b", fontSize: 12, margin: "0 0 8px" }}>📧 {r.email}</p>
                    <p style={{ color: "#475569", fontSize: 11, margin: "0 0 12px", fontWeight: 600 }}>🏛️ {r.college?.replace("College of ", "")}</p>

                    {/* Specializations */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
                      {(r.specialization || []).map(s => (
                        <span key={s} style={{ background: "rgba(34,211,238,0.08)", color: "#22d3ee", padding: "2px 8px", borderRadius: 99, fontSize: 11 }}>{s}</span>
                      ))}
                    </div>

                    {/* Stats */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12 }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ color: "#a78bfa", fontSize: 20, fontWeight: 700 }}>{r.publications}</div>
                        <div style={{ color: "#475569", fontSize: 10 }}>Publications</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ color: "#22d3ee", fontSize: 20, fontWeight: 700 }}>{r.activeProjects}</div>
                        <div style={{ color: "#475569", fontSize: 10 }}>Active Projects</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Tab 2: Interactive SVG Collaboration Graph */}
          {activeTab === "network" && (
            <SectionCard title="ASTU Research & Science Web Map">
              <p style={{ color: "#64748b", fontSize: 13, marginBottom: 20 }}>
                Hover over hubs and orbits to trace interdisciplinary boundaries. Pulsing centers are Colleges. Orbiter nodes are faculty. Click any node to slide open their research dossier.
              </p>
              
              <div style={{ position: "relative", overflow: "hidden", background: "#090f17", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
                <svg width="100%" height="520" viewBox="0 0 600 500" style={{ display: "block" }}>
                  {/* Define animations/gradients */}
                  <defs>
                    <style>{`
                      @keyframes pulse {
                        0% { r: 12px; opacity: 0.2; }
                        50% { r: 24px; opacity: 0.6; }
                        100% { r: 12px; opacity: 0.2; }
                      }
                      .pulsing-glow {
                        animation: pulse 3s infinite ease-in-out;
                      }
                    `}</style>
                  </defs>

                  {/* Draw links */}
                  {links.map((link, idx) => {
                    const srcNode = nodes.find(n => n.id === link.source);
                    const tgtNode = nodes.find(n => n.id === link.target);
                    if (!srcNode || !tgtNode) return null;

                    return (
                      <g key={idx}>
                        <line
                          x1={srcNode.x}
                          y1={srcNode.y}
                          x2={tgtNode.x}
                          y2={tgtNode.y}
                          stroke={link.color}
                          strokeWidth={link.width}
                          strokeDasharray={link.dashed ? "4,4" : undefined}
                          opacity={link.dashed ? 0.3 : 0.6}
                        />
                        {link.label && (
                          <text
                            x={(srcNode.x + tgtNode.x) / 2}
                            y={(srcNode.y + tgtNode.y) / 2 - 4}
                            fill="#64748b"
                            fontSize="8"
                            textAnchor="middle"
                            opacity="0.75"
                            fontFamily="monospace">
                            {link.label}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* Draw nodes */}
                  {nodes.map(node => {
                    const isCollege = node.type === "college";
                    
                    return (
                      <g
                        key={node.id}
                        onClick={() => setSelectedNode(node.type === "researcher" ? node.details : null)}
                        style={{ cursor: "pointer" }}>
                        
                        {/* Glow for college hubs */}
                        {isCollege && (
                          <circle
                            cx={node.x}
                            cy={node.y}
                            fill={node.color}
                            className="pulsing-glow"
                          />
                        )}

                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={isCollege ? 10 : 6}
                          fill={isCollege ? node.color : "#1e293b"}
                          stroke={node.color}
                          strokeWidth={2}
                        />
                        
                        <text
                          x={node.x}
                          y={node.y + (isCollege ? 22 : 14)}
                          fill={isCollege ? "#e2e8f0" : "#94a3b8"}
                          fontSize={isCollege ? 10 : 8}
                          fontWeight={isCollege ? 700 : 500}
                          textAnchor="middle"
                          pointerEvents="none">
                          {node.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </SectionCard>
          )}

          {/* Slide-out Sidebar Drawer for Selected Researcher */}
          {selectedNode && (
            <div
              style={{
                position: "fixed", top: 0, right: 0, width: 380, height: "100vh",
                background: "rgba(15, 23, 42, 0.95)", backdropFilter: "blur(12px)",
                borderLeft: "1px solid rgba(255,255,255,0.08)", zIndex: 600,
                boxShadow: "-10px 0 30px rgba(0,0,0,0.5)", padding: 32, boxSizing: "border-box",
                display: "flex", flexDirection: "column", gap: 20, transition: "all 0.3s ease"
              }}>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 16 }}>
                <span style={{ color: "#22d3ee", fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: ".08em" }}>Faculty Dossier</span>
                <button
                  onClick={() => setSelectedNode(null)}
                  style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "#64748b", borderRadius: "50%", width: 26, height: 26, cursor: "pointer", fontSize: 14 }}>
                  ✕
                </button>
              </div>

              {/* Profile Header */}
              <div style={{ textAlign: "center", marginTop: 10 }}>
                <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg,#1d4ed8,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 28, margin: "0 auto 16px" }}>
                  {selectedNode.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                </div>
                <h2 style={{ color: "#e2e8f0", fontSize: 18, fontWeight: 700, margin: "0 0 4px" }}>{selectedNode.name}</h2>
                <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>{selectedNode.title} · {selectedNode.department}</p>
              </div>

              {/* Bio & Details */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 10 }}>
                <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 8, padding: 14, border: "1px solid rgba(255,255,255,0.05)" }}>
                  <p style={{ color: "#475569", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", margin: "0 0 4px" }}>Affiliation</p>
                  <p style={{ color: "#e2e8f0", fontSize: 13, margin: 0, fontWeight: 500 }}>{selectedNode.college}</p>
                </div>

                <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 8, padding: 14, border: "1px solid rgba(255,255,255,0.05)" }}>
                  <p style={{ color: "#475569", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", margin: "0 0 4px" }}>Contact Email</p>
                  <p style={{ color: "#94a3b8", fontSize: 13, margin: 0, fontFamily: "monospace" }}>{selectedNode.email}</p>
                </div>

                <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 8, padding: 14, border: "1px solid rgba(255,255,255,0.05)" }}>
                  <p style={{ color: "#475569", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", margin: "0 0 4px" }}>Research Focus</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 4 }}>
                    {(selectedNode.specialization || []).map(s => (
                      <span key={s} style={{ background: "rgba(34,211,238,0.08)", color: "#22d3ee", padding: "2px 8px", borderRadius: 99, fontSize: 11 }}>{s}</span>
                    ))}
                  </div>
                </div>

                {/* Publications & Projects Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div style={{ background: "rgba(167, 139, 250, 0.05)", border: "1px solid rgba(167, 139, 250, 0.15)", borderRadius: 8, padding: 12, textAlign: "center" }}>
                    <div style={{ color: "#a78bfa", fontSize: 24, fontWeight: 700 }}>{selectedNode.publications}</div>
                    <div style={{ color: "#64748b", fontSize: 11 }}>Publications</div>
                  </div>
                  <div style={{ background: "rgba(34, 211, 238, 0.05)", border: "1px solid rgba(34, 211, 238, 0.15)", borderRadius: 8, padding: 12, textAlign: "center" }}>
                    <div style={{ color: "#22d3ee", fontSize: 24, fontWeight: 700 }}>{selectedNode.activeProjects}</div>
                    <div style={{ color: "#64748b", fontSize: 11 }}>Active Projects</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

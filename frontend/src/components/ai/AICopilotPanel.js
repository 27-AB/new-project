import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Btn } from "../ui";
import { getServiceUrl } from "../../config/api";

const API = getServiceUrl("analytics");

export default function AICopilotPanel({ title, summary, college, department }) {
  const { token } = useAuth();
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);

  const runCopilot = async () => {
    if (!title && !summary) {
      setError("Enter a project title or summary first.");
      return;
    }
    setRunning(true); setError(null); setResult(null);
    try {
      const res = await fetch(`${API}/api/ai/analyze-project`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, summary, college, department }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Analysis failed");
      setResult(json);
    } catch (e) { setError(e.message); }
    finally { setRunning(false); }
  };

  return (
    <div style={{ gridColumn: "1/-1", background: "#0f1824", border: "1px solid rgba(167,139,250,0.25)", borderRadius: 10, padding: 16, marginTop: 4, marginBottom: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: result || error ? 14 : 0 }}>
        <div>
          <div style={{ color: "#a78bfa", fontSize: 13, fontWeight: 700 }}>🧠 AI Project Copilot</div>
          <div style={{ color: "#64748b", fontSize: 11.5, marginTop: 2 }}>Checks for duplicates, suggests tags, collaborators, and funding sources.</div>
        </div>
        <Btn variant="secondary" small onClick={runCopilot} disabled={running}>
          {running ? "Analyzing…" : "Run AI Copilot"}
        </Btn>
      </div>

      {error && <div style={{ color: "#f87171", fontSize: 12.5, marginTop: 8 }}>{error}</div>}

      {result && (
        <div style={{ display: "grid", gap: 14, marginTop: 4 }}>
          <div style={{ fontSize: 10.5, color: result.engine === "gemini" ? "#22d3ee" : "#94a3b8" }}>
            {result.engine === "gemini" ? "✨ Deep-learning analysis" : "⚙ Local heuristic analysis"}
          </div>

          {result.tags?.length > 0 && (
            <div>
              <div style={{ color: "#94a3b8", fontSize: 11, fontWeight: 600, textTransform: "uppercase", marginBottom: 6 }}>Suggested Tags</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {result.tags.map((t, i) => (
                  <span key={i} style={{ background: "rgba(34,211,238,0.12)", color: "#22d3ee", padding: "3px 10px", borderRadius: 99, fontSize: 11.5 }}>{t}</span>
                ))}
              </div>
            </div>
          )}

          {result.similarProjects?.length > 0 && (
            <div>
              <div style={{ color: "#94a3b8", fontSize: 11, fontWeight: 600, textTransform: "uppercase", marginBottom: 6 }}>⚠ Possible Duplicates</div>
              <div style={{ display: "grid", gap: 6 }}>
                {result.similarProjects.map((p, i) => (
                  <div key={i} style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, padding: "8px 10px", fontSize: 12 }}>
                    <span style={{ color: "#f59e0b", fontWeight: 700 }}>{p.overlapPercent}% overlap</span>{" — "}
                    <span style={{ color: "#e2e8f0" }}>{p.title}</span>
                    {p.lead && <span style={{ color: "#64748b" }}> ({p.lead}, {p.college})</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.collaboratorMatches?.length > 0 && (
            <div>
              <div style={{ color: "#94a3b8", fontSize: 11, fontWeight: 600, textTransform: "uppercase", marginBottom: 6 }}>Suggested Collaborators</div>
              <div style={{ display: "grid", gap: 6 }}>
                {result.collaboratorMatches.map((c, i) => (
                  <div key={i} style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 8, padding: "8px 10px", fontSize: 12 }}>
                    <span style={{ color: "#4ade80", fontWeight: 700 }}>{c.name}</span>
                    <span style={{ color: "#64748b" }}> · {c.department}</span>
                    {c.reasons?.length > 0 && <div style={{ color: "#94a3b8", marginTop: 2 }}>Match: {c.reasons.join(", ")}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.fundingOpportunities?.length > 0 && (
            <div>
              <div style={{ color: "#94a3b8", fontSize: 11, fontWeight: 600, textTransform: "uppercase", marginBottom: 6 }}>Funding Opportunities</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {result.fundingOpportunities.map((f, i) => (
                  <span key={i} style={{ background: "rgba(167,139,250,0.12)", color: "#a78bfa", padding: "3px 10px", borderRadius: 99, fontSize: 11.5 }}>{f}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
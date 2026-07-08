import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { SectionCard, Loader } from "../ui";
import { getServiceUrl } from "../../config/api";

const API = getServiceUrl("analytics");

const TYPE_STYLE = {
  warning:        { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  icon: "⚠️" },
  success:        { color: "#4ade80", bg: "rgba(34,197,94,0.1)",   icon: "✅" },
  info:           { color: "#22d3ee", bg: "rgba(34,211,238,0.1)",  icon: "ℹ️" },
  recommendation: { color: "#a78bfa", bg: "rgba(167,139,250,0.1)", icon: "💡" },
};

export default function AIInsightsPanel() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API}/api/ai/insights`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Failed to load insights");
      setData(json);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  return (
    <SectionCard
      title="AI Strategic Insights"
      action={
        data && (
          <span style={{
            fontSize: 10, fontWeight: 600, padding: "3px 9px", borderRadius: 99,
            background: data.engine === "gemini" ? "rgba(34,211,238,0.15)" : "rgba(148,163,184,0.15)",
            color: data.engine === "gemini" ? "#22d3ee" : "#94a3b8",
          }}>
            {data.engine === "gemini" ? "✨ Deep-Learning Mode" : "⚙ Local Heuristics Mode"}
          </span>
        )
      }
    >
      {loading && <Loader />}
      {error && (
        <div style={{ color: "#f87171", fontSize: 13 }}>Could not load AI insights: {error}</div>
      )}
      {!loading && !error && data?.insights?.length > 0 && (
        <div style={{ display: "grid", gap: 10 }}>
          {data.insights.map((insight, i) => {
            const s = TYPE_STYLE[insight.type] || TYPE_STYLE.info;
            return (
              <div key={i} style={{
                background: s.bg, border: `1px solid ${s.color}30`, borderRadius: 10,
                padding: "12px 14px", display: "flex", gap: 10, alignItems: "flex-start",
              }}>
                <span style={{ fontSize: 16 }}>{s.icon}</span>
                <div>
                  <div style={{ color: s.color, fontSize: 13, fontWeight: 700 }}>{insight.title}</div>
                  <div style={{ color: "#94a3b8", fontSize: 12.5, marginTop: 3, lineHeight: 1.5 }}>{insight.message}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {!loading && !error && data?.insights?.length === 0 && (
        <div style={{ color: "#64748b", fontSize: 13 }}>No strategic insights available yet — add more projects to generate analysis.</div>
      )}
      {!data && !loading && !error && (
        <div style={{ color: "#64748b", fontSize: 13 }}>
          Not signed in yet, so AI insights aren't loaded.
        </div>
      )}
      {data && !GEMINI_HINT_HIDDEN(data) && (
        <div style={{ marginTop: 12, fontSize: 11, color: "#475569" }}>
          Running in local heuristics mode. Add <code>GEMINI_API_KEY</code> to your analytics-service <code>.env</code> to enable deep-learning insights.
        </div>
      )}
    </SectionCard>
  );
}

function GEMINI_HINT_HIDDEN(data) {
  return data.engine === "gemini";
}
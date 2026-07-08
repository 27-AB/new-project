require("dotenv").config();
const axios = require("axios");
const { getAggregatedAnalytics } = require("./aggregatorService");

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;


let insightsCache = { data: null, timestamp: 0 };
const CACHE_TTL_MS = 60_000; // 1 minute
const STOPWORDS = new Set(["the","a","an","of","and","for","to","in","on","with","using","based","study","project","research","towards","via","into","from","by","is","are","this","that"]);

// ---------- shared text utils (used by local engine, and to sanity-check Gemini output) ----------
const tokenize = (text = "") =>
  text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter(w => w.length > 2 && !STOPWORDS.has(w));

const jaccardSimilarity = (aTokens, bTokens) => {
  const a = new Set(aTokens), b = new Set(bTokens);
  const intersection = [...a].filter(x => b.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
};

const giniCoefficient = (values) => {
  const arr = values.filter(v => v > 0).sort((a, b) => a - b);
  const n = arr.length;
  if (n === 0) return 0;
  const sum = arr.reduce((s, v) => s + v, 0);
  if (sum === 0) return 0;
  let cum = 0;
  for (let i = 0; i < n; i++) cum += (i + 1) * arr[i];
  return (2 * cum) / (n * sum) - (n + 1) / n;
};

const topKeywords = (text, n = 6) => {
  const freq = {};
  tokenize(text).forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, n).map(([w]) => w);
};

// ============================================================
// FEATURE 1 — AI Strategic Executive Insights
// ============================================================
async function getAIInsights(token) {
  if (insightsCache.data && Date.now() - insightsCache.timestamp < CACHE_TTL_MS) {
    return insightsCache.data;
  }

  const { researchProjects, communityProjects, summary, byCollege } = await getAggregatedAnalytics(token);

  let result;
  if (GEMINI_KEY) {
    try {
      result = await geminiInsights({ researchProjects, communityProjects, summary, byCollege });
    }  catch (err) {
      console.error("Gemini insights failed, falling back to local engine:", err.message);
      console.error("Gemini error details:", JSON.stringify(err.response?.data, null, 2));
      result = localInsights({ researchProjects, communityProjects, summary, byCollege });
    }
  } else {
    result = localInsights({ researchProjects, communityProjects, summary, byCollege });
  }

  insightsCache = { data: result, timestamp: Date.now() };
  return result;
}

function localInsights({ researchProjects, communityProjects, summary, byCollege }) {
  const insights = [];

  // 1. Funding concentration (Gini coefficient across colleges)
  const collegeFunding = {};
  [...researchProjects, ...communityProjects].forEach(p => {
    const amt = p.fundingETB || p.budgetETB || 0;
    collegeFunding[p.college] = (collegeFunding[p.college] || 0) + amt;
  });
  const gini = giniCoefficient(Object.values(collegeFunding));
  if (gini > 0.5) {
    const [topCollege] = Object.entries(collegeFunding).sort((a, b) => b[1] - a[1])[0] || [];
    insights.push({
      type: "warning",
      title: "Funding Concentration Risk",
      message: `Funding distribution across colleges is highly uneven (Gini coefficient ${gini.toFixed(2)}). ${topCollege ? `${topCollege} holds a disproportionate share.` : ""} Consider rebalancing internal grant allocation.`,
      metric: gini.toFixed(2),
    });
  }

  // 2. Publication productivity stars
  const byLead = {};
  researchProjects.forEach(p => {
    if (!byLead[p.lead]) byLead[p.lead] = { publications: 0, projects: 0 };
    byLead[p.lead].publications += p.publications || 0;
    byLead[p.lead].projects += 1;
  });
  const topResearcher = Object.entries(byLead).sort((a, b) => b[1].publications - a[1].publications)[0];
  if (topResearcher && topResearcher[1].publications > 0) {
    insights.push({
      type: "success",
      title: "Publication Productivity Star",
      message: `${topResearcher[0]} leads output with ${topResearcher[1].publications} publications across ${topResearcher[1].projects} project(s) — a strong candidate for cross-department mentorship or featured recognition.`,
    });
  }

  // 3. Community outreach scaling recommendation
  const totalBeneficiaries = communityProjects.reduce((s, p) => s + (p.beneficiaries || 0), 0);
  const totalVolunteers = communityProjects.reduce((s, p) => s + (p.volunteers || 0), 0);
  if (totalVolunteers > 0) {
    const ratio = totalBeneficiaries / totalVolunteers;
    const best = [...communityProjects].sort((a, b) => ((b.beneficiaries||0)/(b.volunteers||1)) - ((a.beneficiaries||0)/(a.volunteers||1)))[0];
    if (best) {
      insights.push({
        type: "recommendation",
        title: "Outreach Scaling Opportunity",
        message: `"${best.title}" achieves a beneficiary-to-volunteer ratio of ${((best.beneficiaries||0)/(best.volunteers||1)).toFixed(1)}:1, well above the average of ${ratio.toFixed(1)}:1. This model is a strong candidate to replicate in other regions.`,
      });
    }
  }

  // 4. Collaboration gap warning — colleges with low project counts relative to total
  const collegeEntries = Object.entries(byCollege).sort((a, b) => a[1] - b[1]);
  if (collegeEntries.length > 1) {
    const [lowestCollege, lowestCount] = collegeEntries[0];
    const avg = summary.totalProjects / collegeEntries.length;
    if (lowestCount < avg * 0.5) {
      insights.push({
        type: "info",
        title: "Collaboration Gap Detected",
        message: `${lowestCollege} has only ${lowestCount} active initiative(s), well below the institutional average of ${avg.toFixed(1)}. Consider targeted internal funding calls or cross-college partnership incentives.`,
      });
    }
  }

  // 5. Stalled proposals under review
  const underReview = researchProjects.filter(p => p.status === "under_review");
  if (underReview.length > 0) {
    insights.push({
      type: "info",
      title: "Proposals Awaiting Review",
      message: `${underReview.length} proposal(s) are currently under review, representing ETB ${underReview.reduce((s,p)=>s+(p.fundingETB||0),0).toLocaleString()} in pending funding decisions.`,
    });
  }

  return { engine: "local", generatedAt: new Date().toISOString(), insights };
}

async function geminiInsights({ researchProjects, communityProjects, summary, byCollege }) {
  const compactData = {
    summary,
    byCollege,
    researchSample: researchProjects.slice(0, 40).map(p => ({
      title: p.title, college: p.college, department: p.department, status: p.status,
      fundingETB: p.fundingETB, publications: p.publications, tags: p.tags,
    })),
    communitySample: communityProjects.slice(0, 40).map(p => ({
      title: p.title, college: p.college, status: p.status, budgetETB: p.budgetETB,
      beneficiaries: p.beneficiaries, volunteers: p.volunteers,
    })),
  };

  const prompt = `You are a strategic analytics engine for a university research office. Given this aggregated JSON data, produce 4-6 high-signal strategic insights for leadership: funding imbalances, top performers, collaboration gaps, and scaling opportunities.

Return ONLY valid JSON, no markdown, no preamble, matching exactly this schema:
{"insights":[{"type":"warning|success|info|recommendation","title":"string","message":"string"}]}

DATA:
${JSON.stringify(compactData)}`;

  const { data } = await axios.post(GEMINI_URL, {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.4, responseMimeType: "application/json" },
  }, { timeout: 15000 });

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  const cleaned = text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(cleaned);

  if (!Array.isArray(parsed.insights) || parsed.insights.length === 0) {
    throw new Error("Gemini returned empty/invalid insights");
  }
  return { engine: "gemini", generatedAt: new Date().toISOString(), insights: parsed.insights };
}

// ============================================================
// FEATURE 2 — AI Project Copilot / Smart Form Assistant
// ============================================================
async function analyzeProject({ title = "", summary = "", college = "", department = "" }, token) {
  const { researchProjects } = await getAggregatedAnalytics(token);

  // Researchers come from college-service via aggregatorService's own axios calls;
  // fetch them directly here too since aggregatorService doesn't expose them separately.
  const COLLEGE_URL = process.env.COLLEGE_SERVICE_URL || "http://localhost:4003";
  let researchers = [];
  try {
    const res = await axios.get(`${COLLEGE_URL}/researchers`, { headers: { Authorization: `Bearer ${token}` } });
    researchers = res.data.researchers || [];
  } catch (err) {
    console.error("Could not fetch researchers for copilot:", err.message);
  }

  const combinedText = `${title} ${summary}`;

  if (GEMINI_KEY) {
    try {
      return await geminiAnalyzeProject({ title, summary, college, department, researchProjects, researchers });
    } catch (err) {
      console.error("Gemini project analysis failed, falling back to local engine:", err.message);
    }
  }
  return localAnalyzeProject({ title, summary, college, department, researchProjects, researchers, combinedText });
}

function localAnalyzeProject({ title, summary, college, department, researchProjects, researchers, combinedText }) {
  const inputTokens = tokenize(combinedText);

  // 1. Tag generation — top keyword frequency
  const tags = topKeywords(combinedText, 6);

  // 2. Duplication / similarity check — Jaccard overlap against all existing projects
  const similarProjects = researchProjects
    .map(p => {
      const overlap = jaccardSimilarity(inputTokens, tokenize(`${p.title} ${p.summary || ""}`));
      return { title: p.title, lead: p.lead, college: p.college, overlapPercent: Math.round(overlap * 100), id: p._id || p.id };
    })
    .filter(p => p.overlapPercent >= 20)
    .sort((a, b) => b.overlapPercent - a.overlapPercent)
    .slice(0, 5);

  // 3. Collaborator matching — keyword overlap between project text and researcher specialization/bio
  const collaboratorMatches = researchers
    .map(r => {
      const rText = `${r.specialization || ""} ${r.bio || ""} ${(r.tags || []).join(" ")}`;
      const rTokens = tokenize(rText);
      const overlap = inputTokens.filter(t => rTokens.includes(t));
      return {
        name: r.name, department: r.department, college: r.college,
        matchScore: overlap.length,
        reasons: overlap.slice(0, 4),
      };
    })
    .filter(r => r.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);

  // 4. Funding opportunity recommendation — keyword-to-funding-body heuristic map
  const FUNDING_MAP = [
    { keywords: ["energy","solar","wind","grid","geothermal"], source: "Ministry of Innovation and Technology / Ethiopian Energy Authority" },
    { keywords: ["health","medical","disease","pharma","clinical"], source: "Ethiopian Public Health Institute" },
    { keywords: ["agriculture","crop","teff","soil","farming"], source: "Ministry of Agriculture / Gates Foundation" },
    { keywords: ["nlp","language","speech","ai","machine","learning","data"], source: "Google Research Africa" },
    { keywords: ["climate","drought","environment","remote","sensing"], source: "NASA / USAID" },
    { keywords: ["water","sanitation"], source: "UNICEF Ethiopia" },
  ];
  const fundingOpportunities = FUNDING_MAP
    .filter(f => f.keywords.some(k => inputTokens.includes(k)))
    .map(f => f.source);
  if (fundingOpportunities.length === 0) fundingOpportunities.push("ASTU Internal Research Grant");

  return {
    engine: "local",
    tags,
    similarProjects,
    collaboratorMatches,
    fundingOpportunities: [...new Set(fundingOpportunities)],
  };
}

async function geminiAnalyzeProject({ title, summary, college, department, researchProjects, researchers }) {
  const compactExisting = researchProjects.slice(0, 60).map(p => ({ title: p.title, summary: p.summary, college: p.college }));
  const compactResearchers = researchers.slice(0, 60).map(r => ({ name: r.name, specialization: r.specialization, department: r.department, college: r.college }));

  const prompt = `You are a research project analysis engine for a university. Given a new proposal, analyze it against existing projects and researchers.

NEW PROPOSAL:
Title: ${title}
Summary: ${summary}
College: ${college}
Department: ${department}

EXISTING PROJECTS:
${JSON.stringify(compactExisting)}

AVAILABLE RESEARCHERS:
${JSON.stringify(compactResearchers)}

Return ONLY valid JSON, no markdown, matching exactly this schema:
{
  "tags": ["string", ...],
  "similarProjects": [{"title":"string","overlapPercent":number,"reason":"string"}],
  "collaboratorMatches": [{"name":"string","department":"string","reasons":["string"]}],
  "fundingOpportunities": ["string", ...]
}`;

  const { data } = await axios.post(GEMINI_URL, {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.3, responseMimeType: "application/json" },
  }, { timeout: 15000 });

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  const cleaned = text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(cleaned);

  return {
    engine: "gemini",
    tags: parsed.tags || [],
    similarProjects: parsed.similarProjects || [],
    collaboratorMatches: parsed.collaboratorMatches || [],
    fundingOpportunities: parsed.fundingOpportunities || [],
  };
}

module.exports = { getAIInsights, analyzeProject };
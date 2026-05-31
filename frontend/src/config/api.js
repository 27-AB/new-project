/** Resolve service base URLs: Vercel env on production, localStorage override on localhost dev. */

const isLocalDev =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

const ENV = {
  auth: process.env.REACT_APP_AUTH_URL,
  research: process.env.REACT_APP_RESEARCH_URL,
  community: process.env.REACT_APP_COMMUNITY_URL,
  college: process.env.REACT_APP_COLLEGE_URL,
  analytics: process.env.REACT_APP_API_URL,
};

const LOCAL = {
  auth: "http://localhost:4004",
  research: "http://localhost:4001",
  community: "http://localhost:4002",
  college: "http://localhost:4003",
  analytics: "http://localhost:4000",
};

const STORAGE_KEYS = {
  auth: "astu_auth_url",
  research: "astu_research_url",
  community: "astu_community_url",
  college: "astu_college_url",
  analytics: "astu_analytics_url",
};

function resolveUrl(service) {
  const stored =
    typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS[service]) : null;
  const fromEnv = ENV[service];

  // On Vercel/production: ignore old localhost values saved in another session
  if (stored && (isLocalDev || !stored.includes("localhost"))) {
    return stored;
  }
  if (fromEnv) return fromEnv;
  if (stored) return stored;
  return LOCAL[service];
}

export const getApiUrls = () => ({
  auth: resolveUrl("auth"),
  research: resolveUrl("research"),
  community: resolveUrl("community"),
  college: resolveUrl("college"),
  analytics: resolveUrl("analytics"),
});

export const getServiceUrl = (service) => getApiUrls()[service];

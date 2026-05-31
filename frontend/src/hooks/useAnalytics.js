import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";

import { getServiceUrl } from "../config/api";

const API = getServiceUrl("analytics");

export const useAnalytics = () => {
  const { token } = useAuth();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API}/api/analytics`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setData(json);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);
  return { data, loading, error, refetch: fetchData };
};

export const useApiFetch = (url) => {
  const { token } = useAuth();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const API_BASE = { projects: "http://localhost:4001", community: "http://localhost:4002", college: "http://localhost:4003" };

  const fetchData = useCallback(async () => {
    if (!token || !url) return;
    setLoading(true);
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      setData(json);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [token, url]);

  useEffect(() => { fetchData(); }, [fetchData]);
  return { data, loading, error, refetch: fetchData };
};

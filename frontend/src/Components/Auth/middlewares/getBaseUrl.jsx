const API_OPTIONS = [
    "https://kptpo-backend.onrender.com",
    "http://192.168.165.250:3003",
    "http://192.168.192.250:3003",
    "http://localhost:3003"
  ];
  
  const PORT = 3003;
  const CURRENT_BASE_URL = `${window.location.protocol}//${window.location.hostname}:${PORT}`;
  const HEALTH_CHECK_PATH = "/auth/health";
  
  // Timeout-based fetch wrapper
  const fetchWithTimeout = (url, options = {}, timeout = 1000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
  
    return fetch(url, {
      ...options,
      signal: controller.signal
    }).finally(() => clearTimeout(id));
  };
  
  // Check and return the first working API base URL
  export const getAvailableBaseUrl = async () => {
    // ✅ 1. Try current browser-accessed base URL first
    try {
      const res = await fetchWithTimeout(`${CURRENT_BASE_URL}${HEALTH_CHECK_PATH}`);
      if (res.ok) {
        console.log(`✅ Using current origin: ${CURRENT_BASE_URL}`);
        return CURRENT_BASE_URL;
      }
    } catch (err) {
      console.warn(`❌ Current base URL not reachable: ${CURRENT_BASE_URL}`);
    }
  
    // ✅ 2. Try known working options
    for (const url of API_OPTIONS) {
      try {
        const res = await fetchWithTimeout(`${url}${HEALTH_CHECK_PATH}`);
        if (res.ok) {
          localStorage.setItem("BASE_URL", url);
          console.log(`✅ Using API: ${url}`);
          return url;
        }
      } catch (err) {
        console.warn(`❌ API not reachable: ${url}`);
      }
    }
  
    // ❌ If none work
    console.error("⚠️ No API is reachable!");
    return null;
  };
  
const API_PREFIX = "/api/v1/";

const normalizeBaseUrl = (raw?: string) => {
  const value = (raw || "").trim();
  if (!value) {
    // Heuristic defaults:
    // - Local dev (Next on localhost) usually talks to Flask on :5000
    // - Otherwise fall back to same-origin API prefix (requires proxy/rewrites)
    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      if (host === "localhost" || host === "127.0.0.1") return "http://localhost:5000/api/v1/";
    }
    return API_PREFIX;
  }

  const withSlash = value.endsWith("/") ? value : `${value}/`;
  if (withSlash.includes("/api/v1/")) return withSlash;
  if (withSlash.endsWith("/api/v1/")) return withSlash;
  if (withSlash.endsWith("/api/v1")) return `${withSlash}/`;

  // If caller provides a host/base URL (e.g. http://localhost:5000),
  // default to Flask API prefix.
  if (withSlash.startsWith("http://") || withSlash.startsWith("https://") || withSlash.startsWith("/")) {
    return `${withSlash.replace(/\/$/, "")}${API_PREFIX}`;
  }

  return withSlash;
};

export const API_BASE_URL = normalizeBaseUrl(
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL
);

export const PUBLIC_API_BASE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_API_URL || process.env.API_URL
);

export const DEV_AUTH_BYPASS =
  process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";


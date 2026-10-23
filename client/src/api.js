
const BASE = `${(import.meta.env.VITE_API_URL || "").replace(/\/$/, "")}/api`;

// Access token exists only in memory. The refresh token stays in an HttpOnly cookie.
let accessToken = null;
let onUnauthorized = () => {};
let refreshPromise = null;

export function getToken() {
  return accessToken;
}

export function setToken(token) {
  accessToken = token || null;
}

export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

function isAuthEndpoint(path) {
  return [
    "/auth/login",
    "/auth/register",
    "/auth/refresh",
    "/auth/logout",
  ].includes(path);
}

// Share one refresh request when several API calls fail simultaneously.
async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        setToken(null);
        return false;
      }

      const data = await res.json();

      if (!data.token) {
        setToken(null);
        return false;
      }

      setToken(data.token);
      return true;
    } catch {
      setToken(null);
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function getErrorMessage(data, status) {
  let message =
    data?.message || `Something went wrong (error ${status}).`;

  if (Array.isArray(data?.errors) && data.errors.length) {
    const detail = data.errors
      .map((e) => (typeof e === "string" ? e : e.message))
      .filter(Boolean)
      .join(" ");

    if (detail) message = detail;
  }

  return message;
}

async function request(method, path, body, retry = true) {
  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  const headers = {
    ...(body !== undefined && !isFormData
      ? { "Content-Type": "application/json" }
      : {}),
    ...(getToken()
      ? { Authorization: `Bearer ${getToken()}` }
      : {}),
  };

  let res;

  try {
    res = await fetch(BASE + path, {
      method,
      credentials: "include",
      headers,
      body:
        body === undefined
          ? undefined
          : isFormData
            ? body
            : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      "Cannot reach the server. Check your connection and try again.",
      0
    );
  }

  // Retry the original request once after refreshing an expired access token.
  if (
    res.status === 401 &&
    retry &&
    !isAuthEndpoint(path)
  ) {
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      return request(method, path, body, false);
    }

    setToken(null);
    onUnauthorized();
  }

  let data = null;

  try {
    data = await res.json();
  } catch {
    // Empty or non-JSON response.
  }

  if (!res.ok) {
    throw new ApiError(getErrorMessage(data, res.status), res.status);
  }

  return data;
}

export async function getAttachmentUrl(path, retry = true) {
  let res;

  try {
    res = await fetch(BASE + path, {
      credentials: "include",
      headers: getToken()
        ? { Authorization: `Bearer ${getToken()}` }
        : {},
    });
  } catch {
    throw new ApiError(
      "Cannot reach the server. Check your connection and try again.",
      0
    );
  }

  if (res.status === 401 && retry) {
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      return getAttachmentUrl(path, false);
    }

    setToken(null);
    onUnauthorized();
  }

  if (!res.ok) {
    throw new ApiError("Unable to load attachment.", res.status);
  }

  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export const api = {
  get: (path) => request("GET", path),
  post: (path, body = {}) => request("POST", path, body),
  put: (path, body = {}) => request("PUT", path, body),
  patch: (path, body = {}) => request("PATCH", path, body),
  delete: (path) => request("DELETE", path),
};

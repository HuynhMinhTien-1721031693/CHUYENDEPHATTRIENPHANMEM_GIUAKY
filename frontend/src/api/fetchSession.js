/**
 * @param {string} path
 * @param {RequestInit} [init]
 */
export async function fetchSession(path, init = {}) {
  const r = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  return r;
}

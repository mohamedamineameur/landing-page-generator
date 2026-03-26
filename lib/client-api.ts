"use client";

export async function authorizedFetch(input: RequestInfo | URL, init?: RequestInit) {
  return fetch(input, {
    ...init,
    credentials: "include",
  });
}

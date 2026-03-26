import { NextResponse } from "next/server";
import { normalizeProjectName } from "@/lib/project-name";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readTrimmedString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}

export function readUuid(value: unknown) {
  const stringValue = readTrimmedString(value);
  return stringValue && isUuid(stringValue) ? stringValue : null;
}

export function sanitizeUsername(value: unknown) {
  const username = readTrimmedString(value);

  if (!username) {
    return null;
  }

  return username.toLowerCase();
}

export function sanitizeProjectName(value: unknown) {
  return normalizeProjectName(value);
}

export function sanitizePassword(value: unknown) {
  const password = typeof value === "string" ? value : null;

  if (!password || password.length < 8) {
    return null;
  }

  return password;
}

export function sanitizePayload(value: unknown) {
  if (!isRecord(value) && !Array.isArray(value)) {
    return null;
  }

  return value;
}

export function deepMergeJson<T>(baseValue: T, overrideValue: unknown): T {
  if (Array.isArray(baseValue) || Array.isArray(overrideValue)) {
    return overrideValue as T;
  }

  if (isRecord(baseValue) && isRecord(overrideValue)) {
    const result: Record<string, unknown> = { ...baseValue };

    for (const [key, value] of Object.entries(overrideValue)) {
      result[key] = key in result ? deepMergeJson(result[key], value) : value;
    }

    return result as T;
  }

  return overrideValue as T;
}

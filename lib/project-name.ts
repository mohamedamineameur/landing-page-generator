export function formatProjectNameInput(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s_-]+/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+/g, "")
    .slice(0, 255);
}

export function normalizeProjectName(value: unknown) {
  const normalized = formatProjectNameInput(value).replace(/-+$/g, "");

  return normalized || null;
}

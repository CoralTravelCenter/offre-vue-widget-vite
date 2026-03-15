const LATIN_ALIAS_IN_PARENS_AT_END = /\s*\((?=[^)]*[A-Za-z])[^)]*\)\s*$/u;

export function cleanOffreRegionLabel(label: string | null | undefined) {
  return String(label ?? "")
    .replace(LATIN_ALIAS_IN_PARENS_AT_END, "")
    .trim();
}

export function normalizeOffreRegionLabelForCompare(label: string | null | undefined) {
  return cleanOffreRegionLabel(label).toLowerCase();
}

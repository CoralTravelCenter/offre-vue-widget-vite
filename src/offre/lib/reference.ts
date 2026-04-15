import type { B2CPriceSearchReference } from "offre/api/types";

export function getReferenceRecord<TValue extends object>(
  reference: B2CPriceSearchReference,
  field: string
) {
  const value = reference[field];

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, TValue>;
}

export function getReferenceValue<TValue extends object>(
  reference: B2CPriceSearchReference,
  field: string,
  key: string | number | undefined
) {
  if (key === null || key === undefined || key === "") {
    return null;
  }

  const record = getReferenceRecord<TValue>(reference, field);

  if (!record) {
    return null;
  }

  return record[String(key)] ?? null;
}

import type { WidgetOptions, WidgetPayload } from "@/widget/types";
import { isPlainObject } from "@/offre/lib/payload-utils";

export function sanitizeWidgetPayload(rawPayload: unknown): WidgetPayload | null {
  if (!isPlainObject(rawPayload)) {
    return null;
  }

  const payload: WidgetPayload = {};

  if (typeof rawPayload.brand === "string" && rawPayload.brand.trim()) {
    payload.brand = rawPayload.brand.trim();
  }

  payload.options = isPlainObject(rawPayload.options)
    ? (rawPayload.options as WidgetOptions)
    : {};
  payload.hotels = Array.isArray(rawPayload.hotels)
    ? rawPayload.hotels
    : [];

  return payload;
}

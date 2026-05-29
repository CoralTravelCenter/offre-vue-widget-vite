import { getCityCorrectName } from "@/app/city-spelling";

function capitalizeFirst(value: string) {
  const text = String(value ?? "").trim();

  if (!text) {
    return "";
  }

  return text[0].toLocaleUpperCase() + text.slice(1);
}

export function formatDepartureLabel(name: string) {
  return capitalizeFirst(getCityCorrectName(name));
}

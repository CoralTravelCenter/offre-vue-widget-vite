export interface CoralBonusPromo {
  content_num?: string;
  content_txt?: string;
  content_link?: string;
}

export interface CoralBonusInfo {
  finalBonus: number;
  finalBonusLabel: string;
  listOfPromos: CoralBonusPromo[];
}

export interface CoralBonusCalcPayload {
  id?: number | string;
  night?: number | string;
  day?: number | string;
  star?: number | string;
  price?: number | string;
  checkInDate?: string;
  name?: string;
  countryID?: number | string;
  isOnlyHotel?: boolean;
}

interface CoralBonusCalculatorResult {
  finalBonus?: number | string;
  listOfPromos?: CoralBonusPromo[];
}

type CoralBonusCalculator = (payload: CoralBonusCalcPayload) => CoralBonusCalculatorResult | null | undefined;

declare global {
  interface Window {
    _get_CBonuses?: CoralBonusCalculator;
  }
}

const CORAL_BONUS_SCRIPT_URL = "https://b2ccdn.coral.ru/content/scripts/getbonus.js";

let coralBonusScriptPromise: Promise<CoralBonusCalculator | null> | null = null;

function formatBonusCurrency(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0
  }).format(value);
}

export function loadCoralBonusCalculator() {
  if (typeof window === "undefined") {
    return Promise.resolve(null);
  }

  if (typeof window._get_CBonuses === "function") {
    return Promise.resolve(window._get_CBonuses);
  }

  if (coralBonusScriptPromise) {
    return coralBonusScriptPromise;
  }

  coralBonusScriptPromise = new Promise((resolve) => {
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${CORAL_BONUS_SCRIPT_URL}"]`);

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window._get_CBonuses ?? null), { once: true });
      existingScript.addEventListener("error", () => resolve(null), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = CORAL_BONUS_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(window._get_CBonuses ?? null);
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });

  return coralBonusScriptPromise;
}

export async function calculateCoralBonus(payload: CoralBonusCalcPayload) {
  const calculator = await loadCoralBonusCalculator();

  if (!calculator) {
    return null;
  }

  const result = calculator(payload);
  const finalBonus = Number(result?.finalBonus);

  if (!Number.isFinite(finalBonus) || finalBonus <= 0) {
    return null;
  }

  return {
    finalBonus,
    finalBonusLabel: formatBonusCurrency(finalBonus),
    listOfPromos: Array.isArray(result?.listOfPromos) ? result.listOfPromos : []
  } satisfies CoralBonusInfo;
}

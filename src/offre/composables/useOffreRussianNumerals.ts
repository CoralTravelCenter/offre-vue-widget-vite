type RussianPluralForms = [string, string, string];

function pluralizeRussianByCount(value: number, forms: RussianPluralForms) {
  const normalizedValue = Math.abs(Number(value)) % 100;
  const lastDigit = normalizedValue % 10;

  if (normalizedValue > 10 && normalizedValue < 20) {
    return forms[2];
  }

  if (lastDigit === 1) {
    return forms[0];
  }

  if (lastDigit > 1 && lastDigit < 5) {
    return forms[1];
  }

  return forms[2];
}

export function useOffreRussianNumerals() {
  function formatAdultsCountLabel(value: number) {
    return `${value} ${pluralizeRussianByCount(value, ["взрослого", "взрослых", "взрослых"])}`;
  }

  function formatChildrenCountLabel(value: number) {
    return `${value} ${value === 1 ? "ребенка" : "детей"}`;
  }

  function formatChildAgeLabel(value: number) {
    return `${value} ${pluralizeRussianByCount(value, ["год", "года", "лет"])}`;
  }

  return {
    pluralizeRussianByCount,
    formatAdultsCountLabel,
    formatChildrenCountLabel,
    formatChildAgeLabel
  };
}

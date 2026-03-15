import type { App, Plugin } from "vue";

type CityFieldName = "correctName" | "genitiveCase";

interface CityDictionaryEntry {
  b2cName: string;
  correctName?: string;
  genitiveCase: string;
}

const citiesDictionary: CityDictionaryEntry[] = [
  { b2cName: "Москва", genitiveCase: "Москвы" },
  { b2cName: "Санкт-Петербург", genitiveCase: "Санкт-Петербурга" },
  { b2cName: "Сочи", genitiveCase: "Сочи" },
  { b2cName: "Минеральные воды", correctName: "Минеральные Воды", genitiveCase: "Минеральных Вод" },
  { b2cName: "Н. Новгород", correctName: "Нижний Новгород", genitiveCase: "Нижнего Новгорода" }
];

function getCityField(name: string, fieldName: CityFieldName) {
  return citiesDictionary.find((city) => city.b2cName === name)?.[fieldName] || name;
}

export function getCityCorrectName(name: string) {
  return getCityField(name, "correctName");
}

export function getCityGenitiveCase(name: string) {
  return getCityField(name, "genitiveCase");
}

const citySpelling: Plugin = {
  install(app: App) {
    app.config.globalProperties.$cityCorrectName = getCityCorrectName;
    app.config.globalProperties.$cityGenitiveCase = getCityGenitiveCase;
  }
};

export default citySpelling;

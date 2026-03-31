import type { BrandKey } from "shared/types/brand";
import type { WidgetPayload } from "shared/types/widget";

const devOffrePayloadBase: WidgetPayload = {
  options: {
    blackList: ["ОАЭ"],
    roomCriterias: [{
      passengers: [
        { passengerType: 0, age: 20 },
        { passengerType: 0, age: 20 },
        { passengerType: 1, age: 7 },
        { passengerType: 1, age: 7 }
      ]
    }],
    chartersOnly: false,
    groupBy: "areas",
    nights: [6, 7, 8, 9, 10, 11, 12],
    timeframe: {
      fixed: ["2026-04-24", "2026-10-30"],
      monthly: true
    },
    wildcardOption: "Все отели",
    sortBy: "price"
  },
  hotels: [
    805, 29304, 27053, 11595, 27570, 718, 565, 16562, 50047, 722, 29836, 10825, 888, 828,
    34337, 10225, 10105, 56305, 17813, 18531, 8743, 8199, 734, 30730, 4407, 33418, 58251,
    56394, 17847, 52523, 52520, 52521, 52522, 52528, 73894, 16396, 358, 25495, 367, 799,
    4233, 6437, 349, 53006, 3993, 50385, 47309, 363, 563, 364, 631, 6936, 27902, 34184,
    3861, 645, 646, 5004, 12520, 52529, 10010, 6975, 9464, 5205, 54174, 5217, 5174, 15254,
    9408, 5207, 6659, 8264, 8263, 78864, 734, 30730, 5537, 16562, 54702, 55986, 57624, 805
  ]
};

export function getDevOffrePayload(brand: BrandKey): WidgetPayload {
  return {
    ...devOffrePayloadBase,
    brand
  };
}

// Static reference data for the onboarding location step (spec §11: Province + City/suburb)
// and for the opportunity-matching engine's location-fit scoring (docs/decisions.md D2), which
// needs to know which province a city belongs to when an opportunity's `geography` field names
// a specific city rather than "National".

export const PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
] as const;

export type Province = (typeof PROVINCES)[number];

export const CITIES_BY_PROVINCE: Record<Province, string[]> = {
  "Eastern Cape": ["Gqeberha", "East London", "Mthatha"],
  "Free State": ["Bloemfontein", "Welkom"],
  Gauteng: ["Johannesburg", "Pretoria", "Soweto", "Ekurhuleni", "Vereeniging"],
  "KwaZulu-Natal": ["Durban", "Pietermaritzburg", "Newcastle"],
  Limpopo: ["Polokwane", "Tzaneen"],
  Mpumalanga: ["Mbombela", "Witbank"],
  "Northern Cape": ["Kimberley", "Upington"],
  "North West": ["Rustenburg", "Mahikeng"],
  "Western Cape": ["Cape Town", "Stellenbosch", "George"],
};

/** Lower-cased city name -> province, used by opportunityMatchingService for location fit. */
export const CITY_TO_PROVINCE: Record<string, Province> = Object.fromEntries(
  Object.entries(CITIES_BY_PROVINCE).flatMap(([province, cities]) =>
    cities.map((city) => [city.toLowerCase(), province as Province])
  )
);

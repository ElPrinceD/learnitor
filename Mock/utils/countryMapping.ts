export const COUNTRY_MAP: Record<string, string> = {
  GH: "Ghana",
  NG: "Nigeria",
  US: "United States",
  GB: "United Kingdom",
  CA: "Canada",
  DE: "Germany",
  FR: "France",
  ZA: "South Africa",
  KE: "Kenya",
  IN: "India",
};

export const getCountryName = (code?: string) => {
  if (!code) return undefined;
  const upper = code.toUpperCase();
  return COUNTRY_MAP[upper] || code;
};

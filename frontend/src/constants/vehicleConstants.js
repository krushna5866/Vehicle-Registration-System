// Public UI configuration and constants. Contains NO passwords, credentials, or private keys.

export const STATE_SERIES = [
  { code: "MH", name: "Maharashtra" },
  { code: "DL", name: "Delhi" },
  { code: "KA", name: "Karnataka" },
  { code: "TN", name: "Tamil Nadu" },
  { code: "MP", name: "Madhya Pradesh" },
  { code: "GJ", name: "Gujarat" },
  { code: "HR", name: "Haryana" },
  { code: "BH", name: "Bharat Series" }
];

export const POPULAR_CAR_PRESETS = [
  { make: "Tata", model: "Nexon EV Max" },
  { make: "Mahindra", model: "XUV700 AX7" },
  { make: "Maruti Suzuki", model: "Brezza ZXi+" },
  { make: "Hyundai", model: "Creta SX(O)" },
  { make: "Toyota", model: "Fortuner 4x4" },
  { make: "Mahindra", model: "Thar 4x4" }
];

export const LEGAL_STATE_LABELS = ["Active", "Scrapped"];

/**
 * Mask sensitive wallet addresses for UI privacy: 0x7099...79C8
 */
export function maskAddress(address) {
  if (!address || typeof address !== "string") return "-";
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Mask sensitive identifiers (like VIN) for public displays
 */
export function maskIdentifier(identifier) {
  if (!identifier || typeof identifier !== "string") return "-";
  if (identifier.length <= 8) return identifier;
  return `${identifier.slice(0, 3)}****${identifier.slice(-4)}`;
}

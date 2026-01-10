/**
 * Generates a searchable text string from property address and location fields.
 * Used for fast location-based property search.
 */

interface LocationFields {
  city?: string | null
  state?: string | null
  zipcode?: string | null
  locality?: string | null
  neighborhood?: string | null
  formattedAddress?: string | null
}

/**
 * Generates a concatenated, lowercase search text from all location-related fields.
 * This allows for efficient single-column search instead of multiple OR conditions.
 *
 * @param streetAddress - The street address of the property
 * @param location - Object containing location fields (city, state, locality, etc.)
 * @returns Lowercase, space-separated string of all location components
 *
 * @example
 * generateSearchText("123 Main St", { city: "Hyderabad", state: "Telangana", locality: "KPHB", zipcode: "500072" })
 * // Returns: "123 main st kphb hyderabad telangana 500072"
 */
export function generateSearchText(
  streetAddress: string | null | undefined,
  location: LocationFields
): string {
  const parts = [
    streetAddress,
    location.formattedAddress,
    location.locality,
    location.neighborhood,
    location.city,
    location.state,
    location.zipcode,
  ]

  return parts
    .filter((part): part is string => Boolean(part))
    .map(part => part.trim())
    .join(' ')
    .toLowerCase()
}

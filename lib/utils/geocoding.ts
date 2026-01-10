/**
 * Geocoding utilities for converting addresses to coordinates
 */

export interface GeocodeResult {
  latitude: number
  longitude: number
  formattedAddress: string
  city: string
  state: string
  country: string
  zipcode?: string
  locality?: string
  neighborhood?: string
  parentCity?: string // Parent city for hierarchical location (e.g., Hyderabad for areas like Gopanpally)
}

/**
 * Geocode an address using Google Maps Geocoding API
 * @param address Full address string
 * @returns Geocoding result with coordinates and normalized address components
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return null
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    )

    const data = await response.json()

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      return null
    }

    const result = data.results[0]
    const { lat, lng } = result.geometry.location

    // Extract address components
    const components = result.address_components
    const getComponent = (types: string[]) => {
      const component = components.find((c: any) =>
        types.some((type: string) => c.types.includes(type))
      )
      return component?.long_name || ''
    }

    // Extract city from locality (this is the main city like Hyderabad)
    const mainLocality = getComponent(['locality'])
    // Extract sub-locality/area (like Gopanpally, KPHB)
    const subLocality =
      getComponent(['sublocality_level_1']) ||
      getComponent(['sublocality_level_2']) ||
      getComponent(['sublocality'])
    // If the city field is different from main locality, use locality as parent city
    const city = mainLocality || getComponent(['administrative_area_level_2'])

    // Determine parentCity: If locality/neighborhood is the same as city, no parent needed
    // If locality is a subarea (like Gopanpally), then city (like Hyderabad) is the parent
    let parentCity: string | undefined
    if (subLocality && mainLocality && subLocality !== mainLocality) {
      parentCity = mainLocality // e.g., Hyderabad is parent of Gopanpally
    }

    return {
      latitude: lat,
      longitude: lng,
      formattedAddress: result.formatted_address,
      neighborhood: getComponent(['neighborhood']) || subLocality,
      locality: subLocality || mainLocality,
      city,
      parentCity,
      state: getComponent(['administrative_area_level_1']),
      country: getComponent(['country']),
      zipcode: getComponent(['postal_code']),
    }
  } catch (error) {
    return null
  }
}

/**
 * Parse a Google Maps Place object to extract location components
 * @param place Google Maps Place object
 * @returns Normalized location data
 */
export function parsePlaceResult(place: any): Partial<GeocodeResult> {
  const location = place.geometry?.location

  if (!location) {
    return {}
  }

  const components = place.address_components || []
  const getComponent = (types: string[]) => {
    const component = components.find((c: any) =>
      types.some((type: string) => c.types.includes(type))
    )
    return component?.long_name || ''
  }

  // Extract city from locality (this is the main city like Hyderabad)
  const mainLocality = getComponent(['locality'])
  // Extract sub-locality/area (like Gopanpally, KPHB)
  const subLocality =
    getComponent(['sublocality_level_1']) ||
    getComponent(['sublocality_level_2']) ||
    getComponent(['sublocality'])
  const city = mainLocality || getComponent(['administrative_area_level_2'])

  // Determine parentCity
  let parentCity: string | undefined
  if (subLocality && mainLocality && subLocality !== mainLocality) {
    parentCity = mainLocality
  }

  return {
    latitude: typeof location.lat === 'function' ? location.lat() : location.lat,
    longitude: typeof location.lng === 'function' ? location.lng() : location.lng,
    formattedAddress: place.formatted_address,
    neighborhood: getComponent(['neighborhood']) || subLocality,
    locality: subLocality || mainLocality,
    city,
    parentCity,
    state: getComponent(['administrative_area_level_1']),
    country: getComponent(['country']),
    zipcode: getComponent(['postal_code']),
  }
}

/**
 * Normalize location string for consistent searching
 * Formats: "Neighborhood, Locality, City, State, Zipcode"
 * @param components Location components
 * @returns Normalized location string
 */
export function normalizeLocationString(components: Partial<GeocodeResult>): string {
  const parts: string[] = []

  if (components.neighborhood) parts.push(components.neighborhood)
  if (components.locality && components.locality !== components.neighborhood)
    parts.push(components.locality)
  if (components.city && components.city !== components.locality) parts.push(components.city)
  if (components.state) parts.push(components.state)
  if (components.zipcode) parts.push(components.zipcode)

  return parts.join(', ')
}

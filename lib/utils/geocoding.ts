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
}

/**
 * Geocode an address using Google Maps Geocoding API
 * @param address Full address string
 * @returns Geocoding result with coordinates and normalized address components
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    console.error('Google Maps API key not configured')
    return null
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    )

    const data = await response.json()

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      console.error('Geocoding failed:', data.status, data.error_message)
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

    return {
      latitude: lat,
      longitude: lng,
      formattedAddress: result.formatted_address,
      neighborhood:
        getComponent(['neighborhood', 'sublocality']) ||
        getComponent(['sublocality_level_1', 'sublocality_level_2']),
      locality: getComponent(['locality', 'sublocality']),
      city: getComponent(['locality', 'administrative_area_level_2']),
      state: getComponent(['administrative_area_level_1']),
      country: getComponent(['country']),
      zipcode: getComponent(['postal_code']),
    }
  } catch (error) {
    console.error('Geocoding error:', error)
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
    const component = components.find((c: any) => types.some((type: string) => c.types.includes(type)))
    return component?.long_name || ''
  }

  return {
    latitude: typeof location.lat === 'function' ? location.lat() : location.lat,
    longitude: typeof location.lng === 'function' ? location.lng() : location.lng,
    formattedAddress: place.formatted_address,
    neighborhood:
      getComponent(['neighborhood', 'sublocality']) ||
      getComponent(['sublocality_level_1', 'sublocality_level_2']),
    locality: getComponent(['locality', 'sublocality']),
    city: getComponent(['locality', 'administrative_area_level_2']),
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

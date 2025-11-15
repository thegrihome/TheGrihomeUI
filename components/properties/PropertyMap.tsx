import { useEffect, useRef, useState } from 'react'

interface PropertyMapProps {
  latitude: number
  longitude: number
  address?: string
  className?: string
}

export default function PropertyMap({
  latitude,
  longitude,
  address,
  className = '',
}: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      setIsLoaded(true)
      return
    }

    // Load Google Maps script
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      setError('Google Maps API key not configured')
      return
    }

    // Check if script is already being loaded
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      // Wait for it to load
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps) {
          setIsLoaded(true)
          clearInterval(checkInterval)
        }
      }, 100)

      return () => clearInterval(checkInterval)
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => setIsLoaded(true)
    script.onerror = () => setError('Failed to load Google Maps')
    document.head.appendChild(script)

    return () => {
      // Cleanup if needed
    }
  }, [])

  useEffect(() => {
    if (!isLoaded || !mapRef.current || !latitude || !longitude) return

    try {
      const position = { lat: latitude, lng: longitude }

      const map = new google.maps.Map(mapRef.current, {
        center: position,
        zoom: 15,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
      })

      // Add marker
      new google.maps.Marker({
        position,
        map,
        title: address || 'Property Location',
        animation: google.maps.Animation.DROP,
      })

      // Optionally add info window
      if (address) {
        const infoWindow = new google.maps.InfoWindow({
          content: `<div style="padding: 8px;"><strong>Location:</strong><br/>${address}</div>`,
        })

        const marker = new google.maps.Marker({
          position,
          map,
          title: address,
        })

        marker.addListener('click', () => {
          infoWindow.open(map, marker)
        })
      }
    } catch (err) {
      console.error('Error initializing map:', err)
      setError('Failed to initialize map')
    }
  }, [isLoaded, latitude, longitude, address])

  if (error) {
    return (
      <div className={`rounded-lg bg-gray-100 p-8 text-center ${className}`}>
        <p className="text-gray-600">{error}</p>
      </div>
    )
  }

  if (!latitude || !longitude) {
    return (
      <div className={`rounded-lg bg-gray-100 p-8 text-center ${className}`}>
        <p className="text-gray-600">Location coordinates not available</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <div ref={mapRef} className="w-full h-full rounded-lg" style={{ minHeight: '400px' }} />
      {!isLoaded && (
        <div className="rounded-lg bg-gray-100 p-8 text-center" style={{ minHeight: '400px' }}>
          <p className="text-gray-600">Loading map...</p>
        </div>
      )}
    </div>
  )
}

import Image from 'next/image'
import { useRouter } from 'next/router'

interface PropertyCardProps {
  property: {
    id: string
    streetAddress?: string
    location: {
      city: string
      state: string
      zipcode: string | null
      locality: string | null
      fullAddress?: string
    }
    builder?: string
    project: string | { id: string; name: string }
    propertyType: string
    listingType: string
    sqFt: number | null
    thumbnailUrl?: string | null
    imageUrls: string[]
    listingStatus: string
    createdAt: string
    postedBy?: string
    companyName?: string
    bedrooms?: string | number | null
    bathrooms?: string | number | null
    price?: string | number | null
    size?: string
    sizeUnit?: string
    plotSize?: string
    plotSizeUnit?: string
    description?: string
    userId: string
    userEmail?: string
  }
  isOwner?: boolean
  isFavorited?: boolean
  currentUserId?: string | null
  onMarkAsSold?: (propertyId: string) => void
  onToggleFavorite?: (propertyId: string, currentState: boolean) => void
  processing?: boolean
}

const propertyTypes = [
  { value: 'SINGLE_FAMILY', label: 'Villas', icon: '🏡' },
  { value: 'CONDO', label: 'Apartments', icon: '🏢' },
  { value: 'LAND_RESIDENTIAL', label: 'Residential Lands', icon: '🏞️' },
  { value: 'LAND_AGRICULTURE', label: 'Agriculture Lands', icon: '🌾' },
  { value: 'COMMERCIAL', label: 'Commercial', icon: '🏬' },
]

export default function PropertyCard({
  property,
  isOwner = false,
  isFavorited = false,
  currentUserId = null,
  onMarkAsSold,
  onToggleFavorite,
  processing = false,
}: PropertyCardProps) {
  const router = useRouter()

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onToggleFavorite) {
      onToggleFavorite(property.id, isFavorited)
    }
  }

  // Show favorite button only if user is logged in and not the owner
  const showFavoriteButton = currentUserId && !isOwner

  const formatIndianCurrency = (amount: string | number | null | undefined) => {
    if (!amount) return null
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    if (isNaN(num)) return null
    return num.toLocaleString('en-IN')
  }

  const getProjectName = () => {
    if (typeof property.project === 'string') {
      return property.project
    }
    return property.project?.name || 'Property'
  }

  const formattedPrice = formatIndianCurrency(property.price)

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Image */}
      <div className="relative w-full h-32">
        <Image
          src={
            property.thumbnailUrl ||
            property.imageUrls[0] ||
            'https://via.placeholder.com/400x160?text=Property'
          }
          alt={`${getProjectName()} - ${property.propertyType}`}
          width={400}
          height={160}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-1.5 left-1.5 bg-blue-600 text-white px-1.5 py-0.5 rounded text-[10px] font-medium">
          {propertyTypes.find(t => t.value === property.propertyType)?.icon}{' '}
          {propertyTypes.find(t => t.value === property.propertyType)?.label}
        </div>
        {property.listingStatus === 'SOLD' ? (
          <div className="absolute top-1.5 right-1.5 bg-red-600 text-white px-1.5 py-0.5 rounded text-[10px] font-medium">
            SOLD
          </div>
        ) : (
          property.listingType === 'RENT' && (
            <div className="absolute top-1.5 right-1.5 bg-green-600 text-white px-1.5 py-0.5 rounded text-[10px] font-medium">
              Rent
            </div>
          )
        )}
        {/* Favorite Heart Icon */}
        {showFavoriteButton && (
          <button
            onClick={handleFavoriteClick}
            className="absolute bottom-1.5 right-1.5 bg-white/90 hover:bg-white rounded-full p-1 transition-all duration-200 shadow-sm hover:shadow-md"
            title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="w-4 h-4 transition-colors"
              fill={isFavorited ? '#ef4444' : 'none'}
              stroke={isFavorited ? '#ef4444' : '#6b7280'}
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-2">
        <div className="flex items-start justify-between gap-1 mb-1">
          <h3 className="font-semibold text-xs text-gray-900 truncate flex-1">
            {getProjectName()}
          </h3>
          {formattedPrice && (
            <span className="font-bold text-sm text-blue-600 whitespace-nowrap">
              ₹{formattedPrice}
            </span>
          )}
        </div>

        <div className="flex items-start justify-between gap-1 mb-0.5">
          <div className="flex-1">
            <p className="text-gray-600 text-[10px] truncate">
              {property.bedrooms && `${property.bedrooms} BHK`}
              {property.bathrooms && ` • ${property.bathrooms} Bath`}
              {property.sqFt && ` • ${property.sqFt} sq ft`}
            </p>
            <p className="text-gray-400 text-[9px]">
              Posted:{' '}
              {new Date(property.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
              ,{' '}
              {new Date(property.createdAt).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })}
            </p>
          </div>
          <p className="text-gray-500 text-[10px] whitespace-nowrap text-right">
            {property.location.city}
          </p>
        </div>

        <div
          className={`flex items-end gap-1 ${isOwner && property.listingStatus === 'ACTIVE' ? 'justify-between' : 'justify-end'}`}
        >
          <button
            onClick={() => router.push(`/properties/${property.id}`)}
            className="bg-blue-600 text-white px-2 py-0.5 rounded text-[10px] font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            View Details
          </button>
          {/* Owner Actions - Mark as Sold */}
          {isOwner && property.listingStatus === 'ACTIVE' && onMarkAsSold && (
            <button
              onClick={() => onMarkAsSold(property.id)}
              disabled={processing}
              className="bg-red-600 text-white px-2 py-0.5 rounded text-[10px] font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              Sold
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

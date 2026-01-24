import Image from 'next/image'
import { useRouter } from 'next/router'
import React from 'react'

interface ProjectCardProps {
  project: {
    id: string
    name: string
    description?: string
    type: string
    propertyType?: string | null
    thumbnailUrl?: string | null
    imageUrls?: string[]
    location: {
      city: string
      state: string
      zipcode?: string | null
      locality?: string | null
      fullAddress?: string
    }
    builder?: {
      id: string
      name: string
      logoUrl?: string | null
    } | null
    createdAt: string
  }
}

// Property type labels
const PROPERTY_TYPES = [
  { value: 'VILLA', label: 'Villas' },
  { value: 'APARTMENT', label: 'Apartments' },
  { value: 'RESIDENTIAL_LAND', label: 'Residential Lands' },
  { value: 'AGRICULTURE_LAND', label: 'Agriculture Lands' },
  { value: 'COMMERCIAL', label: 'Commercial' },
] as const

// Project type labels
const PROJECT_TYPES = [
  { value: 'RESIDENTIAL', label: 'Residential' },
  { value: 'COMMERCIAL', label: 'Commercial' },
  { value: 'MIXED_USE', label: 'Mixed Use' },
  { value: 'INDUSTRIAL', label: 'Industrial' },
] as const

function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter()

  const handleCardClick = () => {
    router.push(`/projects/${project.id}`)
  }

  const getPropertyTypeLabel = () => {
    return PROPERTY_TYPES.find(t => t.value === project.propertyType)?.label || null
  }

  const getProjectTypeLabel = () => {
    return PROJECT_TYPES.find(t => t.value === project.type)?.label || project.type
  }

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer"
    >
      {/* Image */}
      <div className="relative w-full h-36">
        <Image
          src={
            project.thumbnailUrl ||
            project.imageUrls?.[0] ||
            'https://via.placeholder.com/400x160?text=Project'
          }
          alt={`${project.name} - ${getProjectTypeLabel()}`}
          width={400}
          height={160}
          loading="lazy"
          className="w-full h-full object-cover"
        />
        {/* Project Type Badge */}
        <div className="absolute top-1.5 left-1.5 bg-purple-600 text-white px-1.5 py-0.5 rounded text-[10px] font-medium">
          {getProjectTypeLabel()}
        </div>
        {/* Property Type Badge */}
        {getPropertyTypeLabel() && (
          <div className="absolute top-1.5 right-1.5 bg-blue-600 text-white px-1.5 py-0.5 rounded text-[10px] font-medium">
            {getPropertyTypeLabel()}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-start gap-2 mb-2">
          <h3 className="font-semibold text-sm text-gray-900 break-words flex-1">{project.name}</h3>
        </div>

        <div className="border-t border-gray-200 mb-2"></div>

        <div className="flex items-start justify-between gap-1 mb-1">
          <div className="flex-1">
            {project.builder && (
              <p className="text-gray-700 text-xs font-semibold truncate">
                By {project.builder.name}
              </p>
            )}
            <p className="text-gray-500 text-[10px] font-semibold">
              Posted:{' '}
              {new Date(project.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
          <p className="text-gray-500 text-[10px] font-semibold whitespace-nowrap text-right">
            {project.location.locality && `${project.location.locality}, `}
            {project.location.city}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div></div>
          <div></div>
          <button
            onClick={handleCardClick}
            className="bg-blue-600 text-white px-1 py-1.5 rounded text-[10px] font-medium hover:bg-blue-700 transition-colors whitespace-nowrap text-center w-full leading-tight"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  )
}

// Wrap with React.memo for performance
export default React.memo(ProjectCard)

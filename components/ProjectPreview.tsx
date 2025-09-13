import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

interface ProjectPreviewProps {
  parsedJson: any
  templateJson: any
}

export default function ProjectPreview({ parsedJson, templateJson }: ProjectPreviewProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)

  if (!parsedJson) return null

  const details = parsedJson.projectDetails || {}
  const allImages = [
    ...(parsedJson.thumbnailUrl ? [parsedJson.thumbnailUrl] : []),
    ...(parsedJson.imageUrls || []),
    ...(details.gallery?.map((item: any) => item.image) || []),
  ].filter(Boolean)

  const mockBuilder = {
    id: parsedJson.builderId || 'demo-builder',
    name: parsedJson.builderName || 'Demo Builder',
    logoUrl: parsedJson.builderLogo || null,
    website: parsedJson.builderWebsite || '#',
  }

  const mockLocation = {
    city: parsedJson.location?.split(',')[0]?.trim() || 'Demo City',
    state: parsedJson.location?.split(',')[1]?.trim() || 'Demo State',
    locality: parsedJson.location?.split(',')[0]?.trim() || null,
  }

  const nextImage = () => {
    setCurrentImageIndex(prev => (prev + 1) % allImages.length)
  }

  const prevImage = () => {
    setCurrentImageIndex(prev => (prev - 1 + allImages.length) % allImages.length)
  }

  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl)
    setZoom(1)
  }

  const closeImageModal = () => {
    setSelectedImage(null)
    setZoom(1)
  }

  return (
    <div className="project-preview-container bg-white border rounded-lg overflow-hidden">
      {/* Preview Header */}
      <div className="bg-blue-50 border-b p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-blue-800">📋 Full Project Preview</h2>
          <div className="text-sm text-blue-600">This is exactly how your project will appear</div>
        </div>
      </div>

      {/* Full Project Details Preview */}
      <div className="project-page-container">
        {/* Project Header */}
        <div className="project-header bg-white border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="project-title-section">
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
                  {parsedJson.name}
                </h1>
                <div className="project-meta flex flex-wrap items-center gap-4 text-gray-600">
                  <div className="builder-info">
                    <span className="text-sm">by </span>
                    <span className="font-medium text-blue-600">{mockBuilder.name}</span>
                  </div>
                  <div className="location-info flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                    </svg>
                    <span className="text-sm">{parsedJson.location}</span>
                  </div>
                  <div className="project-type">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                      {parsedJson.type}
                    </span>
                  </div>
                  {parsedJson.numberOfUnits && (
                    <div className="text-sm text-gray-600">{parsedJson.numberOfUnits} units</div>
                  )}
                  {parsedJson.size && (
                    <div className="text-sm text-gray-600">{parsedJson.size} acres</div>
                  )}
                </div>
              </div>
              <div className="project-actions flex items-center gap-4">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  Express Interest
                </button>
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  Visit Builder Page
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Project Image & Sidebar */}
        <div className="project-image-section bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left Side - Project Image */}
              {allImages.length > 0 && (
                <div className="lg:w-2/3">
                  <div className="relative rounded-lg overflow-hidden h-full">
                    <Image
                      src={allImages[currentImageIndex] || '/images/placeholder.webp'}
                      alt={`${parsedJson.name} - Image ${currentImageIndex + 1}`}
                      width={600}
                      height={400}
                      className="object-cover w-full h-full transition-all duration-500"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 60vw"
                    />

                    {/* Image Navigation */}
                    {allImages.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M15 19l-7-7 7-7"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>

                        {/* Image Dots */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                          {allImages.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`w-2 h-2 rounded-full transition-colors ${
                                index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Right Side - Location & Highlights */}
              <div className="lg:w-1/3 flex flex-col justify-between space-y-6">
                {/* Google Maps */}
                <div className="map-card bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold mb-4">Location</h3>
                  <div className="map-container rounded-lg overflow-hidden border">
                    <iframe
                      src={
                        details.googleMaps?.embedUrl ||
                        `https://maps.google.com/maps?q=${encodeURIComponent(parsedJson.location || 'Demo Location')}&t=&z=15&ie=UTF8&iwloc=&output=embed`
                      }
                      width="100%"
                      height="250"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="rounded-lg"
                      title={`${parsedJson.name} Location`}
                    />
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Address:</span>{' '}
                    {details.googleMaps?.address || parsedJson.location || 'Demo Address'}
                  </div>
                </div>

                {/* Highlights */}
                {details.highlights && details.highlights.length > 0 && (
                  <div className="highlights-card bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-4">Highlights</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {details.highlights.map((highlight: any, index: number) => (
                        <div
                          key={index}
                          className="highlight-item text-center flex flex-col items-center"
                        >
                          {highlight.icon && (
                            <div className="highlight-icon mb-1 flex items-center justify-center h-16">
                              <Image
                                src={highlight.icon}
                                alt={`${highlight.value} ${highlight.label}`}
                                width={50}
                                height={50}
                                className="mx-auto object-contain"
                              />
                            </div>
                          )}
                          <div className="highlight-text">
                            <div className="text-base font-bold text-blue-600">
                              {highlight.value}
                              {highlight.unit && <span> {highlight.unit}</span>}
                            </div>
                            <div className="text-xs text-gray-700">
                              {highlight.label}
                              {highlight.labelLine2 && (
                                <>
                                  <br />
                                  {highlight.labelLine2}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Project Walkthrough Video */}
                {details.assets?.videos?.[0] && (
                  <div className="video-card bg-white p-6 rounded-lg shadow-md mt-auto">
                    <h3 className="text-lg font-semibold mb-4">Project Walkthrough</h3>
                    <div className="video-container rounded-lg overflow-hidden">
                      <video
                        width="100%"
                        height="200"
                        controls
                        className="rounded-lg"
                        poster={details.assets.videos[0].poster || parsedJson.thumbnailUrl}
                      >
                        <source src={details.assets.videos[0].url} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Project Content */}
        <div className="project-content">
          <div className="container mx-auto px-4 py-8">
            <div className="space-y-8">
              {/* Overview Section */}
              <div className="overview-section">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Overview</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-3">Project Description</h3>
                    <div className="text-gray-700 leading-relaxed space-y-4">
                      <p>{parsedJson.description}</p>
                      {details.overview?.description &&
                        details.overview.description !== parsedJson.description && (
                          <p>{details.overview.description}</p>
                        )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Amenities Section */}
              {(details.amenities?.outdoorImages?.length > 0 ||
                details.amenities?.indoorImages?.length > 0) && (
                <div className="amenities-section">
                  <h2 className="text-2xl font-bold mb-6 text-gray-800">Amenities</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {details.amenities?.outdoorImages?.map((amenity: any, index: number) => (
                      <div
                        key={`outdoor-${index}`}
                        className="amenity-item text-center p-3 bg-white rounded-lg shadow-sm border"
                      >
                        <div className="amenity-icon mb-2">
                          <Image
                            src={amenity.icon || '/images/placeholder.webp'}
                            alt={amenity.name}
                            width={50}
                            height={50}
                            className="mx-auto object-contain"
                          />
                        </div>
                        <p className="text-sm font-medium text-gray-700">{amenity.name}</p>
                      </div>
                    ))}

                    {details.amenities?.indoorImages?.map((amenity: any, index: number) => (
                      <div
                        key={`indoor-${index}`}
                        className="amenity-item text-center p-3 bg-white rounded-lg shadow-sm border"
                      >
                        <div className="amenity-icon mb-2">
                          <Image
                            src={amenity.icon || '/images/placeholder.webp'}
                            alt={amenity.name}
                            width={50}
                            height={50}
                            className="mx-auto object-contain"
                          />
                        </div>
                        <p className="text-sm font-medium text-gray-700">{amenity.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Specifications Section */}
              {details.specifications && (
                <div className="specifications-section">
                  <h2 className="text-2xl font-bold mb-8 text-gray-800 text-center">
                    SPECIFICATIONS
                  </h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {Array.isArray(details.specifications)
                      ? details.specifications.map((specGroup: any, index: number) => (
                          <div key={index} className="spec-item bg-white border rounded-lg">
                            <details className="group">
                              <summary className="cursor-pointer p-4 font-semibold text-gray-800 uppercase hover:bg-gray-50 transition-colors">
                                {specGroup.category || `Specification ${index + 1}`}
                              </summary>
                              <div className="p-4 pt-0 text-gray-700">
                                {Array.isArray(specGroup.items) ? (
                                  <ul className="list-disc list-inside space-y-2">
                                    {specGroup.items.map((item: string, idx: number) => (
                                      <li key={idx}>{item}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <div>{String(specGroup.items || '')}</div>
                                )}
                              </div>
                            </details>
                          </div>
                        ))
                      : Object.entries(details.specifications || {}).map(
                          ([category, specs]: [string, any]) => (
                            <div key={category} className="spec-item bg-white border rounded-lg">
                              <details className="group">
                                <summary className="cursor-pointer p-4 font-semibold text-gray-800 uppercase hover:bg-gray-50 transition-colors">
                                  {category
                                    .replace(/([A-Z])/g, ' $1')
                                    .replace(/^./, str => str.toUpperCase())}
                                </summary>
                                <div className="p-4 pt-0 text-gray-700">
                                  {Array.isArray(specs) ? (
                                    <ul className="list-disc list-inside space-y-2">
                                      {specs.map((spec: string, index: number) => (
                                        <li key={index}>{spec}</li>
                                      ))}
                                    </ul>
                                  ) : typeof specs === 'object' && specs !== null ? (
                                    <div className="space-y-3">
                                      {Object.entries(specs).map(([key, value]: [string, any]) => (
                                        <div key={key}>
                                          <strong className="text-gray-800">
                                            {key.toUpperCase()}:
                                          </strong>{' '}
                                          {Array.isArray(value) ? (
                                            <ul className="list-disc list-inside ml-4 mt-1">
                                              {value.map((item: any, idx: number) => (
                                                <li key={idx}>{String(item)}</li>
                                              ))}
                                            </ul>
                                          ) : (
                                            <span>{String(value)}</span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div>{String(specs)}</div>
                                  )}
                                </div>
                              </details>
                            </div>
                          )
                        )}
                  </div>
                </div>
              )}

              {/* Floor Plans Section */}
              {details.floorPlans && details.floorPlans.length > 0 && (
                <div className="floor-plans-section">
                  <h2 className="text-2xl font-bold mb-6 text-gray-800">Floor Plans</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {details.floorPlans.map((floorPlan: any, index: number) => (
                      <div
                        key={`floorplan-${index}`}
                        className="fp bg-white p-4 rounded-lg shadow-sm border"
                      >
                        <div
                          className="cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => openImageModal(floorPlan.image)}
                        >
                          <Image
                            src={floorPlan.image || '/images/placeholder.webp'}
                            alt={floorPlan.name}
                            width={400}
                            height={300}
                            className="w-full h-auto object-cover rounded-lg"
                          />
                        </div>
                        <div className="text-center mt-3 font-medium text-gray-800">
                          {floorPlan.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gallery Section */}
              {details.gallery && details.gallery.length > 0 && (
                <div className="gallery-section">
                  <h2 className="text-2xl font-bold mb-6 text-gray-800">Gallery</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {details.gallery.map((galleryItem: any, index: number) => (
                      <div
                        key={`gallery-${index}`}
                        className="gallery-item bg-white p-4 rounded-lg shadow-sm border"
                      >
                        <div
                          className="cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => openImageModal(galleryItem.image)}
                        >
                          <Image
                            src={galleryItem.image || '/images/placeholder.webp'}
                            alt={galleryItem.name}
                            width={400}
                            height={300}
                            className="w-full h-auto object-cover rounded-lg"
                          />
                        </div>
                        <h3 className="text-center mt-3 font-medium text-gray-800">
                          {galleryItem.name}
                        </h3>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Project Status Section */}
              {details.projectStatus && details.projectStatus.length > 0 && (
                <div className="project-status-section">
                  <h2 className="text-2xl font-bold mb-6 text-gray-800">Project Status</h2>
                  {details.projectStatusDate && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                      <p className="text-blue-800 font-medium">{details.projectStatusDate}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {details.projectStatus.map((statusItem: any, index: number) => (
                      <div
                        key={`status-${index}`}
                        className="status-item bg-white p-4 rounded-lg shadow-sm border"
                      >
                        <div
                          className="cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => openImageModal(statusItem.image)}
                        >
                          <Image
                            src={statusItem.image || '/images/placeholder.webp'}
                            alt={statusItem.name}
                            width={400}
                            height={300}
                            className="w-full h-auto object-cover rounded-lg"
                          />
                        </div>
                        <p className="text-center mt-3 text-sm text-gray-700">{statusItem.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Layout Section */}
              {details.assets?.layout?.url && (
                <div className="layout-section">
                  <h2 className="text-2xl font-bold mb-6 text-gray-800">Layout</h2>
                  <div className="layout-image-container bg-white p-6 rounded-lg shadow-sm border">
                    <div
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => openImageModal(details.assets.layout.url)}
                    >
                      <Image
                        src={details.assets.layout.url}
                        alt={details.assets.layout.title || `${parsedJson.name} Site Layout`}
                        width={800}
                        height={600}
                        className="w-full h-auto object-contain rounded-lg"
                        sizes="100vw"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={closeImageModal}
        >
          <div className="relative max-w-full max-h-full">
            <button
              className="absolute top-4 right-4 z-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 text-white transition-colors"
              onClick={closeImageModal}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="absolute top-4 left-4 z-10 flex gap-2">
              <button
                className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 text-white transition-colors"
                onClick={() => setZoom(prev => Math.min(prev * 1.5, 5))}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </button>
              <button
                className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 text-white transition-colors"
                onClick={() => setZoom(prev => Math.max(prev / 1.5, 0.5))}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                </svg>
              </button>
              <div className="bg-white bg-opacity-20 rounded-full px-3 py-2 text-white text-sm">
                {Math.round(zoom * 100)}%
              </div>
            </div>

            <div
              className="overflow-hidden max-w-[90vw] max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              <Image
                src={selectedImage}
                alt="Enlarged view"
                width={1200}
                height={900}
                className="transition-transform duration-200"
                style={{
                  transform: `scale(${zoom})`,
                }}
                sizes="90vw"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import Head from 'next/head'
import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import { PrismaClient } from '@prisma/client'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface AddProjectProps {
  templateJson: any
}

export default function AddProject({ templateJson }: AddProjectProps) {
  const [userJson, setUserJson] = useState('')
  const [comparison, setComparison] = useState<any>(null)
  const [isComparing, setIsComparing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const compareJsons = () => {
    setIsComparing(true)
    try {
      const userParsed = JSON.parse(userJson)
      const template = templateJson

      // Simple comparison - check for missing keys
      const templateKeys = getAllKeys(template)
      const userKeys = getAllKeys(userParsed)

      const missingKeys = templateKeys.filter(key => !userKeys.includes(key))
      const extraKeys = userKeys.filter(key => !templateKeys.includes(key))

      setComparison({
        valid: missingKeys.length === 0,
        missingKeys,
        extraKeys,
        userParsed,
      })
    } catch (error) {
      setComparison({
        valid: false,
        error: 'Invalid JSON format',
      })
    }
    setIsComparing(false)
  }

  const getAllKeys = (obj: any, prefix = ''): string[] => {
    let keys: string[] = []
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const fullKey = prefix ? `${prefix}.${key}` : key
        keys.push(fullKey)
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          keys = keys.concat(getAllKeys(obj[key], fullKey))
        }
      }
    }
    return keys
  }

  const submitProject = async () => {
    if (!comparison || !comparison.valid) {
      alert('Please compare and fix any issues first')
      return
    }

    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const response = await fetch('/api/projects/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectData: comparison.userParsed,
        }),
      })

      if (response.ok) {
        setSubmitStatus('success')
        setUserJson('')
        setComparison(null)
      } else {
        setSubmitStatus('error')
      }
    } catch (error) {
      setSubmitStatus('error')
    }
    setIsSubmitting(false)
  }

  return (
    <div className="add-project-container">
      <Head>
        <title>Add Project - Admin | Grihome</title>
        <meta name="description" content="Add new project to the database" />
      </Head>

      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Add New Project</h1>
          <p className="text-gray-600">
            Use the My Home Apas template on the left as a reference to create your project JSON on
            the right.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Template JSON (Left) */}
          <div className="template-section">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm mr-2">
                TEMPLATE
              </span>
              My Home Apas JSON Structure
            </h2>
            <div className="json-container">
              <pre className="bg-gray-50 border rounded-lg p-4 text-sm overflow-auto h-96 font-mono">
                {JSON.stringify(templateJson, null, 2)}
              </pre>
            </div>
          </div>

          {/* User Input JSON (Right) */}
          <div className="user-input-section">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm mr-2">
                YOUR DATA
              </span>
              Enter Your Project JSON
            </h2>
            <div className="json-container">
              <textarea
                value={userJson}
                onChange={e => setUserJson(e.target.value)}
                placeholder="Paste your project JSON here..."
                className="w-full h-96 p-4 border rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="actions-section mb-8">
          <div className="flex gap-4">
            <button
              onClick={compareJsons}
              disabled={!userJson.trim() || isComparing}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isComparing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Comparing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Compare JSONs
                </>
              )}
            </button>

            <button
              onClick={submitProject}
              disabled={!comparison || !comparison.valid || isSubmitting}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                  Submit Project
                </>
              )}
            </button>
          </div>
        </div>

        {/* Comparison Results */}
        {comparison && (
          <div className="comparison-results bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Comparison Results</h3>

            {comparison.error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-red-400 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-red-800 font-medium">Error: {comparison.error}</span>
                </div>
              </div>
            ) : (
              <>
                {comparison.valid ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 text-green-400 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-green-800 font-medium">
                        JSON structure is valid! Ready to submit.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center mb-2">
                      <svg
                        className="w-5 h-5 text-yellow-400 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-yellow-800 font-medium">
                        Issues found in JSON structure
                      </span>
                    </div>
                  </div>
                )}

                {comparison.missingKeys && comparison.missingKeys.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-red-700 mb-2">Missing Keys:</h4>
                    <ul className="list-disc list-inside text-sm text-red-600 bg-red-50 p-3 rounded">
                      {comparison.missingKeys.map((key: string, index: number) => (
                        <li key={index}>{key}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {comparison.extraKeys && comparison.extraKeys.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-blue-700 mb-2">
                      Extra Keys (will be included):
                    </h4>
                    <ul className="list-disc list-inside text-sm text-blue-600 bg-blue-50 p-3 rounded">
                      {comparison.extraKeys.map((key: string, index: number) => (
                        <li key={index}>{key}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Submit Status */}
        {submitStatus === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-green-800 font-medium">Project submitted successfully!</span>
            </div>
          </div>
        )}

        {submitStatus === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-red-800 font-medium">
                Error submitting project. Please try again.
              </span>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async () => {
  const prisma = new PrismaClient()

  try {
    // Get My Home Apas project as template
    const project = await prisma.project.findFirst({
      where: {
        name: {
          contains: 'My Home Apas',
          mode: 'insensitive',
        },
      },
      select: {
        name: true,
        description: true,
        type: true,
        numberOfUnits: true,
        size: true,
        thumbnailUrl: true,
        projectDetails: true,
        location: {
          select: {
            city: true,
            state: true,
            country: true,
            locality: true,
          },
        },
        builder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!project) {
      return {
        props: {
          templateJson: {
            name: 'Project Name',
            description: 'Project description goes here',
            type: 'RESIDENTIAL',
            location: 'City, State, Country',
            // Add other required fields
          },
        },
      }
    }

    // Create complete template with all required fields
    const projectDetailsObj = (project.projectDetails as any) || {}
    const templateJson = {
      name: project.name,
      description: project.description,
      type: project.type,
      numberOfUnits: project.numberOfUnits,
      size: project.size,
      thumbnailUrl: project.thumbnailUrl,
      location: `${project.location.locality ? project.location.locality + ', ' : ''}${project.location.city}, ${project.location.state}`,
      builderId: project.builder.id,
      ...projectDetailsObj,
      // Ensure Google Maps location widget is included
      googleMaps: projectDetailsObj.googleMaps || {
        embedUrl:
          'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3806.532982739845!2d78.34668281483305!3d17.433080688046788!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb93e58b17b24f%3A0x1a0a6c5e1c5e1c5e!2sMy%20Home%20Apas%2C%20Kokapet%2C%20Hyderabad%2C%20Telangana!5e0!3m2!1sen!2sin!4v1734567890123!5m2!1sen!2sin',
        address: project.location.locality
          ? `My Home Apas, ${project.location.locality}, ${project.location.city}, ${project.location.state}`
          : `My Home Apas, ${project.location.city}, ${project.location.state}`,
        coordinates: {
          lat: 17.433080688046788,
          lng: 78.34668281483305,
        },
      },
    }

    return {
      props: {
        templateJson,
      },
    }
  } catch (error) {
    return {
      props: {
        templateJson: {
          name: 'Project Name',
          description: 'Project description goes here',
          type: 'RESIDENTIAL',
          location: 'City, State, Country',
          googleMaps: {
            embedUrl:
              'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3806.532982739845!2d78.34668281483305!3d17.433080688046788!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb93e9c5a7e5e5%3A0x1234567890abcdef!2sMy%20Home%20Apas%2C%20Kokapet%2C%20Hyderabad%2C%20Telangana!5e0!3m2!1sen!2sin!4v1234567890123!5m2!1sen!2sin',
            address: 'My Home Apas, Kokapet, Hyderabad, Telangana',
            coordinates: {
              lat: 17.433080688046788,
              lng: 78.34668281483305,
            },
          },
          overview: {
            description: 'Project description goes here',
            location: 'City, State, Country',
          },
          amenities: {
            indoorImages: [],
            outdoorImages: [],
          },
          gallery: [],
          highlights: [],
          specifications: [],
          projectStatus: [],
          assets: {
            documents: [],
            videos: [],
            layout: {},
          },
        },
      },
    }
  } finally {
    await prisma.$disconnect()
  }
}

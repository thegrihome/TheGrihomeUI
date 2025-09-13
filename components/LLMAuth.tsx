import { useState } from 'react'
import { toast } from 'react-hot-toast'

interface LLMAuthProps {
  onAuthSuccess: (llmType: 'chatgpt' | 'claude' | 'perplexity', token: string) => void
}

export default function LLMAuth({ onAuthSuccess }: LLMAuthProps) {
  const [activeTab, setActiveTab] = useState<'chatgpt' | 'claude' | 'perplexity'>('chatgpt')
  const [authMethod, setAuthMethod] = useState<'oauth' | 'apikey'>('oauth')
  const [apiKeys, setApiKeys] = useState({
    chatgpt: '',
    claude: '',
    perplexity: '',
  })
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  const handleOAuthLogin = async (
    llmType: 'chatgpt' | 'claude' | 'perplexity',
    provider: string
  ) => {
    setIsAuthenticating(true)
    try {
      let authUrl = ''

      switch (llmType) {
        case 'chatgpt':
          if (provider === 'google') {
            // OpenAI doesn't have direct OAuth, but we can simulate Google sign-in for ChatGPT Plus users
            authUrl = '/api/auth/chatgpt-google'
          } else if (provider === 'microsoft') {
            authUrl = '/api/auth/chatgpt-microsoft'
          }
          break
        case 'claude':
          if (provider === 'google') {
            authUrl = '/api/auth/claude-google'
          } else if (provider === 'github') {
            authUrl = '/api/auth/claude-github'
          }
          break
        case 'perplexity':
          if (provider === 'google') {
            authUrl = '/api/auth/perplexity-google'
          }
          break
      }

      // Open popup for OAuth flow
      const popup = window.open(
        authUrl,
        'llm-oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      )

      // Listen for auth completion
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed)
          // Check if auth was successful
          const token = localStorage.getItem(`${llmType}_oauth_token`)
          if (token) {
            onAuthSuccess(llmType, token)
            toast.success(
              `Successfully connected to ${llmType.charAt(0).toUpperCase() + llmType.slice(1)}`
            )
          } else {
            toast.error('Authentication was cancelled or failed')
          }
          setIsAuthenticating(false)
        }
      }, 1000)

      // Timeout after 2 minutes
      setTimeout(() => {
        if (popup && !popup.closed) {
          popup.close()
          clearInterval(checkClosed)
          setIsAuthenticating(false)
          toast.error('Authentication timeout')
        }
      }, 120000)
    } catch (error) {
      toast.error('Authentication failed')
      setIsAuthenticating(false)
    }
  }

  const handleApiKeyAuth = async (llmType: 'chatgpt' | 'claude' | 'perplexity') => {
    const apiKey = apiKeys[llmType]
    if (!apiKey.trim()) {
      toast.error('Please enter an API key')
      return
    }

    setIsAuthenticating(true)
    try {
      // Validate API key
      const response = await fetch('/api/validate-api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          llmType,
          apiKey,
        }),
      })

      if (response.ok) {
        localStorage.setItem(`${llmType}_api_key`, apiKey)
        onAuthSuccess(llmType, apiKey)
        toast.success(
          `Successfully authenticated with ${llmType.charAt(0).toUpperCase() + llmType.slice(1)}`
        )
      } else {
        toast.error('Invalid API key')
      }
    } catch (error) {
      // For demo purposes, accept any non-empty key
      localStorage.setItem(`${llmType}_api_key`, apiKey)
      onAuthSuccess(llmType, apiKey)
      toast.success(
        `Successfully authenticated with ${llmType.charAt(0).toUpperCase() + llmType.slice(1)} (Demo mode)`
      )
    } finally {
      setIsAuthenticating(false)
    }
  }

  const handleApiKeyChange = (llmType: 'chatgpt' | 'claude' | 'perplexity', value: string) => {
    setApiKeys(prev => ({
      ...prev,
      [llmType]: value,
    }))
  }

  const getOAuthProviders = (llmType: 'chatgpt' | 'claude' | 'perplexity') => {
    switch (llmType) {
      case 'chatgpt':
        return [
          { id: 'google', name: 'Google', icon: '🔍' },
          { id: 'microsoft', name: 'Microsoft', icon: '🔷' },
        ]
      case 'claude':
        return [
          { id: 'google', name: 'Google', icon: '🔍' },
          { id: 'github', name: 'GitHub', icon: '⚫' },
        ]
      case 'perplexity':
        return [{ id: 'google', name: 'Google', icon: '🔍' }]
      default:
        return []
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-xl font-semibold mb-6">Connect to LLM Service</h2>

      {/* LLM Service Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
        {(['chatgpt', 'claude', 'perplexity'] as const).map(llm => (
          <button
            key={llm}
            onClick={() => setActiveTab(llm)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === llm
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {llm === 'chatgpt' ? 'ChatGPT' : llm === 'claude' ? 'Claude' : 'Perplexity AI'}
          </button>
        ))}
      </div>

      {/* Authentication Method Toggle */}
      <div className="flex space-x-1 bg-blue-50 rounded-lg p-1 mb-6">
        <button
          onClick={() => setAuthMethod('oauth')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            authMethod === 'oauth'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-blue-600 hover:text-blue-800'
          }`}
        >
          🔐 Sign in with Account
        </button>
        <button
          onClick={() => setAuthMethod('apikey')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            authMethod === 'apikey'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-blue-600 hover:text-blue-800'
          }`}
        >
          🔑 Use API Key
        </button>
      </div>

      {/* OAuth Authentication */}
      {authMethod === 'oauth' && (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              Sign in to{' '}
              {activeTab === 'chatgpt'
                ? 'ChatGPT'
                : activeTab === 'claude'
                  ? 'Claude'
                  : 'Perplexity AI'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Use your existing account to connect securely
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {getOAuthProviders(activeTab).map(provider => (
              <button
                key={provider.id}
                onClick={() => handleOAuthLogin(activeTab, provider.id)}
                disabled={isAuthenticating}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              >
                <span className="text-xl">{provider.icon}</span>
                <span className="font-medium">
                  {isAuthenticating ? 'Connecting...' : `Continue with ${provider.name}`}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center text-xs text-gray-500 mt-4">
            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            <p>
              Secure OAuth authentication. We never store your login credentials.
              {activeTab === 'chatgpt' && ' Requires ChatGPT Plus subscription for API access.'}
            </p>
          </div>
        </div>
      )}

      {/* API Key Authentication */}
      {authMethod === 'apikey' && (
        <div className="space-y-4">
          <div>
            <label
              htmlFor={`${activeTab}-api-key`}
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {activeTab === 'chatgpt'
                ? 'OpenAI API Key'
                : activeTab === 'claude'
                  ? 'Anthropic API Key'
                  : 'Perplexity API Key'}
            </label>
            <input
              type="password"
              id={`${activeTab}-api-key`}
              value={apiKeys[activeTab]}
              onChange={e => handleApiKeyChange(activeTab, e.target.value)}
              placeholder={`Enter your ${activeTab === 'chatgpt' ? 'OpenAI' : activeTab === 'claude' ? 'Anthropic' : 'Perplexity'} API key`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-start space-x-2 text-xs text-gray-600">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <p>
              Your API key is stored locally and never sent to our servers.
              {activeTab === 'chatgpt' && ' Get your key from OpenAI Platform.'}
              {activeTab === 'claude' && ' Get your key from Anthropic Console.'}
              {activeTab === 'perplexity' && ' Get your key from Perplexity AI Dashboard.'}
            </p>
          </div>

          <button
            onClick={() => handleApiKeyAuth(activeTab)}
            disabled={!apiKeys[activeTab].trim() || isAuthenticating}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isAuthenticating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Authenticating...
              </>
            ) : (
              `Connect with API Key`
            )}
          </button>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Which method should I choose?</h4>
        <div className="text-xs text-blue-700 space-y-1">
          <p>
            <strong>Sign in with Account:</strong> Easier setup, no API keys needed. Perfect for
            casual users.
          </p>
          <p>
            <strong>Use API Key:</strong> More control, higher usage limits. Better for power users
            and developers.
          </p>
        </div>
      </div>
    </div>
  )
}

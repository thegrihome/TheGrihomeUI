import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../api/auth/[...nextauth]'
import { checkAdminAccess } from '@/lib/utils/admin-access'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface AdminStats {
  totalUsers: number
  users24h: number
  users7d: number
  users30d: number
  totalAgents: number
}

interface TransactionItem {
  id: string
  date: string
  type: 'Ad Purchase' | 'Property Added to Project' | 'Agent Registered to Project'
  userName: string | null
  userEmail: string
  duration: number | null
  amount: number
  details: string | null
}

interface AdminPageProps {
  isProduction: boolean
}

export const getServerSideProps: GetServerSideProps<AdminPageProps> = async context => {
  const session = await getServerSession(context.req, context.res, authOptions)
  const accessResult = checkAdminAccess(session?.user?.email)

  if (!accessResult.canAccessAdmin) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    }
  }

  return {
    props: {
      isProduction: accessResult.isProduction,
    },
  }
}

export default function AdminDashboard({ isProduction }: AdminPageProps) {
  const [mounted, setMounted] = useState(false)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [transactions, setTransactions] = useState<TransactionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [statsRes, transactionsRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch(`/api/admin/transactions?page=${page}&limit=20`),
        ])

        if (!statsRes.ok || !transactionsRes.ok) {
          throw new Error('Failed to fetch admin data')
        }

        const statsData = await statsRes.json()
        const transactionsData = await transactionsRes.json()

        setStats(statsData)
        setTransactions(transactionsData.transactions)
        setTotalPages(transactionsData.pagination.totalPages)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [page])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (!mounted) return null

  return (
    <>
      <Header />
      <main className="admin-dashboard">
        <div className="admin-container">
          <div className="admin-header">
            <h1 className="admin-title">Admin Dashboard</h1>
            {!isProduction && (
              <span className="admin-badge admin-badge--dev">Development Mode</span>
            )}
          </div>

          {loading && (
            <div className="admin-loading">
              <div className="admin-spinner"></div>
              <p>Loading dashboard data...</p>
            </div>
          )}

          {error && (
            <div className="admin-error">
              <p>{error}</p>
              <button onClick={() => window.location.reload()}>Retry</button>
            </div>
          )}

          {!loading && !error && stats && (
            <>
              {/* Stats Cards */}
              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <div className="admin-stat-icon admin-stat-icon--users">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </div>
                  <div className="admin-stat-content">
                    <p className="admin-stat-label">Total Users</p>
                    <p className="admin-stat-value">{stats.totalUsers}</p>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-icon admin-stat-icon--agents">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="admin-stat-content">
                    <p className="admin-stat-label">Total Agents</p>
                    <p className="admin-stat-value">{stats.totalAgents}</p>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-content">
                    <p className="admin-stat-label">Signups (24h)</p>
                    <p className="admin-stat-value">{stats.users24h}</p>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-content">
                    <p className="admin-stat-label">Signups (7d)</p>
                    <p className="admin-stat-value">{stats.users7d}</p>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-content">
                    <p className="admin-stat-label">Signups (30d)</p>
                    <p className="admin-stat-value">{stats.users30d}</p>
                  </div>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="admin-transactions">
                <h2 className="admin-section-title">Transaction History</h2>
                {transactions.length === 0 ? (
                  <div className="admin-empty">
                    <p>No transactions found</p>
                  </div>
                ) : (
                  <>
                    <div className="admin-table-container">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>User</th>
                            <th>Duration</th>
                            <th>Amount</th>
                            <th>Details</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map(tx => (
                            <tr key={tx.id}>
                              <td className="admin-table-date">{formatDate(tx.date)}</td>
                              <td>
                                <span
                                  className={`admin-tx-type admin-tx-type--${tx.type.toLowerCase().replace(/ /g, '-')}`}
                                >
                                  {tx.type}
                                </span>
                              </td>
                              <td>
                                <div className="admin-table-user">
                                  <span className="admin-table-user-name">
                                    {tx.userName || 'N/A'}
                                  </span>
                                  <span className="admin-table-user-email">{tx.userEmail}</span>
                                </div>
                              </td>
                              <td>{tx.duration ? `${tx.duration} days` : '-'}</td>
                              <td className="admin-table-amount">
                                {tx.amount > 0 ? formatCurrency(tx.amount) : '-'}
                              </td>
                              <td className="admin-table-details">{tx.details || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="admin-pagination">
                        <button
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="admin-pagination-btn"
                        >
                          Previous
                        </button>
                        <span className="admin-pagination-info">
                          Page {page} of {totalPages}
                        </span>
                        <button
                          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                          className="admin-pagination-btn"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

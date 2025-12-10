"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MapPin, Calendar, FileText, Eye, Brain, AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { getToken, isAuthenticated } from "@/lib/auth"
import type { IssueReport, DashboardResponse, DashboardSummary } from "@/types"

export default function DashboardPage() {
  const [reports, setReports] = useState<IssueReport[]>([])
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/auth/signin")
      return
    }
    fetchReports()
  }, [router])

  const fetchReports = async () => {
    try {
      const token = getToken()
      if (!token) {
        setError("No authentication token found")
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/v1/dashboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ token })
      })

      const data: DashboardResponse = await response.json()

      if (response.ok && data.success) {
        setReports(data.data.complaints)
        setSummary(data.data.summary)
        setError(null)
      } else {
        setError(data.message || "Failed to fetch dashboard data")
        console.error("API Error:", data)
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error)
      setError("Network error occurred while fetching data")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Resolved": return "bg-green-500"
      case "In Progress": return "bg-blue-500"
      case "Rejected": return "bg-red-500"
      default: return "bg-yellow-500"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Resolved": return <CheckCircle className="h-4 w-4" />
      case "In Progress": return <Clock className="h-4 w-4" />
      case "Rejected": return <XCircle className="h-4 w-4" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  const formatIssueType = (type: string) => {
    return type
      .split(/[-\s]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case "high": return "text-red-600"
      case "medium": return "text-yellow-600"
      case "low": return "text-green-600"
      default: return "text-gray-600"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Dashboard</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchReports}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b p-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/main")} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Main
          </Button>
          <h1 className="text-2xl font-bold">My Reports Dashboard</h1>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Reports</p>
                    <p className="text-2xl font-bold">{summary?.total || 0}</p>
                  </div>
                  <FileText className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Resolved</p>
                    <p className="text-2xl font-bold text-green-600">
                      {summary?.byStatus.resolved || 0}
                    </p>
                  </div>
                  <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">In Progress</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {summary?.byStatus.inProgress || 0}
                    </p>
                  </div>
                  <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <Clock className="h-4 w-4 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {summary?.byStatus.pending || 0}
                    </p>
                  </div>
                  <div className="h-8 w-8 bg-yellow-500 rounded-full flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Issue Type Breakdown */}
          {summary && summary.total > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Issue Types Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {Object.entries(summary.byType).map(([type, count]) => (
                    <div key={type} className="text-center">
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-sm text-muted-foreground">{formatIssueType(type)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reports List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Your Complaint Records</h2>
            {reports.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No reports submitted yet.</p>
                  <Button onClick={() => router.push("/main")} className="mt-4">
                    Submit Your First Report
                  </Button>
                </CardContent>
              </Card>
            ) : (
              reports.map((report) => (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">{formatIssueType(report.type)}</CardTitle>
                        <Badge className={`${getStatusColor(report.status)} text-white flex items-center gap-1`}>
                          {getStatusIcon(report.status)}
                          {report.status}
                        </Badge>
                        {report.mlPriority && (
                          <Badge variant="outline" className={getPriorityColor(report.mlPriority)}>
                            {report.mlPriority} Priority
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(report.createdAt)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-4">
                    {/* Location Information */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {report.city}, {report.district}
                            {report.state && `, ${report.state}`}
                          </span>
                        </div>
                      </div>
                      {report.formattedAddress && (
                        <p className="text-sm text-muted-foreground">
                          📍 {report.formattedAddress}
                        </p>
                      )}
                      {report.roadName && (
                        <p className="text-sm text-muted-foreground">
                          🛣️ {report.roadName}
                        </p>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Coordinates: {report.coordinates.latitude.toFixed(4)}, {report.coordinates.longitude.toFixed(4)}
                      </div>
                    </div>

                    {/* ML Detection Results */}
                    {report.mlDetections && report.mlDetections.length > 0 && (
                      <div className="border rounded-lg p-3 bg-muted/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Brain className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium">AI Detection Results</span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p>
                            <span className="font-medium">Detections:</span> {report.totalDetections} objects found
                          </p>
                          {report.mlConfidence && (
                            <p>
                              <span className="font-medium">Confidence:</span> {(report.mlConfidence * 100).toFixed(1)}%
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {report.mlDetections.slice(0, 3).map((detection: any, idx: number) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {detection.class} ({(detection.confidence * 100).toFixed(0)}%)
                              </Badge>
                            ))}
                            {report.mlDetections.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{report.mlDetections.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Images */}
                    <div className="flex gap-2">
                      {report.originalImageUrl && (
                        <div className="relative">
                          <img
                            src={report.originalImageUrl}
                            alt="Original upload"
                            className="w-20 h-20 object-cover rounded border cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => window.open(report.originalImageUrl, '_blank')}
                          />
                          <Badge className="absolute -top-1 -right-1 text-xs bg-blue-500">
                            <Eye className="h-3 w-3" />
                          </Badge>
                        </div>
                      )}
                      {report.finalImageUrl && report.finalImageUrl !== report.originalImageUrl && (
                        <div className="relative">
                          <img
                            src={report.finalImageUrl}
                            alt="AI analyzed"
                            className="w-20 h-20 object-cover rounded border cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => window.open(report.finalImageUrl, '_blank')}
                          />
                          <Badge className="absolute -top-1 -right-1 text-xs bg-green-500">
                            <Brain className="h-3 w-3" />
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

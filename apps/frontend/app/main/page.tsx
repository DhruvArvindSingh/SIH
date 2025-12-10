"use client"

import type React from "react"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, LogOut, Upload, X, Camera, MapPin, FileText, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import { getToken, logout, isAuthenticated } from "@/lib/auth"
import { GoogleMaps } from "@/components/google-maps"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageSelector } from "@/components/language-selector"
import type { IssueType, IssueReportRequest, LocationDetails } from "@/types"

export default function MainPage() {
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [showReplyBox, setShowReplyBox] = useState(false)
  const [submittedIssueId, setSubmittedIssueId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [formData, setFormData] = useState({
    issueType: "" as IssueType | "",
    content: "",
    city: "",
    district: "",
    roadName: "",
    coordinates: { latitude: 0, longitude: 0 },
  })
  const [extendedLocationDetails, setExtendedLocationDetails] = useState<LocationDetails | null>(null)
  const router = useRouter()

  // Memoize coordinates to prevent unnecessary re-renders
  const coordinates = useMemo(() => formData.coordinates, [formData.coordinates.latitude, formData.coordinates.longitude])

  useEffect(() => {
    setIsSignedIn(isAuthenticated())
  }, [])

  const handleSignIn = () => {
    router.push("/auth/signin")
  }

  const handleSignOut = () => {
    logout()
    setIsSignedIn(false)
  }

  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setFormData((prev) => ({
      ...prev,
      coordinates: { latitude: lat, longitude: lng },
    }))
  }, [])

  const handleLocationDetails = useCallback((city: string, district: string, roadName: string) => {
    setFormData((prev) => ({
      ...prev,
      city: city || prev.city,
      district: district || prev.district,
      roadName: roadName || prev.roadName,
    }))
  }, [])

  const handleExtendedLocationDetails = useCallback((locationDetails: LocationDetails) => {
    setExtendedLocationDetails(locationDetails)
  }, [])

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result as string
          setUploadedImages((prev) => [...prev, result])
        }
        reader.readAsDataURL(file)
      }
    })
  }

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmitReport = async () => {
    if (!formData.issueType || !formData.city || !formData.district) {
      alert("Please fill in all required fields")
      return
    }

    if (!formData.content && uploadedImages.length === 0) {
      alert("Please provide either a description or upload an image")
      return
    }

    if (coordinates.latitude === 0 && coordinates.longitude === 0) {
      alert("Please select a location on the map")
      return
    }

    setIsLoading(true)
    const token = getToken()

    if (!token) {
      alert("Please sign in to submit a report")
      setIsLoading(false)
      return
    }

    try {
      // Use uploaded image as content if available, otherwise use text description
      const contentData = uploadedImages.length > 0 ? uploadedImages[0] : formData.content;

      const reportData: IssueReportRequest = {
        token,
        content: contentData,
        city: formData.city,
        district: formData.district,
        coordinates: coordinates,
        locationDetails: extendedLocationDetails || undefined,
      }

      const endpoint = `${process.env.NEXT_PUBLIC_BACKEND}/api/v1/${formData.issueType}`
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reportData),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Issue submitted successfully:', result)

        // Store the Issue ID and show success modal
        setSubmittedIssueId(result.data?.Id || null)
        setShowReplyBox(true)
        setFormData({
          issueType: "",
          content: "",
          city: "",
          district: "",
          roadName: "",
          coordinates: { latitude: 0, longitude: 0 },
        })
        setUploadedImages([])
        setExtendedLocationDetails(null)
        setTimeout(() => {
          setShowReplyBox(false)
          setSubmittedIssueId(null)
        }, 5000)
      } else {
        const errorData = await response.json()
        console.error("Error response:", errorData)
        alert(`Failed to submit report: ${errorData.message || "Please try again."}`)
      }
    } catch (error) {
      alert("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-foreground">Civic Issue Reporting System</h1>
            </div>

            <div className="flex items-center gap-4">
              <LanguageSelector />
              <ThemeToggle />

              <div className="flex items-center gap-2">
                {!isSignedIn ? (
                  <Button onClick={handleSignIn} className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Sign In
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" disabled className="flex items-center gap-2 bg-transparent">
                      <User className="h-4 w-4" />
                      Signed In
                    </Button>
                    <Button onClick={handleSignOut} variant="destructive" className="flex items-center gap-2">
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
          {/* Left Column - Form Sections */}
          <div className="space-y-6">
            {/* Issue Type and Description Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Settings className="h-5 w-5" />
                    Issue Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={formData.issueType}
                    onValueChange={(value: IssueType) => setFormData((prev) => ({ ...prev, issueType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select issue type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pothole">Pothole</SelectItem>
                      <SelectItem value="street-light">Street Light</SelectItem>
                      <SelectItem value="garbage">Garbage</SelectItem>
                      <SelectItem value="broken-sign">Broken Sign</SelectItem>
                      <SelectItem value="fallen-tree">Fallen Tree</SelectItem>
                      <SelectItem value="graffiti">Graffiti</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="h-5 w-5" />
                    Location Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="city" className="text-sm">
                      City
                    </Label>
                    <Input
                      id="city"
                      placeholder="Enter city"
                      value={formData.city}
                      onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="district" className="text-sm">
                      District
                    </Label>
                    <Input
                      id="district"
                      placeholder="Enter district"
                      value={formData.district}
                      onChange={(e) => setFormData((prev) => ({ ...prev, district: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="roadName" className="text-sm">
                      Road Name
                    </Label>
                    <Input
                      id="roadName"
                      placeholder="Select location on map"
                      value={formData.roadName}
                      readOnly
                      className="bg-muted cursor-not-allowed"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Coordinates Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="h-5 w-5" />
                    Coordinates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="latitude" className="text-sm">
                      Latitude
                    </Label>
                    <Input
                      id="latitude"
                      placeholder="Select location on map"
                      value={coordinates.latitude !== 0 ? coordinates.latitude.toFixed(6) : ""}
                      readOnly
                      className="bg-muted cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <Label htmlFor="longitude" className="text-sm">
                      Longitude
                    </Label>
                    <Input
                      id="longitude"
                      placeholder="Select location on map"
                      value={coordinates.longitude !== 0 ? coordinates.longitude.toFixed(6) : ""}
                      readOnly
                      className="bg-muted cursor-not-allowed"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="h-5 w-5" />
                    Location Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-center py-4">
                    {coordinates.latitude !== 0 && coordinates.longitude !== 0 ? (
                      <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 text-green-600">
                          <MapPin className="h-5 w-5" />
                          <span className="font-medium">Location Selected</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          You can click on the map to change the location
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 text-orange-600">
                          <MapPin className="h-5 w-5" />
                          <span className="font-medium">No Location Selected</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Click on the map or search for a location
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Extended Location Details */}
            {extendedLocationDetails && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="h-5 w-5" />
                    Detailed Location Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {extendedLocationDetails.state && (
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">State</Label>
                        <p className="text-sm font-medium">{extendedLocationDetails.state}</p>
                      </div>
                    )}
                    {extendedLocationDetails.country && (
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Country</Label>
                        <p className="text-sm font-medium">{extendedLocationDetails.country}</p>
                      </div>
                    )}
                    {extendedLocationDetails.postalCode && (
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Postal Code</Label>
                        <p className="text-sm font-medium">{extendedLocationDetails.postalCode}</p>
                      </div>
                    )}
                    {extendedLocationDetails.neighborhood && (
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Neighborhood</Label>
                        <p className="text-sm font-medium">{extendedLocationDetails.neighborhood}</p>
                      </div>
                    )}
                    {extendedLocationDetails.landmark && (
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Landmark</Label>
                        <p className="text-sm font-medium">{extendedLocationDetails.landmark}</p>
                      </div>
                    )}
                    {extendedLocationDetails.placeId && (
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Place ID</Label>
                        <p className="text-xs font-mono bg-muted px-2 py-1 rounded">
                          {extendedLocationDetails.placeId.substring(0, 20)}...
                        </p>
                      </div>
                    )}
                  </div>

                  {extendedLocationDetails.formattedAddress && (
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Complete Address</Label>
                      <p className="text-sm bg-muted p-3 rounded mt-1">{extendedLocationDetails.formattedAddress}</p>
                    </div>
                  )}

                  {extendedLocationDetails.placeTypes && extendedLocationDetails.placeTypes.length > 0 && (
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Place Categories</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {extendedLocationDetails.placeTypes.slice(0, 8).map((type, index) => (
                          <span
                            key={index}
                            className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full border"
                          >
                            {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        ))}
                        {extendedLocationDetails.placeTypes.length > 8 && (
                          <span className="text-xs text-muted-foreground px-2 py-1">
                            +{extendedLocationDetails.placeTypes.length - 8} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Description */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5" />
                  Issue Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Describe the issue in detail..."
                  value={formData.content}
                  onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                  rows={4}
                  className="resize-none"
                />
              </CardContent>
            </Card>

            {/* Photo Upload */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Camera className="h-5 w-5" />
                  Upload Photos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="image-upload" className="cursor-pointer">
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Click to upload photos or drag and drop</p>
                      <p className="text-xs text-muted-foreground/75 mt-1">PNG, JPG, GIF up to 10MB each</p>
                    </div>
                  </Label>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {uploadedImages.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image || "/placeholder.svg"}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg border"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-1 right-1 h-6 w-6 p-0"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button onClick={handleSubmitReport} disabled={isLoading || !isSignedIn} className="flex-1" size="lg">
                {isLoading ? "Submitting..." : "Report Issue"}
              </Button>
              <Button
                onClick={() => router.push("/dashboard")}
                variant="outline"
                className="flex-1"
                disabled={!isSignedIn}
                size="lg"
              >
                View Dashboard
              </Button>
            </div>
          </div>

          {/* Right Column - Interactive Map */}
          <div className="lg:sticky lg:top-24 lg:h-fit">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5" />
                  Select Location
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <GoogleMaps
                  coordinates={coordinates}
                  onLocationSelect={handleLocationSelect}
                  onLocationDetails={handleLocationDetails}
                  onExtendedLocationDetails={handleExtendedLocationDetails}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="border-t bg-muted/50 mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Civic Reporting</h3>
              <p className="text-sm text-muted-foreground">
                Making communities better through collaborative issue reporting and resolution.
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <button onClick={() => router.push("/main")} className="hover:text-foreground transition-colors">
                    Report Issue
                  </button>
                </li>
                <li>
                  <button onClick={() => router.push("/dashboard")} className="hover:text-foreground transition-colors">
                    Dashboard
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => router.push("/auth/signin")}
                    className="hover:text-foreground transition-colors"
                  >
                    Sign In
                  </button>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Issue Types</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Potholes</li>
                <li>Street Lights</li>
                <li>Garbage Collection</li>
                <li>Traffic Signs</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-6 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Civic Issue Reporting System. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Reply Box */}
      {showReplyBox && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="p-6 text-center space-y-3">
              <div className="text-green-600 text-lg font-semibold">✓ Success</div>
              <p>Your request has been submitted successfully!</p>
              {submittedIssueId && (
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Issue ID: <span className="font-mono font-bold">#{submittedIssueId}</span>
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-300 mt-1">
                    Please save this ID for tracking your report
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

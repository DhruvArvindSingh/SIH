"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MapPin, Search, Navigation } from "lucide-react"

interface InteractiveMapProps {
  coordinates: { latitude: number; longitude: number }
  onLocationSelect: (lat: number, lng: number) => void
}

export function InteractiveMap({ coordinates, onLocationSelect }: InteractiveMapProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lng: -74.006 }) // Default to NYC

  useEffect(() => {
    if (coordinates.latitude !== 0 && coordinates.longitude !== 0) {
      setMapCenter({ lat: coordinates.latitude, lng: coordinates.longitude })
    }
  }, [coordinates])

  const handleMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // Convert click position to approximate coordinates
    // This is a simplified calculation for demo purposes
    const lat = mapCenter.lat + (0.5 - y / rect.height) * 0.1
    const lng = mapCenter.lng + (x / rect.width - 0.5) * 0.1

    onLocationSelect(lat, lng)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)

    // Simulate search delay
    setTimeout(() => {
      // Mock search results - in a real app, you'd use a geocoding API
      const mockResults = [
        { name: "Central Park, NYC", lat: 40.7829, lng: -73.9654 },
        { name: "Times Square, NYC", lat: 40.758, lng: -73.9855 },
        { name: "Brooklyn Bridge, NYC", lat: 40.7061, lng: -73.9969 },
      ]

      const result = mockResults.find((r) => r.name.toLowerCase().includes(searchQuery.toLowerCase())) || mockResults[0]

      setMapCenter({ lat: result.lat, lng: result.lng })
      onLocationSelect(result.lat, result.lng)
      setIsSearching(false)
    }, 1000)
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          setMapCenter({ lat, lng })
          onLocationSelect(lat, lng)
        },
        (error) => {
          console.error("Error getting location:", error)
          alert("Unable to get your current location")
        },
      )
    } else {
      alert("Geolocation is not supported by this browser")
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location Map
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Bar */}
        <div className="flex gap-2">
          <Input
            placeholder="Search for a location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={isSearching} size="icon">
            <Search className="h-4 w-4" />
          </Button>
          <Button onClick={getCurrentLocation} variant="outline" size="icon" title="Use current location">
            <Navigation className="h-4 w-4" />
          </Button>
        </div>

        {/* Map Area */}
        <div
          className="w-full h-96 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors cursor-crosshair relative overflow-hidden"
          onClick={handleMapClick}
        >
          {/* Grid pattern to simulate map */}
          <div className="absolute inset-0 opacity-20">
            <div className="grid grid-cols-8 grid-rows-8 h-full w-full">
              {Array.from({ length: 64 }).map((_, i) => (
                <div key={i} className="border border-gray-300"></div>
              ))}
            </div>
          </div>

          {/* Streets simulation */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-0 right-0 h-1 bg-gray-400 opacity-60"></div>
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-400 opacity-60"></div>
            <div className="absolute top-3/4 left-0 right-0 h-1 bg-gray-400 opacity-60"></div>
            <div className="absolute left-1/4 top-0 bottom-0 w-1 bg-gray-400 opacity-60"></div>
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gray-400 opacity-60"></div>
            <div className="absolute left-3/4 top-0 bottom-0 w-1 bg-gray-400 opacity-60"></div>
          </div>

          {/* Location Pin */}
          {coordinates.latitude !== 0 && coordinates.longitude !== 0 && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                <MapPin className="h-8 w-8 text-red-500 drop-shadow-lg" fill="currentColor" />
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          )}

          {/* Instructions */}
          {coordinates.latitude === 0 && coordinates.longitude === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center bg-white/90 p-4 rounded-lg shadow-sm">
                <MapPin className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground font-medium">Click anywhere to pin location</p>
                <p className="text-sm text-muted-foreground mt-1">Or search for a specific address</p>
              </div>
            </div>
          )}
        </div>

        {/* Coordinates Display */}
        {coordinates.latitude !== 0 && coordinates.longitude !== 0 && (
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm font-medium text-primary">Selected Location:</p>
            <p className="text-sm text-muted-foreground">Latitude: {coordinates.latitude.toFixed(6)}</p>
            <p className="text-sm text-muted-foreground">Longitude: {coordinates.longitude.toFixed(6)}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

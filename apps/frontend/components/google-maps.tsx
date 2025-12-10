"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Navigation, Loader2 } from "lucide-react"
import { useGoogleMaps } from "@/hooks/use-google-maps"
import type { LocationDetails, AddressComponent } from "@/types"

declare global {
    interface Window {
        google: any
        initGoogleMap: () => void
    }
}

interface GoogleMapsProps {
    coordinates: { latitude: number; longitude: number }
    onLocationSelect: (lat: number, lng: number) => void
    onLocationDetails?: (city: string, district: string, roadName: string) => void
    onExtendedLocationDetails?: (locationDetails: LocationDetails) => void
}

export function GoogleMaps({ coordinates, onLocationSelect, onLocationDetails, onExtendedLocationDetails }: GoogleMapsProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [isSearching, setIsSearching] = useState(false)
    const [locationDetails, setLocationDetails] = useState({ city: "", district: "", roadName: "" })
    const [extendedLocationDetails, setExtendedLocationDetails] = useState<LocationDetails | null>(null)
    const { isLoaded: isGoogleMapsLoaded, loadError } = useGoogleMaps()

    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<any>(null)
    const markerRef = useRef<any>(null)
    const placesServiceRef = useRef<any>(null)
    const autocompleteRef = useRef<any>(null)
    const infoWindowRef = useRef<any>(null)

    // Initialize Google Maps
    useEffect(() => {
        const initializeGoogleMaps = () => {
            if (!isGoogleMapsLoaded || !window.google || !mapRef.current) return

            // Default location (Bangalore, India)
            const defaultLocation = { lat: 12.9716, lng: 77.5946 }
            let initialLocation = defaultLocation
            let initialZoom = 8

            // If coordinates are provided, use them
            if (coordinates.latitude !== 0 && coordinates.longitude !== 0) {
                initialLocation = { lat: coordinates.latitude, lng: coordinates.longitude }
                initialZoom = 15
            }

            // Try to get user's current location first (only if no coordinates provided)
            if (coordinates.latitude === 0 && coordinates.longitude === 0 && navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const userLocation = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        }
                        initializeMap(userLocation, 15)
                        console.log("📍 Using user's current location:", userLocation)
                    },
                    (error) => {
                        console.warn("⚠️ Geolocation failed:", error.message)
                        initializeMap(defaultLocation, 8)
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 300000
                    }
                )
            } else {
                initializeMap(initialLocation, initialZoom)
            }
        }

        const initializeMap = (center: { lat: number; lng: number }, zoom: number) => {
            if (!mapRef.current) return

            mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
                center,
                zoom,
                mapTypeControl: true,
                streetViewControl: true,
                fullscreenControl: true,
            })

            // Initialize Places Service
            placesServiceRef.current = new window.google.maps.places.PlacesService(mapInstanceRef.current)

            // Initialize InfoWindow
            infoWindowRef.current = new window.google.maps.InfoWindow()

            // Add location button
            addLocationButton()

            // Listen for clicks on map
            mapInstanceRef.current.addListener("click", (e: any) => {
                const lat = e.latLng.lat()
                const lng = e.latLng.lng()
                handleLocationSelect(lat, lng)
            })

            // If we have initial coordinates, set marker
            if (coordinates.latitude !== 0 && coordinates.longitude !== 0) {
                handleLocationSelect(coordinates.latitude, coordinates.longitude)
            }
        }

        const addLocationButton = () => {
            const locationButton = document.createElement("button")
            locationButton.textContent = "📍 Current Location"
            locationButton.style.cssText = `
        background-color: #fff;
        border: 2px solid #fff;
        border-radius: 3px;
        box-shadow: 0 2px 6px rgba(0,0,0,.15);
        color: rgb(25,25,25);
        cursor: pointer;
        font-family: Roboto,Arial,sans-serif;
        font-size: 16px;
        line-height: 38px;
        margin: 8px 0 22px;
        padding: 0 5px;
        text-align: center;
      `

            locationButton.addEventListener("click", getCurrentLocation)
            mapInstanceRef.current.controls[window.google.maps.ControlPosition.TOP_CENTER].push(locationButton)
        }

        if (isGoogleMapsLoaded) {
            initializeGoogleMaps()
        }

        return () => {
            if (autocompleteRef.current && window.google) {
                window.google.maps.event.clearInstanceListeners(autocompleteRef.current)
            }
        }
    }, [isGoogleMapsLoaded])

    // Update map when coordinates change externally
    useEffect(() => {
        if (isGoogleMapsLoaded && mapInstanceRef.current && coordinates.latitude !== 0 && coordinates.longitude !== 0) {
            const newLocation = { lat: coordinates.latitude, lng: coordinates.longitude }

            // Check if the location actually changed to prevent unnecessary updates
            const currentCenter = mapInstanceRef.current.getCenter()
            if (currentCenter &&
                Math.abs(currentCenter.lat() - coordinates.latitude) < 0.000001 &&
                Math.abs(currentCenter.lng() - coordinates.longitude) < 0.000001) {
                return // Location hasn't changed significantly
            }

            mapInstanceRef.current.setCenter(newLocation)
            mapInstanceRef.current.setZoom(15)

            if (markerRef.current) {
                markerRef.current.setPosition(newLocation)
            } else {
                markerRef.current = new window.google.maps.Marker({
                    position: newLocation,
                    map: mapInstanceRef.current,
                })
            }
        }
    }, [coordinates.latitude, coordinates.longitude, isGoogleMapsLoaded])

    const handleLocationSelect = (lat: number, lng: number) => {
        // Update marker
        if (markerRef.current) {
            markerRef.current.setPosition({ lat, lng })
        } else {
            markerRef.current = new window.google.maps.Marker({
                position: { lat, lng },
                map: mapInstanceRef.current,
            })
        }

        // Call parent callback
        onLocationSelect(lat, lng)

        // Get location details
        getLocationDetailsUsingPlaces(lat, lng)
    }

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser")
            return
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                }

                mapInstanceRef.current.setCenter(userLocation)
                mapInstanceRef.current.setZoom(15)
                handleLocationSelect(userLocation.lat, userLocation.lng)

                // Show success message
                infoWindowRef.current.setPosition(userLocation)
                infoWindowRef.current.setContent("📍 Location found!")
                infoWindowRef.current.open(mapInstanceRef.current)
            },
            (error) => {
                console.error("❌ Geolocation error:", error)
                alert("Unable to get your current location")
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        )
    }

    const getLocationDetailsUsingPlaces = (lat: number, lng: number) => {
        if (!placesServiceRef.current) return

        const request = {
            location: { lat: parseFloat(lat.toString()), lng: parseFloat(lng.toString()) },
            radius: 100,
            type: 'establishment',
        }

        placesServiceRef.current.nearbySearch(request, (results: any[], status: any) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
                getPlaceDetails(results[0].place_id)
            } else {
                // Try broader search
                const broadRequest = {
                    location: { lat: parseFloat(lat.toString()), lng: parseFloat(lng.toString()) },
                    radius: 500,
                }

                placesServiceRef.current.nearbySearch(broadRequest, (broadResults: any[], broadStatus: any) => {
                    if (broadStatus === window.google.maps.places.PlacesServiceStatus.OK && broadResults && broadResults.length > 0) {
                        getPlaceDetails(broadResults[0].place_id)
                    } else {
                        fallbackGeocode(lat, lng)
                    }
                })
            }
        })
    }

    const getPlaceDetails = (placeId: string) => {
        const request = {
            placeId: placeId,
            fields: ["name", "formatted_address", "address_components", "geometry", "types", "vicinity", "place_id"]
        }

        placesServiceRef.current.getDetails(request, (place: any, status: any) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
                const extractedData = extractLocationData(place.address_components, place)

                // Set basic location details for backward compatibility
                setLocationDetails({
                    city: extractedData.city || "Not found",
                    district: extractedData.district || "Not found",
                    roadName: extractedData.roadName || place.name || "Not found"
                })

                // Set extended location details
                const extendedDetails: LocationDetails = {
                    city: extractedData.city,
                    district: extractedData.district,
                    roadName: extractedData.roadName || place.name || "",
                    state: extractedData.state,
                    country: extractedData.country,
                    postalCode: extractedData.postalCode,
                    neighborhood: extractedData.neighborhood,
                    landmark: place.name || "",
                    placeId: place.place_id || "",
                    formattedAddress: place.formatted_address || "",
                    addressComponents: place.address_components ? place.address_components.map((comp: any) => ({
                        longName: comp.long_name,
                        shortName: comp.short_name,
                        types: comp.types
                    })) : [],
                    placeTypes: place.types || []
                }

                setExtendedLocationDetails(extendedDetails)

                // Call callbacks
                if (onLocationDetails) {
                    onLocationDetails(extractedData.city || "", extractedData.district || "", extractedData.roadName || place.name || "")
                }
                if (onExtendedLocationDetails) {
                    onExtendedLocationDetails(extendedDetails)
                }
            } else {
                fallbackGeocode(coordinates.latitude, coordinates.longitude)
            }
        })
    }

    const extractLocationData = (addressComponents: any[], place?: any) => {
        let city = ""
        let district = ""
        let roadName = ""
        let state = ""
        let country = ""
        let postalCode = ""
        let neighborhood = ""

        if (addressComponents) {
            addressComponents.forEach((component: any) => {
                const types = component.types

                // City/Locality
                if (types.includes("locality")) {
                    city = component.long_name
                } else if (!city && types.includes("administrative_area_level_3")) {
                    city = component.long_name
                } else if (!city && types.includes("sublocality")) {
                    city = component.long_name
                }

                // District/Administrative Area Level 2
                if (types.includes("administrative_area_level_2")) {
                    district = component.long_name
                } else if (!district && types.includes("sublocality_level_1")) {
                    district = component.long_name
                } else if (!district && types.includes("administrative_area_level_3")) {
                    district = component.long_name
                }

                // State/Province
                if (types.includes("administrative_area_level_1")) {
                    state = component.long_name
                }

                // Country
                if (types.includes("country")) {
                    country = component.long_name
                }

                // Postal Code
                if (types.includes("postal_code")) {
                    postalCode = component.long_name
                }

                // Road/Street
                if (types.includes("route")) {
                    roadName = component.long_name
                } else if (!roadName && types.includes("street_number")) {
                    roadName = component.long_name
                }

                // Neighborhood
                if (types.includes("neighborhood")) {
                    neighborhood = component.long_name
                } else if (!neighborhood && types.includes("sublocality_level_2")) {
                    neighborhood = component.long_name
                } else if (!neighborhood && types.includes("sublocality_level_3")) {
                    neighborhood = component.long_name
                }
            })
        }

        return {
            city,
            district,
            roadName,
            state,
            country,
            postalCode,
            neighborhood
        }
    }

    const fallbackGeocode = (lat: number, lng: number) => {
        const geocoder = new window.google.maps.Geocoder()
        const latlng = { lat: parseFloat(lat.toString()), lng: parseFloat(lng.toString()) }

        geocoder.geocode({ location: latlng }, (results: any[], status: string) => {
            if (status === "OK" && results[0]) {
                const result = results[0]
                const extractedData = extractLocationData(result.address_components)

                // Set basic location details for backward compatibility
                setLocationDetails({
                    city: extractedData.city || "Not found",
                    district: extractedData.district || "Not found",
                    roadName: extractedData.roadName || "Not found"
                })

                // Set extended location details
                const extendedDetails: LocationDetails = {
                    city: extractedData.city,
                    district: extractedData.district,
                    roadName: extractedData.roadName,
                    state: extractedData.state,
                    country: extractedData.country,
                    postalCode: extractedData.postalCode,
                    neighborhood: extractedData.neighborhood,
                    landmark: "",
                    placeId: result.place_id || "",
                    formattedAddress: result.formatted_address || "",
                    addressComponents: result.address_components ? result.address_components.map((comp: any) => ({
                        longName: comp.long_name,
                        shortName: comp.short_name,
                        types: comp.types
                    })) : [],
                    placeTypes: result.types || []
                }

                setExtendedLocationDetails(extendedDetails)

                // Call callbacks
                if (onLocationDetails) {
                    onLocationDetails(extractedData.city || "", extractedData.district || "", extractedData.roadName || "")
                }
                if (onExtendedLocationDetails) {
                    onExtendedLocationDetails(extendedDetails)
                }
            }
        })
    }

    const handleSearch = () => {
        if (!searchQuery.trim() || !window.google) return

        setIsSearching(true)

        const service = new window.google.maps.places.PlacesService(mapInstanceRef.current)
        const request = {
            query: searchQuery,
            fields: ['name', 'geometry', 'formatted_address'],
        }

        service.textSearch(request, (results: any[], status: any) => {
            setIsSearching(false)

            if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
                const place = results[0]
                const lat = place.geometry.location.lat()
                const lng = place.geometry.location.lng()

                mapInstanceRef.current.setCenter({ lat, lng })
                mapInstanceRef.current.setZoom(15)
                handleLocationSelect(lat, lng)
            } else {
                alert("Location not found. Please try a different search term.")
            }
        })
    }

    const initializeAutocomplete = () => {
        if (!window.google || !isGoogleMapsLoaded) return

        const input = document.getElementById("google-maps-search") as HTMLInputElement
        if (!input) return

        autocompleteRef.current = new window.google.maps.places.Autocomplete(input, {
            fields: ["place_id", "geometry", "name", "formatted_address"]
        })

        autocompleteRef.current.addListener("place_changed", () => {
            const place = autocompleteRef.current.getPlace()

            if (!place.geometry || !place.geometry.location) {
                return
            }

            const lat = place.geometry.location.lat()
            const lng = place.geometry.location.lng()

            mapInstanceRef.current.setCenter({ lat, lng })
            mapInstanceRef.current.setZoom(15)
            handleLocationSelect(lat, lng)
        })
    }

    // Initialize autocomplete when map is loaded
    useEffect(() => {
        if (isGoogleMapsLoaded) {
            initializeAutocomplete()
        }
    }, [isGoogleMapsLoaded])

    // Show loading state
    if (!isGoogleMapsLoaded && !loadError) {
        return (
            <div className="w-full h-full">
                <div className="flex gap-2 mb-4">
                    <Input
                        placeholder="Search for places..."
                        disabled
                    />
                    <Button disabled size="icon">
                        <Search className="h-4 w-4" />
                    </Button>
                    <Button disabled variant="outline" size="icon">
                        <Navigation className="h-4 w-4" />
                    </Button>
                </div>
                <div className="w-full h-[500px] lg:h-[600px] rounded-lg border flex items-center justify-center bg-muted">
                    <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Loading Google Maps...</p>
                    </div>
                </div>
            </div>
        )
    }

    // Show error state
    if (loadError) {
        return (
            <div className="w-full h-full">
                <div className="flex gap-2 mb-4">
                    <Input
                        placeholder="Search for places..."
                        disabled
                    />
                    <Button disabled size="icon">
                        <Search className="h-4 w-4" />
                    </Button>
                    <Button disabled variant="outline" size="icon">
                        <Navigation className="h-4 w-4" />
                    </Button>
                </div>
                <div className="w-full h-[500px] lg:h-[600px] rounded-lg border flex items-center justify-center bg-muted">
                    <div className="text-center">
                        <p className="text-sm text-red-600 mb-2">Failed to load Google Maps</p>
                        <p className="text-xs text-muted-foreground">{loadError}</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full h-full">
            {/* Search Bar */}
            <div className="flex gap-2 mb-4">
                <Input
                    id="google-maps-search"
                    placeholder="Search for places..."
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

            {/* Map Container */}
            <div
                ref={mapRef}
                className="w-full h-[500px] lg:h-[600px] rounded-lg border"
                style={{ minHeight: "400px" }}
            />

            {/* Location Details */}
            {coordinates.latitude !== 0 && coordinates.longitude !== 0 && (
                <div className="mt-4 space-y-3">
                    <div className="bg-muted p-4 rounded-lg space-y-3">
                        <p className="text-sm font-medium text-primary border-b pb-2">Selected Location Details:</p>

                        {/* Primary Location Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div>
                                <p className="text-xs font-medium text-foreground">Road/Street:</p>
                                <p className="text-sm text-muted-foreground">{locationDetails.roadName}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-foreground">City:</p>
                                <p className="text-sm text-muted-foreground">{locationDetails.city}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-foreground">District:</p>
                                <p className="text-sm text-muted-foreground">{locationDetails.district}</p>
                            </div>
                            {extendedLocationDetails?.state && (
                                <div>
                                    <p className="text-xs font-medium text-foreground">State:</p>
                                    <p className="text-sm text-muted-foreground">{extendedLocationDetails.state}</p>
                                </div>
                            )}
                        </div>

                        {/* Extended Location Info */}
                        {extendedLocationDetails && (
                            <div className="pt-2 border-t">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {extendedLocationDetails.country && (
                                        <div>
                                            <p className="text-xs font-medium text-foreground">Country:</p>
                                            <p className="text-sm text-muted-foreground">{extendedLocationDetails.country}</p>
                                        </div>
                                    )}
                                    {extendedLocationDetails.postalCode && (
                                        <div>
                                            <p className="text-xs font-medium text-foreground">Postal Code:</p>
                                            <p className="text-sm text-muted-foreground">{extendedLocationDetails.postalCode}</p>
                                        </div>
                                    )}
                                    {extendedLocationDetails.neighborhood && (
                                        <div>
                                            <p className="text-xs font-medium text-foreground">Neighborhood:</p>
                                            <p className="text-sm text-muted-foreground">{extendedLocationDetails.neighborhood}</p>
                                        </div>
                                    )}
                                    {extendedLocationDetails.landmark && (
                                        <div>
                                            <p className="text-xs font-medium text-foreground">Landmark:</p>
                                            <p className="text-sm text-muted-foreground">{extendedLocationDetails.landmark}</p>
                                        </div>
                                    )}
                                </div>

                                {extendedLocationDetails.formattedAddress && (
                                    <div className="mt-2">
                                        <p className="text-xs font-medium text-foreground">Full Address:</p>
                                        <p className="text-sm text-muted-foreground">{extendedLocationDetails.formattedAddress}</p>
                                    </div>
                                )}

                                {extendedLocationDetails.placeTypes && extendedLocationDetails.placeTypes.length > 0 && (
                                    <div className="mt-2">
                                        <p className="text-xs font-medium text-foreground">Place Types:</p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {extendedLocationDetails.placeTypes.slice(0, 5).map((type, index) => (
                                                <span key={index} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                                    {type.replace(/_/g, ' ')}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Coordinates */}
                        <div className="pt-2 border-t">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <p className="text-xs font-medium text-foreground">Latitude:</p>
                                    <p className="text-sm text-muted-foreground">{coordinates.latitude.toFixed(6)}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-foreground">Longitude:</p>
                                    <p className="text-sm text-muted-foreground">{coordinates.longitude.toFixed(6)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

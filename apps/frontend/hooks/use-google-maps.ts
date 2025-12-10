"use client"

import { useEffect, useState } from 'react'

declare global {
    interface Window {
        google: any
        initGoogleMap: () => void
    }
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

export function useGoogleMaps() {
    const [isLoaded, setIsLoaded] = useState(false)
    const [loadError, setLoadError] = useState<string | null>(null)

    useEffect(() => {
        // Check if Google Maps is already loaded
        if (window.google && window.google.maps) {
            setIsLoaded(true)
            return
        }

        // Check if script is already loading
        if (document.querySelector('script[src*="maps.googleapis.com"]')) {
            // Script is loading, wait for it
            const checkLoaded = () => {
                if (window.google && window.google.maps) {
                    setIsLoaded(true)
                } else {
                    setTimeout(checkLoaded, 100)
                }
            }
            checkLoaded()
            return
        }

        // Load Google Maps script
        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGoogleMap`
        script.async = true
        script.defer = true

        // Set up global callback
        window.initGoogleMap = () => {
            setIsLoaded(true)
        }

        script.onerror = () => {
            setLoadError('Failed to load Google Maps')
        }

        document.head.appendChild(script)

        return () => {
            // Cleanup function
            const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
            if (existingScript) {
                existingScript.remove()
            }
            delete window.initGoogleMap
        }
    }, [])

    return { isLoaded, loadError }
}


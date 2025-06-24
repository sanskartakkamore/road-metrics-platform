"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import type { Defect } from "@/app/page"

interface InteractiveMapProps {
  defects: Defect[]
  onMapClick: (coordinates: [number, number]) => void
}

export default function InteractiveMap({ defects, onMapClick }: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [selectedDefect, setSelectedDefect] = useState<Defect | null>(null)
  const [showHeatmap, setShowHeatmap] = useState(false)

  // Simulate map initialization (in real app, you'd use Mapbox/Google Maps SDK)
  useEffect(() => {
    if (!mapRef.current) return

    // This would be replaced with actual map SDK initialization
    console.log("Map initialized with", defects.length, "defects")
  }, [defects])

  const handleMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // Convert pixel coordinates to lat/lng (simplified calculation)
    const lng = 77.5 + (x / rect.width) * 0.2
    const lat = 12.9 + ((rect.height - y) / rect.height) * 0.2

    onMapClick([lng, lat])
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-600"
      case "high":
        return "bg-red-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="relative">
      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-10 space-y-2">
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            showHeatmap ? "bg-blue-600 text-white" : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          {showHeatmap ? "Hide Heatmap" : "Show Heatmap"}
        </button>
      </div>

      {/* Map Container */}
      <div
        ref={mapRef}
        className="h-96 bg-gradient-to-br from-green-100 to-blue-100 relative overflow-hidden cursor-crosshair rounded-lg"
        onClick={handleMapClick}
        style={{
          backgroundImage: showHeatmap
            ? "radial-gradient(circle at 30% 40%, rgba(239, 68, 68, 0.3) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(245, 158, 11, 0.3) 0%, transparent 50%), radial-gradient(circle at 50% 80%, rgba(34, 197, 94, 0.3) 0%, transparent 50%)"
            : undefined,
        }}
      >
        {/* Grid overlay to simulate map tiles */}
        <div className="absolute inset-0 opacity-20">
          <div className="grid grid-cols-8 grid-rows-6 h-full">
            {Array.from({ length: 48 }).map((_, i) => (
              <div key={i} className="border border-gray-300"></div>
            ))}
          </div>
        </div>

        {/* Defect Markers */}
        {defects.map((defect, index) => {
          // Convert lat/lng to pixel coordinates (simplified)
          const x = ((defect.coordinates[0] - 77.5) / 0.2) * 100
          const y = 100 - ((defect.coordinates[1] - 12.9) / 0.2) * 100

          return (
            <div
              key={defect.id}
              className={`absolute w-4 h-4 rounded-full border-2 border-white shadow-lg cursor-pointer transform -translate-x-2 -translate-y-2 hover:scale-125 transition-transform ${getSeverityColor(defect.severity)}`}
              style={{
                left: `${Math.max(0, Math.min(100, x))}%`,
                top: `${Math.max(0, Math.min(100, y))}%`,
              }}
              onClick={(e) => {
                e.stopPropagation()
                setSelectedDefect(defect)
              }}
              title={`${defect.defectType} - ${defect.severity}`}
            />
          )
        })}

        {/* Map Legend */}
        <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg">
          <h4 className="font-semibold text-sm mb-2">Severity Levels</h4>
          <div className="space-y-1">
            {[
              { level: "Critical", color: "bg-red-600" },
              { level: "High", color: "bg-red-500" },
              { level: "Medium", color: "bg-yellow-500" },
              { level: "Low", color: "bg-green-500" },
            ].map(({ level, color }) => (
              <div key={level} className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${color}`}></div>
                <span className="text-xs text-gray-600">{level}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Click instruction */}
        <div className="absolute top-4 left-4 bg-white p-2 rounded-lg shadow-lg">
          <p className="text-xs text-gray-600">Click anywhere to report a defect</p>
        </div>
      </div>

      {/* Defect Details Modal */}
      {selectedDefect && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
            <h3 className="font-semibold text-lg mb-3 capitalize">{selectedDefect.defectType.replace("_", " ")}</h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Severity:</span> {selectedDefect.severity}
              </p>
              <p>
                <span className="font-medium">Location:</span> {selectedDefect.coordinates[1].toFixed(4)},{" "}
                {selectedDefect.coordinates[0].toFixed(4)}
              </p>
              <p>
                <span className="font-medium">Reported:</span> {new Date(selectedDefect.timestamp).toLocaleDateString()}
              </p>
              {selectedDefect.notes && (
                <p>
                  <span className="font-medium">Notes:</span> {selectedDefect.notes}
                </p>
              )}
              {selectedDefect.vehicleId && (
                <p>
                  <span className="font-medium">Vehicle ID:</span> {selectedDefect.vehicleId}
                </p>
              )}
            </div>
            <button
              onClick={() => setSelectedDefect(null)}
              className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

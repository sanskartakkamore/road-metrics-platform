"use client"

import { useState, useEffect, lazy, Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, AlertTriangle, BarChart3, Upload } from "lucide-react"

// Lazy load components for performance
const InteractiveMap = lazy(() => import("@/components/interactive-map"))
const DefectForm = lazy(() => import("@/components/defect-form"))
const Analytics = lazy(() => import("@/components/analytics"))
const FileUpload = lazy(() => import("@/components/file-upload"))

export interface Defect {
  id: string
  coordinates: [number, number]
  defectType: string
  severity: "low" | "medium" | "high" | "critical"
  notes?: string
  timestamp: string
  vehicleId?: string
}

export default function RoadMetricsPlatform() {
  const [defects, setDefects] = useState<Defect[]>([])
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  // Simulate API call to fetch existing defects
  useEffect(() => {
    const fetchDefects = async () => {
      setLoading(true)
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock data - in real app this would come from your API
      const mockDefects: Defect[] = [
        {
          id: "1",
          coordinates: [77.5946, 12.9716],
          defectType: "pothole",
          severity: "high",
          notes: "Large pothole affecting traffic flow",
          timestamp: "2024-01-15T10:30:00Z",
        },
        {
          id: "2",
          coordinates: [77.6099, 12.9279],
          defectType: "crack",
          severity: "medium",
          notes: "Surface crack extending across lane",
          timestamp: "2024-01-14T14:20:00Z",
        },
        {
          id: "3",
          coordinates: [77.5833, 12.9667],
          defectType: "minor_pothole",
          severity: "low",
          timestamp: "2024-01-13T09:15:00Z",
        },
      ]

      setDefects(mockDefects)
      setLoading(false)
    }

    fetchDefects()
  }, [])

  const handleMapClick = (coordinates: [number, number]) => {
    setSelectedLocation(coordinates)
    setShowForm(true)
  }

  const handleDefectSubmit = async (defectData: Omit<Defect, "id" | "timestamp">) => {
    // Simulate API call
    const newDefect: Defect = {
      ...defectData,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    }

    setDefects((prev) => [...prev, newDefect])
    setShowForm(false)
    setSelectedLocation(null)
  }

  const handleFileUpload = async (data: any[]) => {
    // Process uploaded defect data
    const newDefects: Defect[] = data.map((item) => ({
      id: Date.now().toString() + Math.random(),
      coordinates: item.coordinates,
      defectType: item.defectType,
      severity: item.severity || "medium",
      notes: `Uploaded from vehicle ${item.vehicle_id}`,
      timestamp: item.timestamp,
      vehicleId: item.vehicle_id,
    }))

    setDefects((prev) => [...prev, ...newDefects])
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Road Metrics Platform...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <MapPin className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">RoadMetrics AI</h1>
                <p className="text-sm text-gray-600">Road Condition Reporting Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {defects.length} Defects Reported
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="map" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="map">Interactive Map</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="upload">Data Upload</TabsTrigger>
            <TabsTrigger value="api">API Docs</TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MapPin className="h-5 w-5" />
                      <span>Road Condition Map</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Suspense
                      fallback={
                        <div className="h-96 bg-gray-100 flex items-center justify-center">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                            <p className="text-gray-600">Loading map...</p>
                          </div>
                        </div>
                      }
                    >
                      <InteractiveMap defects={defects} onMapClick={handleMapClick} />
                    </Suspense>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                {showForm && selectedLocation && (
                  <Suspense fallback={<div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>}>
                    <DefectForm
                      coordinates={selectedLocation}
                      onSubmit={handleDefectSubmit}
                      onCancel={() => {
                        setShowForm(false)
                        setSelectedLocation(null)
                      }}
                    />
                  </Suspense>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Reports</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {defects
                      .slice(-5)
                      .reverse()
                      .map((defect) => (
                        <div key={defect.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium capitalize">{defect.defectType.replace("_", " ")}</span>
                            <Badge
                              variant={
                                defect.severity === "critical"
                                  ? "destructive"
                                  : defect.severity === "high"
                                    ? "destructive"
                                    : defect.severity === "medium"
                                      ? "default"
                                      : "secondary"
                              }
                            >
                              {defect.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            {defect.coordinates[1].toFixed(4)}, {defect.coordinates[0].toFixed(4)}
                          </p>
                          <p className="text-xs text-gray-500">{new Date(defect.timestamp).toLocaleDateString()}</p>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <Suspense
              fallback={
                <div className="h-96 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-8 w-8 text-gray-400" />
                </div>
              }
            >
              <Analytics defects={defects} />
            </Suspense>
          </TabsContent>

          <TabsContent value="upload">
            <Suspense
              fallback={
                <div className="h-64 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
                  <Upload className="h-8 w-8 text-gray-400" />
                </div>
              }
            >
              <FileUpload onUpload={handleFileUpload} />
            </Suspense>
          </TabsContent>

          <TabsContent value="api">
            <Card>
              <CardHeader>
                <CardTitle>API Documentation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">POST /api/defects</h3>
                  <p className="text-sm text-gray-600 mb-2">Submit a new road defect report</p>
                  <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto">
                    {`{
  "coordinates": [77.5946, 12.9716],
  "defectType": "pothole",
  "severity": "high",
  "notes": "Large pothole affecting traffic"
}`}
                  </pre>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">GET /api/defects</h3>
                  <p className="text-sm text-gray-600 mb-2">Retrieve all reported defects</p>
                  <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto">
                    {`[
  {
    "id": "1",
    "coordinates": [77.5946, 12.9716],
    "defectType": "pothole",
    "severity": "high",
    "timestamp": "2024-01-15T10:30:00Z"
  }
]`}
                  </pre>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">POST /api/upload</h3>
                  <p className="text-sm text-gray-600 mb-2">Bulk upload defect data from JSON file</p>
                  <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto">
                    {`{
  "vehicle_id": "R123",
  "timestamp": "2025-05-24T09:15:00Z",
  "coordinates": [12.9716, 77.5946],
  "defectType": "minor_pothole"
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

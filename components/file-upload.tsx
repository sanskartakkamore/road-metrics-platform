"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react"

interface FileUploadProps {
  onUpload: (data: any[]) => void
}

export default function FileUpload({ onUpload }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "processing" | "success" | "error">("idle")
  const [uploadedData, setUploadedData] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith(".json")) {
      setUploadStatus("error")
      return
    }

    setUploadStatus("processing")

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      // Validate data structure
      const validatedData = Array.isArray(data) ? data : [data]
      const processedData = validatedData.map((item) => ({
        vehicle_id: item.vehicle_id || `V${Math.random().toString(36).substr(2, 9)}`,
        timestamp: item.timestamp || new Date().toISOString(),
        coordinates: item.coordinates || [77.5946 + (Math.random() - 0.5) * 0.1, 12.9716 + (Math.random() - 0.5) * 0.1],
        defectType: item.defectType || "pothole",
        severity: item.severity || "medium",
      }))

      setUploadedData(processedData)
      setUploadStatus("success")
      onUpload(processedData)
    } catch (error) {
      console.error("Error processing file:", error)
      setUploadStatus("error")
    }
  }

  const generateSampleData = () => {
    const sampleData = [
      {
        vehicle_id: "R123",
        timestamp: "2025-01-24T09:15:00Z",
        coordinates: [77.5946, 12.9716],
        defectType: "minor_pothole",
        severity: "medium",
      },
      {
        vehicle_id: "R124",
        timestamp: "2025-01-24T10:30:00Z",
        coordinates: [77.6099, 12.9279],
        defectType: "crack",
        severity: "high",
      },
      {
        vehicle_id: "R125",
        timestamp: "2025-01-24T11:45:00Z",
        coordinates: [77.5833, 12.9667],
        defectType: "pothole",
        severity: "critical",
      },
    ]

    const blob = new Blob([JSON.stringify(sampleData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "sample-road-defects.json"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Bulk Data Upload</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : uploadStatus === "success"
                  ? "border-green-500 bg-green-50"
                  : uploadStatus === "error"
                    ? "border-red-500 bg-red-50"
                    : "border-gray-300 hover:border-gray-400"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileSelect} className="hidden" />

            {uploadStatus === "processing" && (
              <div className="space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600">Processing file...</p>
              </div>
            )}

            {uploadStatus === "success" && (
              <div className="space-y-4">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
                <div>
                  <p className="text-green-600 font-medium">Upload successful!</p>
                  <p className="text-sm text-gray-600">Processed {uploadedData.length} defect records</p>
                </div>
              </div>
            )}

            {uploadStatus === "error" && (
              <div className="space-y-4">
                <AlertCircle className="h-12 w-12 text-red-600 mx-auto" />
                <div>
                  <p className="text-red-600 font-medium">Upload failed</p>
                  <p className="text-sm text-gray-600">Please check your JSON file format and try again</p>
                </div>
              </div>
            )}

            {uploadStatus === "idle" && (
              <div className="space-y-4">
                <FileText className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-gray-900">Drop your JSON file here</p>
                  <p className="text-gray-600">or click to browse</p>
                </div>
              </div>
            )}

            {uploadStatus !== "processing" && (
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="mt-4"
                variant={uploadStatus === "success" ? "outline" : "default"}
              >
                {uploadStatus === "success" ? "Upload Another File" : "Select File"}
              </Button>
            )}
          </div>

          <div className="mt-4 flex justify-between items-center">
            <p className="text-sm text-gray-600">Supported format: JSON files with defect data</p>
            <Button variant="outline" onClick={generateSampleData}>
              Download Sample
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upload History */}
      {uploadedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recently Uploaded Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploadedData.slice(0, 5).map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium capitalize">{item.defectType.replace("_", " ")}</p>
                    <p className="text-sm text-gray-600">
                      Vehicle: {item.vehicle_id} | {item.coordinates[1].toFixed(4)}, {item.coordinates[0].toFixed(4)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.severity === "critical"
                          ? "bg-red-100 text-red-800"
                          : item.severity === "high"
                            ? "bg-red-100 text-red-700"
                            : item.severity === "medium"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                      }`}
                    >
                      {item.severity}
                    </span>
                  </div>
                </div>
              ))}
              {uploadedData.length > 5 && (
                <p className="text-sm text-gray-600 text-center">And {uploadedData.length - 5} more records...</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, X } from "lucide-react"
import type { Defect } from "@/app/page"

interface DefectFormProps {
  coordinates: [number, number]
  onSubmit: (defect: Omit<Defect, "id" | "timestamp">) => void
  onCancel: () => void
}

const DEFECT_TYPES = [
  "pothole",
  "crack",
  "minor_pothole",
  "surface_damage",
  "road_marking_fade",
  "debris",
  "water_damage",
]

export default function DefectForm({ coordinates, onSubmit, onCancel }: DefectFormProps) {
  const [formData, setFormData] = useState({
    defectType: "",
    severity: "medium" as "low" | "medium" | "high" | "critical",
    notes: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.defectType) return

    setIsSubmitting(true)

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    onSubmit({
      coordinates,
      defectType: formData.defectType,
      severity: formData.severity,
      notes: formData.notes || undefined,
    })

    setIsSubmitting(false)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <span>Report Defect</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-600">
          Location: {coordinates[1].toFixed(4)}, {coordinates[0].toFixed(4)}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="defectType">Defect Type *</Label>
            <Select
              value={formData.defectType}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, defectType: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select defect type" />
              </SelectTrigger>
              <SelectContent>
                {DEFECT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="severity">Severity</Label>
            <Select
              value={formData.severity}
              onValueChange={(value: "low" | "medium" | "high" | "critical") =>
                setFormData((prev) => ({ ...prev, severity: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Optional description of the defect..."
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex space-x-2">
            <Button type="submit" disabled={!formData.defectType || isSubmitting} className="flex-1">
              {isSubmitting ? "Submitting..." : "Report Defect"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

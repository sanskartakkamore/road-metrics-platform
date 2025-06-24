"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, TrendingUp, MapPin, AlertTriangle } from "lucide-react"
import type { Defect } from "@/app/page"

interface AnalyticsProps {
  defects: Defect[]
}

export default function Analytics({ defects }: AnalyticsProps) {
  const analytics = useMemo(() => {
    const totalDefects = defects.length

    // Count by type
    const typeCount = defects.reduce(
      (acc, defect) => {
        acc[defect.defectType] = (acc[defect.defectType] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    // Count by severity
    const severityCount = defects.reduce(
      (acc, defect) => {
        acc[defect.severity] = (acc[defect.severity] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    // Most common type
    const mostCommonType = Object.entries(typeCount).reduce(
      (a, b) => (typeCount[a[0]] > typeCount[b[0]] ? a : b),
      ["none", 0],
    )

    // Recent activity (last 7 days)
    const recentDefects = defects.filter((defect) => {
      const defectDate = new Date(defect.timestamp)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return defectDate >= weekAgo
    }).length

    // Area analysis (simplified - group by coordinate proximity)
    const areaAnalysis = defects.reduce(
      (acc, defect) => {
        const area = `${Math.floor(defect.coordinates[0] * 100) / 100}, ${Math.floor(defect.coordinates[1] * 100) / 100}`
        acc[area] = (acc[area] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      totalDefects,
      typeCount,
      severityCount,
      mostCommonType,
      recentDefects,
      areaAnalysis,
    }
  }, [defects])

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Defects</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalDefects}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Most Common</p>
                <p className="text-2xl font-bold text-gray-900 capitalize">
                  {analytics.mostCommonType[0].replace("_", " ")}
                </p>
                <p className="text-sm text-gray-500">{analytics.mostCommonType[1]} reports</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recent Activity</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.recentDefects}</p>
                <p className="text-sm text-gray-500">Last 7 days</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical Issues</p>
                <p className="text-2xl font-bold text-red-600">{analytics.severityCount.critical || 0}</p>
                <p className="text-sm text-gray-500">Require immediate attention</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Defect Types Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Defect Types Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.typeCount).map(([type, count]) => {
                const percentage = (count / analytics.totalDefects) * 100
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{type.replace("_", " ")}</span>
                      <span className="font-medium">
                        {count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Severity Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Severity Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.severityCount).map(([severity, count]) => {
                const percentage = (count / analytics.totalDefects) * 100
                const getColor = (sev: string) => {
                  switch (sev) {
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
                  <div key={severity} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{severity}</span>
                      <span className="font-medium">
                        {count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${getColor(severity)} h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Area Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Frequency by Area</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(analytics.areaAnalysis)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 6)
              .map(([area, count]) => (
                <div key={area} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{count} defects</p>
                      <p className="text-sm text-gray-600">Area: {area}</p>
                    </div>
                    <div className="text-right">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-red-600 font-bold text-sm">{count}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

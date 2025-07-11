"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { apiClient } from "@/lib/api-client"
import { DEVICE_STATISTICS } from "@/types/dashboard.type"
import { Loader2 } from "lucide-react"

interface DeviceData {
  name: string
  value: number
  color: string
}

export default function DeviceStatusPieChart() {
  const [deviceData, setDeviceData] = useState<DeviceData[]>([])
  const [totalDevices, setTotalDevices] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDeviceStatistics = async () => {
      try {
        setIsLoading(true)
        setError(null)
        console.log("🔄 Fetching device statistics for device status chart")

        const response = await apiClient.dashboard.getDeviceStatistics()
        console.log("📦 Device status API response:", response)

        // Handle different response structures
        let deviceStats: DEVICE_STATISTICS

        if (response.data) {
          deviceStats = response.data
        } else if (response) {
          deviceStats = response as any
        } else {
          throw new Error("Invalid response structure")
        }

        console.log("📊 Device statistics extracted:", deviceStats)

        // Validate that we have the required fields
        if (typeof deviceStats.totalInUseDevices === "undefined") {
          console.error("❌ Missing required fields in device statistics:", deviceStats)
          throw new Error("Invalid device statistics format")
        }

        // Map API data to chart format
        const chartData: DeviceData[] = [
          { name: "Hoạt động", value: deviceStats.totalInUseDevices || 0, color: "#22c55e" },
          { name: "Ngừng hoạt động", value: deviceStats.totalDecommissionedDevices || 0, color: "#ef4444" },
          { name: "Bảo hành", value: deviceStats.totalInWarrantyDevices || 0, color: "#8b5cf6" },
          { name: "Sửa chữa", value: deviceStats.totalInRepairDevices || 0, color: "#f59e0b" },
          { name: "Trong kho", value: deviceStats.totalActiveDevices || 0, color: "#6b7280" },
        ]

        // Calculate total devices from all categories
        const total = chartData.reduce((sum, item) => sum + item.value, 0)

        setDeviceData(chartData)
        setTotalDevices(total)

        console.log("✅ Device status data processed:", { chartData, total })
      } catch (error: any) {
        console.error("❌ Error fetching device statistics:", error)
        setError(`Failed to load device statistics: ${error.message || "Unknown error"}`)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDeviceStatistics()
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading device status...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8 text-center">
          <div>
            <p className="text-red-500 mb-2">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-blue-500 underline text-sm"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const isOddNumber = deviceData.length % 2 !== 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trạng thái thiết bị</CardTitle>
        <CardDescription>
          Phân bổ {totalDevices} thiết bị theo trạng thái
        </CardDescription>
      </CardHeader>
      <CardContent>
        {totalDevices > 0 ? (
          <ChartContainer
            config={{
              inStock: { label: "Trong kho", color: "#6b7280" },
              active: { label: "Hoạt động", color: "#22c55e" },
              inactive: { label: "Ngừng hoạt động", color: "#ef4444" },
              repair: { label: "Sửa chữa", color: "#f59e0b" },
              warranty: { label: "Bảo hành", color: "#8b5cf6" },
            }}
            className="h-[250px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deviceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={1500}
                >
                  {deviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.color} strokeWidth={2} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} animationDuration={300} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            No device data available
          </div>
        )}

        {/* Updated Legend - 2 Column Grid with Centered Last Row for Odd Numbers */}
        <div className="mt-4">
          <div className="grid grid-cols-2 gap-2">
            {deviceData.slice(0, -1).map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg border bg-muted/20">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                  <span className="font-medium text-sm">{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold">{item.value}</span>
                  <div className="text-xs text-muted-foreground">
                    {totalDevices > 0 ? ((item.value / totalDevices) * 100).toFixed(1) : 0}%
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Last item - centered if odd number of total items */}
          {deviceData.length > 0 && (
            <div className={`mt-2 ${isOddNumber ? 'flex justify-center' : 'grid grid-cols-2 gap-2'}`}>
              <div className={`flex items-center justify-between p-2 rounded-lg border bg-muted/20 ${isOddNumber ? 'w-1/2' : ''}`}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: deviceData[deviceData.length - 1].color }} />
                  <span className="font-medium text-sm">{deviceData[deviceData.length - 1].name}</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold">{deviceData[deviceData.length - 1].value}</span>
                  <div className="text-xs text-muted-foreground">
                    {totalDevices > 0 ? ((deviceData[deviceData.length - 1].value / totalDevices) * 100).toFixed(1) : 0}%
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
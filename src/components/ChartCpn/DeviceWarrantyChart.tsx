"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Bar, Cell } from "recharts"
import { apiClient } from "@/lib/api-client"
import { DEVICE_STATISTICS } from "@/types/dashboard.type"
import { Loader2 } from "lucide-react"

interface WarrantyData {
  status: string
  count: number
  color: string
}

export default function DeviceWarrantyChart() {
  const [warrantyData, setWarrantyData] = useState<WarrantyData[]>([])
  const [totalDevices, setTotalDevices] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDeviceStatistics = async () => {
      try {
        setIsLoading(true)
        setError(null)
        console.log("🔄 Fetching device statistics for warranty chart")

        const response = await apiClient.dashboard.getDeviceStatistics()
        console.log("📦 Device warranty API response:", response)

        // Handle different response structures
        let deviceStats: DEVICE_STATISTICS

        if (response.data) {
          deviceStats = response.data
        } else if (response) {
          deviceStats = response as any
        } else {
          throw new Error("Invalid response structure")
        }

        console.log("📊 Device warranty statistics extracted:", deviceStats)

        // Validate that we have the required fields
        if (typeof deviceStats.totalDevicesWarrantyValid === "undefined") {
          console.error("❌ Missing required fields in device statistics:", deviceStats)
          throw new Error("Invalid device statistics format")
        }

        // Map API data to chart format
        const chartData: WarrantyData[] = [
          { 
            status: "Còn bảo hành", 
            count: deviceStats.totalDevicesWarrantyValid || 0, 
            color: "#22c55e" 
          },
          { 
            status: "Hết bảo hành", 
            count: deviceStats.totalDevicesWarrantyExpired || 0, 
            color: "#ef4444" 
          },
        ]

        // Calculate total devices with warranty info
        const total = chartData.reduce((sum, item) => sum + item.count, 0)

        setWarrantyData(chartData)
        setTotalDevices(total)

        console.log("✅ Device warranty data processed:", { chartData, total })
      } catch (error: any) {
        console.error("❌ Error fetching device warranty statistics:", error)
        setError(`Failed to load warranty statistics: ${error.message || "Unknown error"}`)
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
          <span className="ml-2">Loading warranty data...</span>
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tình trạng bảo hành</CardTitle>
        <CardDescription>
          Tổng {totalDevices} thiết bị theo tình trạng bảo hành
        </CardDescription>
      </CardHeader>
      <CardContent>
        {totalDevices > 0 ? (
          <ChartContainer
            config={{
              count: { label: "Số lượng", color: "hsl(var(--chart-1))" },
            }}
            className="h-[250px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={warrantyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="count" 
                  radius={[4, 4, 0, 0]}
                >
                  {warrantyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            No warranty data available
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-3">
          {warrantyData.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                <span className="font-medium text-sm">{item.status}</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold">{item.count}</span>
                <div className="text-xs text-muted-foreground">
                  {totalDevices > 0 ? ((item.count / totalDevices) * 100).toFixed(1) : 0}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
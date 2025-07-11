"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Bar } from "recharts"
import { apiClient } from "@/lib/api-client"
import { TOP_ERROR_DEVICE } from "@/types/dashboard.type"
import { toast } from "react-toastify"

// Fallback data in case API fails
const fallbackData = [
    { device: "Máy 1", errors: 28, fullName: "Máy Printing X-5000" },
    { device: "Máy 2", errors: 24, fullName: "Máy Laser CNC Model L330" },
    { device: "Máy 3", errors: 19, fullName: "Máy Drilling Auto DR-47" },
    { device: "Máy 4", errors: 16, fullName: "Máy Assembly Line A210" },
    { device: "Máy 5", errors: 13, fullName: "Máy Packaging Unit P100" },
]

export default function TopErrorDevicesChart() {
    const [chartData, setChartData] = useState(fallbackData)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [useFallback, setUseFallback] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true)
                setError(null)
                console.log("🔄 Fetching top error devices data...")

                const response = await apiClient.dashboard.getTopErrorDevices()
                console.log("✅ Top error devices data received:", response)

                // Extract data from response with flexible handling
                let deviceData: TOP_ERROR_DEVICE[] = []

                if (response?.data && Array.isArray(response.data)) {
                    deviceData = response.data
                } else if (Array.isArray(response)) {
                    deviceData = response
                } else {
                    console.warn("⚠️ Unexpected response format:", response)
                    setUseFallback(true)
                    return
                }

                if (deviceData.length === 0) {
                    console.warn("⚠️ Empty data array received")
                    setUseFallback(true)
                    return
                }

                const transformedData = deviceData.map((item, index) => ({
                    device: `Máy ${index + 1}`,
                    deviceId: item.deviceId,
                    fullName: item.deviceName || "Unknown Device",
                    errors: item.errorCount || 0,
                }))

                console.log("📊 Transformed chart data with simplified labels:", transformedData)
                setChartData(transformedData)
                setUseFallback(false)
            } catch (error) {
                console.error("❌ Error fetching top error devices:", error)
                setError("Failed to load device error data")
                toast.error("Failed to load device error data")
                setUseFallback(true)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [])

    const getYAxisDomain = () => {
        if (!chartData || chartData.length === 0) return [0, 10]
        
        const maxValue = Math.max(...chartData.map(item => item.errors))
        const maxDomain = Math.max(maxValue, 3)
        const roundedMax = Math.ceil(maxDomain)
        
        return [0, roundedMax]
    }

    const getYAxisTicks = () => {
        const [min, max] = getYAxisDomain()
        const ticks = []
        
        let step = 1
        if (max > 20) step = 5
        else if (max > 10) step = 2
        else if (max > 5) step = 1
        else step = 1
        
        for (let i = min; i <= max; i += step) {
            ticks.push(i)
        }
        
        if (!ticks.includes(max)) {
            ticks.push(max)
        }
        
        return ticks
    }

    const yAxisDomain = getYAxisDomain()
    const yAxisTicks = getYAxisTicks()

    return (
        <Card className="flex-1">
            <CardHeader>
                <CardTitle>Thống kê các thiết bị gặp lỗi nhiều</CardTitle>
                <CardDescription className="flex items-center justify-between">
                    <span>Thống kê lỗi máy</span>
                    {useFallback && (
                        <span className="text-xs text-amber-500">(using sample data)</span>
                    )}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="h-[200px] w-full flex items-center justify-center">
                        <div className="animate-pulse text-muted-foreground">
                            Loading chart data...
                        </div>
                    </div>
                ) : error ? (
                    <div className="h-[200px] w-full flex flex-col items-center justify-center text-red-400">
                        <div>{error}</div>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-2 text-sm text-blue-500 hover:text-blue-700"
                        >
                            Refresh
                        </button>
                    </div>
                ) : (
                    <ChartContainer
                        config={{
                            errors: { label: "Số lỗi", color: "hsl(var(--chart-1))" },
                        }}
                        className="h-[200px] w-full"
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="device"
                                    tick={{ fontSize: 12 }}
                                    interval={0} // Force display all ticks
                                />
                                <YAxis 
                                    domain={yAxisDomain}
                                    ticks={yAxisTicks}
                                    tick={{ fontSize: 12 }}
                                    allowDecimals={false}
                                    type="number"
                                />
                                <ChartTooltip
                                    content={<ChartTooltipContent />}
                                    labelFormatter={(label, payload) => {
                                        if (payload && payload.length > 0) {
                                            // Show the full device name in tooltip
                                            return payload[0].payload.fullName || label
                                        }
                                        return label
                                    }}
                                />
                                <Bar
                                    dataKey="errors"
                                    fill="var(--color-errors)"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    )
}

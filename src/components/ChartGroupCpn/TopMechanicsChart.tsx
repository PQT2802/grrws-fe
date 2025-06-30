"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Trophy, Medal, Award } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { TOP_MECHANIC } from "@/types/dashboard.type"
import { toast } from "react-toastify"

// Fallback data in case API fails
const fallbackData = [
    {
        id: 1,
        name: "Staff 5",
        tasksCompleted: 11,
        rank: 1,
        avatar: "NA",
        color: "bg-yellow-100 text-yellow-800",
        icon: Trophy,
        iconColor: "text-yellow-600",
    },
    {
        id: 2,
        name: "Staff 1",
        tasksCompleted: 9,
        rank: 2,
        avatar: "TB",
        color: "bg-gray-100 text-gray-800",
        icon: Medal,
        iconColor: "text-gray-600",
    },
    {
        id: 3,
        name: "Staff 3",
        tasksCompleted: 4,
        rank: 3,
        avatar: "LC",
        color: "bg-orange-100 text-orange-800",
        icon: Award,
        iconColor: "text-orange-600",
    },
]

const rankIcons = [
    { icon: Trophy, color: "bg-yellow-100 text-yellow-800", iconColor: "text-yellow-600" },
    { icon: Medal, color: "bg-gray-100 text-gray-800", iconColor: "text-gray-600" },
    { icon: Award, color: "bg-orange-100 text-orange-800", iconColor: "text-orange-600" },
]

export default function TopMechanicsChart() {
    const [chartData, setChartData] = useState(fallbackData)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [useFallback, setUseFallback] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true)
                setError(null)
                console.log("🔄 Fetching top mechanics data...")

                const response = await apiClient.dashboard.getTopMechanics()
                console.log("✅ Top mechanics data received:", response)

                // Extract data from response with flexible handling
                let mechanicsData: TOP_MECHANIC[] = []

                if (response?.data && Array.isArray(response.data)) {
                    // Case 1: { data: [...] }
                    mechanicsData = response.data
                } else if (Array.isArray(response)) {
                    // Case 2: Direct array response
                    mechanicsData = response
                } else {
                    // Case 3: Unexpected response format
                    console.warn("⚠️ Unexpected response format:", response)
                    setUseFallback(true)
                    return
                }

                // Check if we actually have data
                if (mechanicsData.length === 0) {
                    console.warn("⚠️ Empty data array received")
                    setUseFallback(true)
                    return
                }

                // Transform API data to match chart format
                const transformedData = mechanicsData.map((mechanic, index) => {
                    // Generate initials from name
                    let avatar = "??"
                    if (mechanic.mechanicName) {
                        avatar = mechanic.mechanicName
                            .split(" ")
                            .map((part) => part[0])
                            .join("")
                            .substring(0, 2)
                            .toUpperCase()
                    }

                    return {
                        id: typeof mechanic.mechanicId === 'number' ? mechanic.mechanicId : index + 1,
                        name: mechanic.mechanicName || "Unknown Mechanic",
                        tasksCompleted: mechanic.completedTaskCount || 0,
                        rank: index + 1,
                        avatar: avatar,
                        ...(rankIcons[index] || rankIcons[2]), // Fallback to bronze for any extras
                    }
                })

                console.log("📊 Transformed mechanics data:", transformedData)
                setChartData(transformedData)
                setUseFallback(false)
            } catch (error) {
                console.error("❌ Error fetching top mechanics:", error)
                setError("Failed to load top mechanics data")
                toast.error("Failed to load top mechanics data")
                setUseFallback(true)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [])

    return (
        <Card className="flex-1">
            <CardHeader>
                <CardTitle>Các thợ máy xuất sắc</CardTitle>
                <CardDescription className="flex items-center justify-between">
                    <span>Số công việc đã hoàn thành</span>
                    {useFallback && (
                        <span className="text-xs text-amber-500">(using sample data)</span>
                    )}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="h-[200px] flex items-center justify-center">
                        <div className="animate-pulse text-muted-foreground">Loading chart data...</div>
                    </div>
                ) : error ? (
                    <div className="h-[200px] flex flex-col items-center justify-center text-red-400">
                        <div>{error}</div>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-2 text-sm text-blue-500 hover:text-blue-700"
                        >
                            Refresh
                        </button>
                    </div>
                ) : (
                    <div className="h-[200px] flex flex-col justify-center space-y-4">
                        {chartData.length === 0 ? (
              <div className="text-center text-muted-foreground">No mechanic data available</div>
            ) : (
              chartData.map((mechanic) => {
                const IconComponent = mechanic.icon
                return (
                  <div
                    key={mechanic.id}
                    className="flex items-center justify-between p-2 rounded-lg border bg-muted/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10 bg-blue-100">
                          <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold text-sm">
                            {mechanic.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`absolute -top-1 -right-1 w-5 h-5 rounded-full ${mechanic.color} flex items-center justify-center`}
                        >
                          <IconComponent className={`h-2.5 w-2.5 ${mechanic.iconColor}`} />
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{mechanic.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Rank #{mechanic.rank}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-blue-600">
                        {mechanic.tasksCompleted}
                      </div>
                      <div className="text-xs text-muted-foreground">Công việc</div>
                    </div>
                  </div>
                )
              })
            )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

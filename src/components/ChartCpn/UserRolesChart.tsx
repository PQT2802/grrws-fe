"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { apiClient } from "@/lib/api-client"
import { USER_COUNT_BY_ROLE } from "@/types/dashboard.type"
import { Loader2 } from "lucide-react"

interface UserRoleData {
  name: string
  value: number
  color: string
}

export default function UserRolesChart() {
  const [userRolesData, setUserRolesData] = useState<UserRoleData[]>([])
  const [totalUsers, setTotalUsers] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserCountByRole = async () => {
      try {
        setIsLoading(true)
        setError(null)
        console.log("🔄 Fetching user count by role for user roles chart")

        const response = await apiClient.dashboard.getUserCountByRole()
        console.log("📦 User roles API response:", response)

        // Handle different response structures
        let userStats: USER_COUNT_BY_ROLE

        if (response.data) {
          userStats = response.data
        } else if (response) {
          userStats = response as any
        } else {
          throw new Error("Invalid response structure")
        }

        console.log("📊 User count statistics extracted:", userStats)

        // Validate that we have the required fields
        if (typeof userStats.totalUsers === "undefined") {
          console.error("❌ Missing required fields in user statistics:", userStats)
          throw new Error("Invalid user statistics format")
        }

        // Map API data to chart format
        const chartData: UserRoleData[] = [
          { name: "Trưởng phòng may", value: userStats.totalHeadsOfDepartment || 0, color: "#f59e0b" },
          { name: "Trưởng phòng kĩ thuật", value: userStats.totalHeadsOfTechnical || 0, color: "#22c55e" },
          { name: "Thợ máy", value: userStats.totalMechanics || 0, color: "#3b82f6" },
          { name: "Thủ kho", value: userStats.totalStockKeepers || 0, color: "#8b5cf6" },
          { name: "Quản trị viên", value: userStats.totalAdmins || 0, color: "#ef4444" },
        ]

        setUserRolesData(chartData)
        setTotalUsers(userStats.totalUsers)

        console.log("✅ User roles data processed:", { chartData, total: userStats.totalUsers })
      } catch (error: any) {
        console.error("❌ Error fetching user count by role:", error)
        setError(`Failed to load user statistics: ${error.message || "Unknown error"}`)
        
        // Fallback to static data if API fails
        const fallbackData: UserRoleData[] = [
          { name: "Admin", value: 5, color: "#ef4444" },
          { name: "Head Department", value: 12, color: "#f59e0b" },
          { name: "Head of Technical", value: 8, color: "#22c55e" },
          { name: "Mechanic", value: 45, color: "#3b82f6" },
          { name: "Stock Keeper", value: 18, color: "#8b5cf6" },
        ]
        setUserRolesData(fallbackData)
        setTotalUsers(88)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserCountByRole()
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading user roles...</span>
        </CardContent>
      </Card>
    )
  }

  // Check if we have an odd number of items to center the last row
  const isOddNumber = userRolesData.length % 2 !== 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Phân bổ người dùng theo vai trò</CardTitle>
        <CardDescription>Tổng số {totalUsers} người dùng trong hệ thống</CardDescription>
      </CardHeader>
      <CardContent>
        {totalUsers > 0 ? (
          <ChartContainer
            config={{
              admin: { label: "Admin", color: "#ef4444" },
              headDepartment: { label: "Head Department", color: "#f59e0b" },
              headTechnical: { label: "Head of Technical", color: "#22c55e" },
              mechanic: { label: "Mechanic", color: "#3b82f6" },
              stockKeeper: { label: "Stock Keeper", color: "#8b5cf6" },
            }}
            className="h-[250px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userRolesData}
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
                  {userRolesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.color} strokeWidth={2} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} animationDuration={300} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            No user data available
          </div>
        )}
        
        {/* Updated Legend - 2 Column Grid with Centered Last Row for Odd Numbers */}
        <div className="mt-4">
          <div className="grid grid-cols-2 gap-2">
            {userRolesData.slice(0, -1).map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg border bg-muted/20">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                  <span className="font-medium text-sm">{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold">{item.value}</span>
                  <div className="text-xs text-muted-foreground">
                    {totalUsers > 0 ? ((item.value / totalUsers) * 100).toFixed(1) : 0}%
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Last item - centered if odd number of total items */}
          {userRolesData.length > 0 && (
            <div className={`mt-2 ${isOddNumber ? 'flex justify-center' : 'grid grid-cols-2 gap-2'}`}>
              <div className={`flex items-center justify-between p-2 rounded-lg border bg-muted/20 ${isOddNumber ? 'w-1/2' : ''}`}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: userRolesData[userRolesData.length - 1].color }} />
                  <span className="font-medium text-sm">{userRolesData[userRolesData.length - 1].name}</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold">{userRolesData[userRolesData.length - 1].value}</span>
                  <div className="text-xs text-muted-foreground">
                    {totalUsers > 0 ? ((userRolesData[userRolesData.length - 1].value / totalUsers) * 100).toFixed(1) : 0}%
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

"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Trophy, Medal, Award } from "lucide-react"

const topMechanicsData = [
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

export default function TopMechanicsChart() {
  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>Top 3 thợ máy xuất sắc</CardTitle>
        <CardDescription>Số task đã hoàn thành</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] flex flex-col justify-center space-y-4">
          {topMechanicsData.map((mechanic) => {
            const IconComponent = mechanic.icon
            return (
              <div key={mechanic.id} className="flex items-center justify-between p-2 rounded-lg border bg-muted/20">
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
                    <div className="text-xs text-muted-foreground">Rank #{mechanic.rank}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-blue-600">{mechanic.tasksCompleted}</div>
                  <div className="text-xs text-muted-foreground">tasks</div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

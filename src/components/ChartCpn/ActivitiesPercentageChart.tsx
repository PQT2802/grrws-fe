"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, TrendingUp, TrendingDown, Activity } from "lucide-react"

export default function ActivitiesPercentageChart() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Activities Percentage</CardTitle>
        <Button variant="outline" size="sm" className="gap-2">
          Week
          <ChevronDown className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {/* Main chart area with increased height */}
        <div className="relative h-[280px] flex items-center justify-center mb-6">
          {/* Large orange circle - 51% */}
          <div className="absolute w-48 h-48 rounded-full bg-orange-400 flex items-center justify-center text-white shadow-lg">
            <div className="text-center">
              <div className="text-3xl font-bold">51%</div>
              <div className="text-sm">Increase</div>
            </div>
          </div>

          {/* Medium purple circle - 31% */}
          <div className="absolute w-32 h-32 rounded-full bg-purple-600 flex items-center justify-center text-white -translate-x-24 translate-y-16 shadow-lg">
            <div className="text-center">
              <div className="text-xl font-bold">31%</div>
              <div className="text-xs">Increase</div>
            </div>
          </div>

          {/* Small green circle - 8% */}
          <div className="absolute w-20 h-20 rounded-full bg-emerald-400 flex items-center justify-center text-white translate-x-28 -translate-y-16 shadow-lg">
            <div className="text-center">
              <div className="text-sm font-bold">8%</div>
              <div className="text-xs">Decrease</div>
            </div>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 rounded-lg bg-muted/20 border">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Activity className="h-4 w-4 text-blue-500" />
              <TrendingUp className="h-3 w-3 text-green-500" />
            </div>
            <div className="text-2xl font-bold">251</div>
            <div className="text-sm text-muted-foreground">Operations</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/20 border">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Activity className="h-4 w-4 text-purple-500" />
              <TrendingUp className="h-3 w-3 text-green-500" />
            </div>
            <div className="text-2xl font-bold">198</div>
            <div className="text-sm text-muted-foreground">API Calls</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/20 border">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Activity className="h-4 w-4 text-red-500" />
              <TrendingDown className="h-3 w-3 text-red-500" />
            </div>
            <div className="text-2xl font-bold">21</div>
            <div className="text-sm text-muted-foreground">Errors</div>
          </div>
        </div>

        {/* Additional Performance Metrics */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/10">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-orange-400"></div>
              <span className="font-medium">System Performance</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-orange-600">94.2%</span>
              <div className="text-xs text-muted-foreground">Excellent</div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/10">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-purple-600"></div>
              <span className="font-medium">User Engagement</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-purple-600">87.5%</span>
              <div className="text-xs text-muted-foreground">Good</div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/10">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
              <span className="font-medium">Response Time</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-emerald-600">245ms</span>
              <div className="text-xs text-muted-foreground">Fast</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

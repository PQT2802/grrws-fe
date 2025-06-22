"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"

export default function ActivitiesPercentageChart() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
        <CardTitle>Activities Percentage</CardTitle>
        <Button variant="outline" size="sm" className="gap-2">
          Week
          <ChevronDown className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="relative h-[280px] flex items-center justify-center">
          {/* Large orange circle - 51% */}
          <div className="absolute w-48 h-48 rounded-full bg-orange-400 flex items-center justify-center text-white">
            <div className="text-center">
              <div className="text-3xl font-bold">51%</div>
              <div className="text-sm">Increase</div>
            </div>
          </div>

          {/* Medium purple circle - 31% */}
          <div className="absolute w-32 h-32 rounded-full bg-purple-600 flex items-center justify-center text-white -translate-x-24 translate-y-16">
            <div className="text-center">
              <div className="text-xl font-bold">31%</div>
              <div className="text-xs">Increase</div>
            </div>
          </div>

          {/* Small green circle - 8% */}
          <div className="absolute w-20 h-20 rounded-full bg-emerald-400 flex items-center justify-center text-white translate-x-28 -translate-y-16">
            <div className="text-center">
              <div className="text-sm font-bold">8%</div>
              <div className="text-xs">Decrease</div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center">
            <div className="text-2xl font-bold">251</div>
            <div className="text-sm text-muted-foreground">Operations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">198</div>
            <div className="text-sm text-muted-foreground">API Calls</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">21</div>
            <div className="text-sm text-muted-foreground">Errors</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { 
  Eye, 
  User, 
  Loader2, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  FileText, 
  ChevronDown, 
  ChevronRight,
  MapPin,
  Building
} from "lucide-react"
import { REQUEST_WITH_REPORT, REQUEST_ITEM } from "@/types/dashboard.type"

interface RequestWithReportListProps {
  requests: REQUEST_WITH_REPORT[]
  userCache: { [userId: string]: string }
  isLoading: boolean
  onViewRequest: (request: REQUEST_ITEM) => void
}

interface GroupedRequests {
  [areaName: string]: {
    [zoneName: string]: REQUEST_WITH_REPORT[]
  }
}

export default function RequestWithReportList({
  requests,
  userCache,
  isLoading,
  onViewRequest
}: RequestWithReportListProps) {
  const [expandedAreas, setExpandedAreas] = useState<{ [key: string]: boolean }>({})
  const [expandedZones, setExpandedZones] = useState<{ [key: string]: boolean }>({})

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const vietnamTime = new Date(date.getTime() + (7 * 60 * 60 * 1000))
    
    return vietnamTime.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Ho_Chi_Minh'
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'pending':
        return <AlertTriangle className="h-4 w-4" />
      case 'rejected':
        return <XCircle className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  // Group requests by Area and Zone
  const groupRequestsByAreaAndZone = (requests: REQUEST_WITH_REPORT[]): GroupedRequests => {
    const grouped: GroupedRequests = {}
    
    requests.forEach(request => {
      const areaName = request.areaName || 'Unknown Area'
      const zoneName = request.zoneName || 'Unknown Zone'
      
      if (!grouped[areaName]) {
        grouped[areaName] = {}
      }
      
      if (!grouped[areaName][zoneName]) {
        grouped[areaName][zoneName] = []
      }
      
      grouped[areaName][zoneName].push(request)
    })
    
    return grouped
  }

  const toggleArea = (areaName: string) => {
    setExpandedAreas(prev => ({
      ...prev,
      [areaName]: !prev[areaName]
    }))
  }

  const toggleZone = (areaName: string, zoneName: string) => {
    const zoneKey = `${areaName}-${zoneName}`
    setExpandedZones(prev => ({
      ...prev,
      [zoneKey]: !prev[zoneKey]
    }))
  }

  const groupedRequests = groupRequestsByAreaAndZone(requests)

  // Calculate totals
  const getAreaTotal = (areaRequests: { [zoneName: string]: REQUEST_WITH_REPORT[] }) => {
    return Object.values(areaRequests).reduce((total, zoneRequests) => total + zoneRequests.length, 0)
  }

  const getZoneTotal = (zoneRequests: REQUEST_WITH_REPORT[]) => {
    return zoneRequests.length
  }

  // Auto-expand first area and zone on load
  useEffect(() => {
    if (Object.keys(groupedRequests).length > 0 && Object.keys(expandedAreas).length === 0) {
      const firstArea = Object.keys(groupedRequests)[0]
      const firstZone = Object.keys(groupedRequests[firstArea])[0]
      
      setExpandedAreas({ [firstArea]: true })
      setExpandedZones({ [`${firstArea}-${firstZone}`]: true })
    }
  }, [groupedRequests, expandedAreas])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading requests with reports...</span>
        </CardContent>
      </Card>
    )
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Không có yêu cầu với báo cáo nào được tìm thấy</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {Object.entries(groupedRequests).map(([areaName, areaRequests]) => (
        <Card key={areaName} className="border-l-4 border-l-green-500">
          <Collapsible 
            open={expandedAreas[areaName]} 
            onOpenChange={() => toggleArea(areaName)}
          >
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5 text-green-600" />
                    <div>
                      <CardTitle className="text-lg">{areaName}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {getAreaTotal(areaRequests)} yêu cầu có báo cáo • {Object.keys(areaRequests).length} khu vực
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <FileText className="h-3 w-3 mr-1" />
                      {getAreaTotal(areaRequests)} có báo cáo
                    </Badge>
                    {expandedAreas[areaName] ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <CardContent className="pt-2">
                <div className="space-y-3">
                  {Object.entries(areaRequests).map(([zoneName, zoneRequests]) => (
                    <Card key={`${areaName}-${zoneName}`} className="border-l-4 border-l-emerald-400">
                      <Collapsible 
                        open={expandedZones[`${areaName}-${zoneName}`]} 
                        onOpenChange={() => toggleZone(areaName, zoneName)}
                      >
                        <CollapsibleTrigger asChild>
                          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <MapPin className="h-4 w-4 text-emerald-600" />
                                <div>
                                  <CardTitle className="text-base">{zoneName}</CardTitle>
                                  <p className="text-sm text-muted-foreground">
                                    {getZoneTotal(zoneRequests)} yêu cầu có báo cáo
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                  <FileText className="h-3 w-3 mr-1" />
                                  {getZoneTotal(zoneRequests)}
                                </Badge>
                                {expandedZones[`${areaName}-${zoneName}`] ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </div>
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent>
                          <CardContent className="pt-2">
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b bg-muted/30">
                                    <th className="px-4 py-3 text-left text-sm font-medium">Tiêu đề yêu cầu</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Người tạo</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Độ ưu tiên</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Trạng thái</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Ngày tạo</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium">Thao tác</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {zoneRequests.map((request) => (
                                    <tr key={request.id} className="border-b hover:bg-muted/20 transition-colors">
                                      <td className="px-4 py-3">
                                        <div className="font-medium text-sm">
                                          {request.requestTitle}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {request.deviceName} • {request.deviceCode}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                          <Avatar className="h-8 w-8">
                                            <AvatarFallback>
                                              <User className="h-4 w-4" />
                                            </AvatarFallback>
                                          </Avatar>
                                          <div>
                                            <div className="font-medium text-sm">
                                              {userCache[request.createdBy] || 'Loading...'}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                              {request.issues.length} vấn đề
                                            </div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3">
                                        <Badge 
                                          variant="secondary" 
                                          className={`${getPriorityColor(request.priority)} border-0`}
                                        >
                                          {request.priority}
                                        </Badge>
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                          {getStatusIcon(request.status)}
                                          <Badge 
                                            variant="secondary" 
                                            className={`${getStatusColor(request.status)} border-0`}
                                          >
                                            {request.status}
                                          </Badge>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 text-sm">
                                        {formatDate(request.createdDate)}
                                      </td>
                                      <td className="px-4 py-3 text-right">
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          onClick={() => onViewRequest(request)}
                                        >
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Collapsible>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}
    </div>
  )
}
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Eye, User, Loader2, CheckCircle, AlertTriangle, XCircle, FileText } from "lucide-react"
import { REQUEST_ITEM } from "@/types/dashboard.type"

interface UnifiedRequestListProps {
  requests: REQUEST_ITEM[]
  userCache: { [userId: string]: string }
  isLoading: boolean
  onViewRequest: (request: REQUEST_ITEM) => void
}

export default function UnifiedRequestList({
  requests,
  userCache,
  isLoading,
  onViewRequest
}: UnifiedRequestListProps) {
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

  const getReportStatus = (request: REQUEST_ITEM) => {
    const hasReport = request.reportId !== null && request.reportId !== undefined && request.reportId !== ''
    return hasReport ? (
      <Badge variant="secondary" className="bg-green-100 text-green-800 border-0">
        <FileText className="h-3 w-3 mr-1" />
        Có báo cáo
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-0">
        Chưa có báo cáo
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading all requests...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left">Người tạo</th>
                <th className="px-4 py-3 text-left">Tiêu đề yêu cầu</th>
                {/* <th className="px-4 py-3 text-left">Thiết bị</th> */}
                <th className="px-4 py-3 text-left">Độ ưu tiên</th>
                <th className="px-4 py-3 text-left">Trạng thái</th>
                <th className="px-4 py-3 text-left">Báo cáo</th>
                <th className="px-4 py-3 text-left">Ngày tạo</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Không có yêu cầu nào được tìm thấy
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr key={request.id} className="border-b hover:bg-muted/50">
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
                      <div className="font-medium text-sm">
                        {request.requestTitle}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {request.zoneName} - {request.areaName}
                      </div>
                    </td>
                    {/* <td className="px-4 py-3">
                      <div className="text-sm">{request.deviceName}</div>
                      <div className="text-xs text-muted-foreground">
                        {request.deviceCode}
                      </div>
                    </td> */}
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
                    <td className="px-4 py-3">
                      {getReportStatus(request)}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
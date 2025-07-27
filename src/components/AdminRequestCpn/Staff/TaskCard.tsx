'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  Clock,
  Eye,
  MoreHorizontal,
  User,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Pause,
  XCircle
} from "lucide-react";
import { STAFF_TASK } from "@/types/task.type";

interface TaskCardProps {
  task: STAFF_TASK;
  onViewDetails?: (task: STAFF_TASK) => void;
}

export default function TaskCard({ task, onViewDetails }: TaskCardProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'inprogress': case 'in-progress': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'completed': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'waitingforinstallation': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'paused': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'low': return 'bg-green-500/10 text-green-400 border-green-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'inprogress': case 'in-progress': return <RefreshCw className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      case 'waitingforinstallation': return <Pause className="h-4 w-4" />;
      case 'paused': return <Pause className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatVietnameseStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'pending': 'Đang chờ',
      'inprogress': 'Đang thực hiện',
      'in-progress': 'Đang thực hiện',
      'completed': 'Hoàn thành',
      'cancelled': 'Đã hủy',
      'waitingforinstallation': 'Chờ lắp đặt',
      'paused': 'Tạm dừng'
    };
    return statusMap[status.toLowerCase()] || status;
  };

  return (
    <Card className="hover:bg-muted/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm mb-1 truncate">{task.taskName}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {task.taskDescription}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 ml-2">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewDetails?.(task)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status and Priority Badges */}
        <div className="flex items-center gap-2 mb-3">
          <Badge className={`${getStatusColor(task.status)} flex items-center gap-1`}>
            {getStatusIcon(task.status)}
            {formatVietnameseStatus(task.status)}
          </Badge>
          <Badge className={getPriorityColor(task.priority)}>
            {task.priority}
          </Badge>
          {task.isUninstallDevice && (
            <Badge variant="outline" className="text-xs">
              Requires Uninstall
            </Badge>
          )}
        </div>

        {/* Assignment Info */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
          <User className="h-3 w-3" />
          <span>Assigned to: {task.assigneeName}</span>
        </div>

        {/* Timing Info */}
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Started: {formatDate(task.startTime)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Expected: {formatDate(task.expectedTime)}</span>
          </div>
          {task.endTime && (
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              <span>Completed: {formatDate(task.endTime)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
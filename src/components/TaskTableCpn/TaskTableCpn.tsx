"use client";

import { useMemo, useState, useEffect } from "react";
import {
  ColumnDef,
  useReactTable,
  getPaginationRowModel,
  getCoreRowModel,
  flexRender,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TASK_GROUP_WEB, TASK_GROUP_RESPONSE } from "@/types/task.type";
import { formatAPIDateToHoChiMinh, formatTimeStampDate } from "@/lib/utils";
import { SkeletonCard } from "@/components/SkeletonCard/SkeletonCard";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Eye,
  Search,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import TaskGroupModal from "@/components/TaskGroupModal/TaskGroupModal";
import useSignalRStore from "@/store/useSignalRStore";

interface TaskTableCpnProps {
  requestId: string;
  refreshTrigger?: number;
  workspaceId: string;
}
const TaskTableCpn = ({
  requestId,
  refreshTrigger = 0,
  workspaceId,
}: TaskTableCpnProps) => {
  const [taskGroups, setTaskGroups] = useState<TASK_GROUP_WEB[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(5);
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "createdDate",
      desc: true, // Newest first
    },
  ]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [selectedTaskGroup, setSelectedTaskGroup] =
    useState<TASK_GROUP_WEB | null>(null);
  const [showTaskGroupModal, setShowTaskGroupModal] = useState(false);

  const fetchTaskGroups = async () => {
    try {
      setLoading(true);
      const response: TASK_GROUP_RESPONSE = await apiClient.task.getTaskGroups(
        requestId,
        pageIndex + 1, // API uses 1-based pagination
        pageSize
      );

      setTaskGroups(response.data || []);
      setTotalCount(response.totalCount || 0);
    } catch (error) {
      console.error("Failed to fetch task groups:", error);
      setTaskGroups([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Add this new useEffect after the existing fetchTaskGroups useEffect
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token && requestId) {
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const { connect, disconnect } = useSignalRStore.getState();

      const roleName = "HOT"; // or get from auth user
      connect(
        token,
        backendUrl,
        [`role:${roleName}`],
        async (eventName, data) => {
          console.log(`📩 TaskTableCpn SignalR event: ${eventName}`, data);
          switch (eventName) {
            case "NotificationReceived":
            case "ConnectionEstablished":
              setSelectedTaskGroup(null);
              await fetchTaskGroups();
              break;
          }
        }
      );

      return () => disconnect();
    }
  }, [requestId]);

  useEffect(() => {
    if (requestId) {
      fetchTaskGroups();
    }
  }, [requestId, refreshTrigger, pageIndex, pageSize]);

  const filteredData = useMemo(() => {
    return taskGroups.filter((group) => {
      const searchableText = `${group.groupName || ""} ${
        group.groupType || ""
      } ${group.createdByName || ""}`.toLowerCase();
      return searchableText.includes(search.toLowerCase());
    });
  }, [taskGroups, search]);

  const handleViewTaskGroup = async (taskGroup: TASK_GROUP_WEB) => {
    // Always fetch fresh data for the selected task group
    try {
      const response = await apiClient.task.getTaskGroups(requestId, 1, 1000);
      const freshTaskGroup = response.data.find(
        (group: TASK_GROUP_WEB) => group.taskGroupId === taskGroup.taskGroupId
      );

      if (freshTaskGroup) {
        setSelectedTaskGroup(freshTaskGroup);
      } else {
        setSelectedTaskGroup(taskGroup); // Fallback to original if not found
      }
    } catch (error) {
      console.error("Failed to fetch fresh task group data:", error);
      setSelectedTaskGroup(taskGroup); // Fallback to original on error
    }

    setShowTaskGroupModal(true);
  };

  const handleTaskGroupUpdated = async () => {
    // Clear the selected task group to force fresh data
    setSelectedTaskGroup(null);
    setShowTaskGroupModal(false);

    // Refresh the task groups
    await fetchTaskGroups();

    console.log("✅ Task groups refreshed after update");
  };

  const getGroupTypeIcon = (groupType: string) => {
    switch (groupType.toLowerCase()) {
      case "replacement":
        return <Package className="h-4 w-4 text-blue-500" />;
      case "repair":
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case "warranty":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getGroupTypeColor = (groupType: string) => {
    switch (groupType.toLowerCase()) {
      case "replacement":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "repair":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "warranty":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getTasksSummary = (taskGroup: TASK_GROUP_WEB) => {
    const total = taskGroup.tasks.length;
    const completed = taskGroup.tasks.filter(
      (task) => task.status === "Completed"
    ).length;
    const inProgress = taskGroup.tasks.filter(
      (task) => task.status === "In Progress"
    ).length;
    const pending = taskGroup.tasks.filter(
      (task) => task.status === "Pending"
    ).length;

    return { total, completed, inProgress, pending };
  };

  const columns: ColumnDef<TASK_GROUP_WEB>[] = [
    {
      accessorKey: "groupName",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent p-0 h-auto font-semibold"
        >
          Tên nhóm nhiệm vụ
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: (info) => {
        const value = info.getValue() as string;
        const taskGroup = info.row.original;
        if (!value) return "---";

        return (
          <div>
            <div className="font-medium max-w-xs truncate">{value}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "groupType",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent p-0 h-auto font-semibold"
        >
          Loại nhóm
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: (info) => {
        const value = info.getValue() as string;
        if (!value) return "---";

        return (
          <div className="flex items-center gap-2">
            {getGroupTypeIcon(value)}
            <Badge className={`${getGroupTypeColor(value)} text-xs`}>
              {value === "replacement"
                ? "Thay thế"
                : value === "repair"
                ? "Sửa chữa"
                : value === "warranty"
                ? "Bảo hành"
                : value}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "tasks",
      header: "Tóm tắt nhiệm vụ",
      enableSorting: false,
      cell: (info) => {
        const taskGroup = info.row.original;
        const summary = getTasksSummary(taskGroup);

        return (
          <div className="space-y-1">
            <div className="text-sm font-medium">
              Tổng cộng: {summary.total} nhiệm vụ
            </div>
            <div className="flex gap-2 text-xs">
              <span className="text-green-600">✓ {summary.completed} hoàn thành</span>
              <span className="text-blue-600">⟳ {summary.inProgress} đang xử lý</span>
              <span className="text-yellow-600">⏸ {summary.pending} chờ xử lý</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "createdDate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent p-0 h-auto font-semibold"
        >
          Ngày tạo
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: (info) => {
        const value = info.getValue() as string;
        if (!value) return "---";

        try {
          return (
            <span className="text-gray-600 dark:text-gray-400">
              {formatAPIDateToHoChiMinh(value, "datetime")}
            </span>
          );
        } catch (error) {
          return <span>{value}</span>;
        }
      },
      sortingFn: "datetime",
    },

    {
      id: "actions",
      header: "Thao tác",
      enableSorting: false,
      cell: (info) => {
        const taskGroup = info.row.original;

        return (
          <a
            href={`/workspace/${workspaceId}/tasks/group/${taskGroup.taskGroupId}`}
            className="inline-block w-full"
          >
            <Button variant="outline" size="sm" className="w-full">
              Xem chi tiết
            </Button>
          </a>
        );
      },
    },
  ];

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting: sorting,
      pagination: {
        pageIndex: pageIndex,
        pageSize: pageSize,
      },
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    manualPagination: true,
    pageCount: Math.ceil(totalCount / pageSize),
  });

  if (loading) {
    return <SkeletonCard />;
  }

  if (taskGroups.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <div className="text-gray-500 dark:text-gray-400 text-lg">
          Không tìm thấy nhóm nhiệm vụ nào
        </div>
        <div className="text-gray-400 dark:text-gray-500 text-sm mt-2">
          Nhóm nhiệm vụ sẽ hiển thị tại đây khi có dữ liệu
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center">
        <div className="relative w-1/3">
          <div className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground">
            <Search className="h-4 w-4" />
          </div>
          <Input
            className="pl-8"
            placeholder="Tìm kiếm nhóm nhiệm vụ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card className="mt-8 rounded-none">
        <Table className="w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="bg-zinc-100 dark:bg-slate-900 rounded-none"
                  >
                    {header.isPlaceholder ? null : (
                      <div className="flex items-center gap-2">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="rounded-none hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  onClick={() => handleViewTaskGroup(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Không có kết quả nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="flex items-center justify-between mt-5">
        <div>
          <span className="text-sm">{`${totalCount} nhóm nhiệm vụ được tìm thấy`}</span>
        </div>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-3">
            <span className="text-[0.8rem] text-gray-500 dark:text-gray-400">
              Số dòng mỗi trang
            </span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value: string) => {
                setPageSize(Number(value));
                setPageIndex(0); // Reset to first page
              }}
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[3, 5, 10, 20].map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <PaginationContent>
            {Array.from({ length: table.getPageCount() }, (_, index) => (
              <PaginationItem key={index} className="hover:cursor-pointer">
                <PaginationLink
                  isActive={index === pageIndex}
                  onClick={() => {
                    setPageIndex(index);
                  }}
                >
                  {index + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
          </PaginationContent>
        </div>
      </div>

      {/* Task Group Modal */}
      <TaskGroupModal
        open={showTaskGroupModal}
        onOpenChange={setShowTaskGroupModal}
        taskGroup={selectedTaskGroup}
        onTaskGroupUpdated={handleTaskGroupUpdated}
      />
    </div>
  );
};

export default TaskTableCpn;

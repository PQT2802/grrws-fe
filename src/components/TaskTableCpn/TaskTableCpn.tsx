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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
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
import { TASK_FOR_REQUEST_DETAIL_WEB } from "@/types/request.type";
import { formatTimeStampDate } from "@/lib/utils";
import { SkeletonCard } from "@/components/SkeletonCard/SkeletonCard";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Eye,
  MoreHorizontal,
  Search,
} from "lucide-react";
import requestService from "@/app/service/request.service";

interface TaskTableCpnProps {
  requestId: string;
  refreshTrigger?: number; // Add this to trigger refresh
}

const TaskTableCpn = ({ requestId, refreshTrigger = 0 }: TaskTableCpnProps) => {
  const [tasks, setTasks] = useState<TASK_FOR_REQUEST_DETAIL_WEB[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(5);
  const [sorting, setSorting] = useState<SortingState>([]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await requestService.getTasksByRequestId(requestId);
      setTasks(data);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (requestId) {
      fetchTasks();
    }
  }, [requestId, refreshTrigger]); // Refresh when refreshTrigger changes

  const filteredData = useMemo(() => {
    return tasks.filter((task) => {
      const searchableText = `${task.taskType || ""} ${task.status || ""} ${
        task.assigneeName || ""
      }`.toLowerCase();
      return searchableText.includes(search.toLowerCase());
    });
  }, [tasks, search]);

  const handleViewDetail = (task: TASK_FOR_REQUEST_DETAIL_WEB) => {
    console.log("View task detail:", task);
  };

  const columns: ColumnDef<TASK_FOR_REQUEST_DETAIL_WEB>[] = [
    {
      accessorKey: "taskType",
      header: ({ column }) => (
        <span className="flex items-center gap-2">
          Task Type <ArrowUpDown size={15} />
        </span>
      ),
      cell: (info) => {
        const value = info.getValue();
        if (!value) return "---";
        return <span className="font-medium">{String(value)}</span>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: (info) => {
        const value = info.getValue() as string;
        if (!value) return "---";

        return (
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              value === "Completed"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : value === "In Progress"
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
            }`}
          >
            {value}
          </span>
        );
      },
    },
    {
      accessorKey: "assigneeName",
      header: "Assigned To",
      cell: (info) => {
        const value = info.getValue();
        if (!value) return "---";
        return <span>{String(value)}</span>;
      },
    },
    {
      accessorKey: "startTime",
      header: "Start Time",
      cell: (info) => {
        const value = info.getValue();
        if (!value) return "---";

        try {
          return (
            <span className="text-gray-600 dark:text-gray-400">
              {formatTimeStampDate(String(value), "datetime")}
            </span>
          );
        } catch (error) {
          return <span>{String(value)}</span>;
        }
      },
    },
    {
      accessorKey: "expectedTime",
      header: "Expected Time",
      cell: (info) => {
        const value = info.getValue();
        if (!value) return "---";

        try {
          return (
            <span className="text-gray-600 dark:text-gray-400">
              {formatTimeStampDate(String(value), "datetime")}
            </span>
          );
        } catch (error) {
          return <span>{String(value)}</span>;
        }
      },
    },
    {
      accessorKey: "numberOfErrors",
      header: "Errors Count",
      cell: (info) => {
        const value = info.getValue();
        if (value === null || value === undefined) return "---";
        return (
          <span className="font-medium">
            {value === 0 ? "No errors" : `${value} error(s)`}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: (info) => {
        const task = info.row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  handleViewDetail(task);
                }}
              >
                <div className="flex items-center gap-3">
                  <Eye size={15} /> View detail
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
  });

  if (loading) {
    return <SkeletonCard />;
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 dark:text-gray-400 text-lg">
          No tasks found
        </div>
        <div className="text-gray-400 dark:text-gray-500 text-sm mt-2">
          Tasks will appear here when available
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
            placeholder="Search tasks..."
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
                    onClick={header.column.getToggleSortingHandler()}
                    className="bg-zinc-100 dark:bg-slate-900 rounded-none cursor-pointer"
                  >
                    {header.isPlaceholder ? null : (
                      <div className="flex items-center gap-2">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: <ArrowUp size={15} />,
                          desc: <ArrowDown size={15} />,
                        }[header.column.getIsSorted() as string] ?? null}
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
                  className="rounded-none hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="flex items-center justify-between mt-5">
        <div>
          <span className="text-sm">{`${filteredData.length} task(s) found`}</span>
        </div>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-3">
            <span className="text-[0.8rem] text-gray-500 dark:text-gray-400">
              Items per page
            </span>
            <Select
              defaultValue={pageSize.toString()}
              onValueChange={(value: string) => {
                setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[3, 5, 10, 100].map((size) => {
                  return (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  );
                })}
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
    </div>
  );
};

export default TaskTableCpn;

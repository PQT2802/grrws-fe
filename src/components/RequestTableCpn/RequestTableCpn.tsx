"use client";

import { useMemo, useState } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
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
import { Checkbox } from "@/components/ui/checkbox";
import { REQUEST_SUMMARY } from "@/types/request.type";
import { formatAPIDateToHoChiMinh, formatTimeStampDate } from "@/lib/utils";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Eye,
  MoreHorizontal,
  Search,
} from "lucide-react";
import { toast } from "react-toastify";

interface RequestTableCpnProps {
  requestSummary: REQUEST_SUMMARY | null;
  loading: boolean;
}

const RequestTableCpn = ({ requestSummary, loading }: RequestTableCpnProps) => {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname(); // ✅ Get current path

  // ✅ Extract workspaceId based on current route
  let workspaceId: string;

  if (pathname?.includes("/workspace/") && params?.["workspace-id"]) {
    // We're on a workspace detail page
    workspaceId = params["workspace-id"] as string;
  } else {
    workspaceId = "";
  }

  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(5);
  const [rowSelection, setRowSelection] = useState({});
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "requestDate", // ✅ Sort by requestDate column
      desc: true, // ✅ Newest first (descending order)
    },
  ]);

  // Convert single request summary to array format for table
  const tableData = useMemo(() => {
    if (!requestSummary) {
      return [];
    }

    // Check if it's already an array or a single object
    if (Array.isArray(requestSummary)) {
      return requestSummary;
    }

    // If it's a single object, convert to array
    return [requestSummary];
  }, [requestSummary]);

  const filteredData = useMemo(() => {
    return tableData.filter((request) => {
      const title = request.requestTitle || request.title || "";
      return title.toLowerCase().includes(search.toLowerCase());
    });
  }, [tableData, search]);

  const handleViewDetail = (request: REQUEST_SUMMARY) => {
    if (!workspaceId) {
      toast.error("Cannot navigate: workspace not identified");
      return;
    }

    router.push(`/workspace/${workspaceId}/requests/${request.requestId}`);
  };

  const columns: ColumnDef<any>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
    },
    {
      accessorKey: "requestTitle",
      header: "Title",
      cell: (info) => {
        const value = info.getValue();
        if (!value) return "---";
        return <span>{String(value)}</span>;
      },
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: (info) => {
        const value = info.getValue() as string;
        console.log("Priority value:", value);
        if (!value) return "---";

        return (
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              value === "High"
                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                : value === "Medium"
                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            }`}
          >
            {value}
          </span>
        );
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
      accessorKey: "requestDate",
      header: "Request Date",
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
          console.error("Date formatting error:", error);
          return <span>{String(value)}</span>;
        }
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: (info) => {
        const request = info.row.original;

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
                  handleViewDetail(request);
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
      rowSelection,
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onRowSelectionChange: setRowSelection,
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
  });

  if (!requestSummary) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 dark:text-gray-400 text-lg">
          No request data available
        </div>
        <div className="text-gray-400 dark:text-gray-500 text-sm mt-2">
          Requests will appear here when available
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
            placeholder="Search by title..."
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
          <span className="text-sm">{`${Object.keys(rowSelection).length} of ${
            filteredData.length
          } row(s) selected`}</span>
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

export default RequestTableCpn;

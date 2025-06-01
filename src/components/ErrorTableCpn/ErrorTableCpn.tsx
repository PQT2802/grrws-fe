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
import { ERROR_FOR_REQUEST_DETAIL_WEB } from "@/types/request.type";
import { SkeletonCard } from "@/components/SkeletonCard/SkeletonCard";
import { ArrowDown, ArrowUp, ArrowUpDown, Search, Plus } from "lucide-react";
import requestService from "@/app/service/request.service";
import CreateTaskFromErrorsCpn from "../CreateTaskFromErrorsCpn/CreateTaskFromErrorsCpn";
import ButtonCpn from "../ButtonCpn/ButtonCpn";

interface ErrorTableCpnProps {
  requestId: string;
  selectedErrors: ERROR_FOR_REQUEST_DETAIL_WEB[];
  onSelectionChange: (errors: ERROR_FOR_REQUEST_DETAIL_WEB[]) => void;
  refreshTrigger?: number;
}

const ErrorTableCpn = ({
  requestId,
  selectedErrors,
  onSelectionChange,
  refreshTrigger = 0,
}: ErrorTableCpnProps) => {
  const [errors, setErrors] = useState<ERROR_FOR_REQUEST_DETAIL_WEB[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(5);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [openCreateTaskModal, setOpenCreateTaskModal] = useState(false);

  const fetchErrors = async () => {
    try {
      setLoading(true);
      const data = await requestService.getErrorsByRequestId(requestId);
      setErrors(data);
    } catch (error) {
      console.error("Failed to fetch errors:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (requestId) {
      fetchErrors();
    }
  }, [requestId, refreshTrigger]);

  const filteredData = useMemo(() => {
    return errors.filter((error) => {
      const searchableText = `${error.errorCode || ""} ${error.name || ""} ${
        error.severity || ""
      } ${error.status || ""}`.toLowerCase();
      return searchableText.includes(search.toLowerCase());
    });
  }, [errors, search]);

  // ✅ Filter out errors that can be selected (not "Assigned")
  const selectableErrors = useMemo(() => {
    return filteredData.filter((error) => error.status !== "Assigned");
  }, [filteredData]);

  const handleSelectError = (
    error: ERROR_FOR_REQUEST_DETAIL_WEB,
    checked: boolean
  ) => {
    // ✅ Prevent selection of assigned errors
    if (error.status === "Assigned") return;

    if (checked) {
      onSelectionChange([...selectedErrors, error]);
    } else {
      onSelectionChange(
        selectedErrors.filter((e) => e.errorId !== error.errorId)
      );
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // ✅ Only select non-assigned errors
      onSelectionChange(selectableErrors);
    } else {
      onSelectionChange([]);
    }
  };

  const isErrorSelected = (error: ERROR_FOR_REQUEST_DETAIL_WEB) => {
    return selectedErrors.some((e) => e.errorId === error.errorId);
  };

  const handleTaskCreated = () => {
    fetchErrors();
    onSelectionChange([]);
  };

  const columns: ColumnDef<ERROR_FOR_REQUEST_DETAIL_WEB>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            selectableErrors.length > 0 &&
            selectableErrors.every((error) => isErrorSelected(error))
          }
          onCheckedChange={(value) => handleSelectAll(!!value)}
          aria-label="Select all selectable errors"
        />
      ),
      cell: ({ row }) => {
        const error = row.original;
        const isAssigned = error.status === "Assigned";

        return (
          <Checkbox
            checked={isErrorSelected(error)}
            onCheckedChange={(value) => handleSelectError(error, !!value)}
            disabled={isAssigned} // ✅ Disable checkbox for assigned errors
            aria-label={
              isAssigned ? "Cannot select assigned error" : "Select error"
            }
            className={isAssigned ? "opacity-50 cursor-not-allowed" : ""}
          />
        );
      },
    },
    {
      accessorKey: "errorCode",
      header: ({ column }) => (
        <span className="flex items-center gap-2">
          Error Code <ArrowUpDown size={15} />
        </span>
      ),
      cell: (info) => {
        const value = info.getValue();
        if (!value) return "---";
        return (
          <span className="font-medium text-red-600 dark:text-red-400">
            {String(value)}
          </span>
        );
      },
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: (info) => {
        const value = info.getValue();
        if (!value) return "---";
        return <span>{String(value)}</span>;
      },
    },
    {
      accessorKey: "severity",
      header: "Severity",
      cell: (info) => {
        const value = info.getValue() as string | null;
        if (!value) return "---";

        return (
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              value === "Critical"
                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                : value === "High"
                ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
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
              value === "Resolved"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : value === "In Progress"
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                : value === "Pending"
                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                : value === "Assigned"
                ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
            }`}
          >
            {value}
          </span>
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

  if (errors.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 dark:text-gray-400 text-lg">
          No errors found
        </div>
        <div className="text-gray-400 dark:text-gray-500 text-sm mt-2">
          Errors will appear here when available
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="relative w-1/3">
          <div className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground">
            <Search className="h-4 w-4" />
          </div>
          <Input
            className="pl-8"
            placeholder="Search errors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          {selectedErrors.length > 0 && (
            <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              {selectedErrors.length} error(s) selected
            </div>
          )}

          {/* ✅ SINGLE Create Task Button - Only show when errors are selected */}
          {selectedErrors.length > 0 && (
            <CreateTaskFromErrorsCpn
              open={openCreateTaskModal}
              setOpen={setOpenCreateTaskModal}
              requestId={requestId}
              selectedErrors={selectedErrors}
              onTaskCreated={handleTaskCreated}
            >
              <ButtonCpn
                type="button"
                title={`Create Task (${selectedErrors.length})`}
                icon={<Plus size={16} />}
                onClick={() => setOpenCreateTaskModal(true)}
              />
            </CreateTaskFromErrorsCpn>
          )}
        </div>
      </div>

      <Card className="rounded-none">
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
              table.getRowModel().rows.map((row) => {
                const error = row.original;
                const isAssigned = error.status === "Assigned";

                return (
                  <TableRow
                    key={row.id}
                    className={`rounded-none transition-colors ${
                      isAssigned
                        ? "bg-gray-50 dark:bg-gray-800 opacity-60" // ✅ Visual indicator for assigned errors
                        : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
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
                );
              })
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
          <span className="text-sm">
            {`${selectedErrors.length} of ${selectableErrors.length} selectable error(s) selected`}
            {filteredData.length !== selectableErrors.length && (
              <span className="text-gray-500 ml-1">
                ({filteredData.length - selectableErrors.length} assigned)
              </span>
            )}
          </span>
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

export default ErrorTableCpn;

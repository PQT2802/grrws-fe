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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { TECHNICAL_ISSUE_FOR_REQUEST_DETAIL_WEB } from "@/types/request.type";
import { SkeletonCard } from "@/components/SkeletonCard/SkeletonCard";
import { formatTimeStampDate } from "@/lib/utils";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Eye,
  MoreHorizontal,
  Search,
  Plus,
} from "lucide-react";
import requestService from "@/app/service/request.service";
import ButtonCpn from "../ButtonCpn/ButtonCpn";

interface TechnicalIssueTableCpnProps {
  requestId: string;
  selectedTechnicalIssues: TECHNICAL_ISSUE_FOR_REQUEST_DETAIL_WEB[];
  onSelectionChange: (issues: TECHNICAL_ISSUE_FOR_REQUEST_DETAIL_WEB[]) => void;
  refreshTrigger?: number;
}

const TechnicalIssueTableCpn = ({
  requestId,
  selectedTechnicalIssues,
  onSelectionChange,
  refreshTrigger = 0,
}: TechnicalIssueTableCpnProps) => {
  const [technicalIssues, setTechnicalIssues] = useState<
    TECHNICAL_ISSUE_FOR_REQUEST_DETAIL_WEB[]
  >([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(5);
  const [sorting, setSorting] = useState<SortingState>([]);

  const fetchTechnicalIssues = async () => {
    try {
      setLoading(true);
      const data = await requestService.getTechnicalIssuesByRequestId(
        requestId
      );
      setTechnicalIssues(data);
    } catch (error) {
      console.error("Failed to fetch technical issues:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (requestId) {
      fetchTechnicalIssues();
    }
  }, [requestId, refreshTrigger]);

  // Filter selectable technical issues (exclude assigned ones)
  const selectableTechnicalIssues = useMemo(() => {
    return technicalIssues.filter((issue) => issue.status !== "Assigned");
  }, [technicalIssues]);

  const filteredData = useMemo(() => {
    return technicalIssues.filter((issue) => {
      const searchableText = `${issue.name || ""} ${issue.symptomCode || ""} ${
        issue.description || ""
      } ${issue.status || ""}`.toLowerCase();
      return searchableText.includes(search.toLowerCase());
    });
  }, [technicalIssues, search]);

  const handleViewDetail = (issue: TECHNICAL_ISSUE_FOR_REQUEST_DETAIL_WEB) => {
    console.log("View technical issue detail:", issue);
  };

  const handleTechnicalIssueSelection = (
    issue: TECHNICAL_ISSUE_FOR_REQUEST_DETAIL_WEB,
    checked: boolean
  ) => {
    // Prevent selection of assigned technical issues
    if (issue.status === "Assigned") return;

    if (checked) {
      onSelectionChange([...selectedTechnicalIssues, issue]);
    } else {
      onSelectionChange(
        selectedTechnicalIssues.filter(
          (i) => i.technicalIssueId !== issue.technicalIssueId
        )
      );
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Only select non-assigned technical issues
      onSelectionChange(selectableTechnicalIssues);
    } else {
      onSelectionChange([]);
    }
  };

  const isTechnicalIssueSelected = (
    issue: TECHNICAL_ISSUE_FOR_REQUEST_DETAIL_WEB
  ) => {
    return selectedTechnicalIssues.some(
      (i) => i.technicalIssueId === issue.technicalIssueId
    );
  };

  const columns: ColumnDef<TECHNICAL_ISSUE_FOR_REQUEST_DETAIL_WEB>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            selectableTechnicalIssues.length > 0 &&
            selectableTechnicalIssues.every((issue) =>
              isTechnicalIssueSelected(issue)
            )
          }
          onCheckedChange={(value) => handleSelectAll(!!value)}
          aria-label="Chọn tất cả"
          disabled={selectableTechnicalIssues.length === 0}
        />
      ),
      cell: ({ row }) => {
        const issue = row.original;
        const isAssigned = issue.status === "Assigned";

        return (
          <Checkbox
            checked={isTechnicalIssueSelected(issue)}
            onCheckedChange={(value) =>
              handleTechnicalIssueSelection(issue, !!value)
            }
            aria-label="Chọn dòng"
            disabled={isAssigned}
            className={isAssigned ? "opacity-50" : ""}
          />
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "symptomCode",
      header: ({ column }) => (
        <span className="flex items-center gap-2">
          Mã triệu chứng <ArrowUpDown size={15} />
        </span>
      ),
      cell: (info) => {
        const value = info.getValue();
        if (!value) return "---";
        return (
          <span className="font-medium text-blue-600 dark:text-blue-400">
            {String(value)}
          </span>
        );
      },
    },
    {
      accessorKey: "name",
      header: "Tên sự cố kỹ thuật",
      cell: (info) => {
        const value = info.getValue();
        if (!value) return "---";
        return <span className="font-medium">{String(value)}</span>;
      },
    },
    {
      accessorKey: "description",
      header: "Mô tả",
      cell: (info) => {
        const value = info.getValue() as string | null;
        if (!value) return "---";

        return (
          <span className="max-w-xs truncate block" title={value}>
            {value}
          </span>
        );
      },
    },
    {
      accessorKey: "isCommon",
      header: "Loại",
      cell: (info) => {
        const value = info.getValue() as boolean;

        return (
          <Badge variant={value ? "default" : "secondary"}>
            {value ? "Phổ biến" : "Riêng biệt"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: (info) => {
        const value = info.getValue() as string;
        if (!value) return "---";

        return (
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              value === "Assigned"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : value === "Unassigned"
                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
            }`}
          >
            {value === "Assigned"
              ? "Đã giao"
              : value === "Unassigned"
              ? "Chưa giao"
              : "Không xác định"}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: (info) => {
        const issue = info.row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Mở menu</span>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  handleViewDetail(issue);
                }}
              >
                <div className="flex items-center gap-3">
                  <Eye size={15} /> Xem chi tiết
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

  if (technicalIssues.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 dark:text-gray-400 text-lg">
          Không tìm thấy sự cố kỹ thuật nào
        </div>
        <div className="text-gray-400 dark:text-gray-500 text-sm mt-2">
          Sự cố kỹ thuật sẽ hiển thị tại đây khi có dữ liệu
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
            placeholder="Tìm kiếm sự cố kỹ thuật..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {selectedTechnicalIssues.length} / {selectableTechnicalIssues.length} đã chọn
          </span>
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
                const issue = row.original;
                const isAssigned = issue.status === "Assigned";

                return (
                  <TableRow
                    key={row.id}
                    className={`rounded-none transition-colors ${
                      isAssigned
                        ? "opacity-60 bg-gray-50 dark:bg-gray-800"
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
                  Không có kết quả nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="flex items-center justify-between mt-5">
        <div>
          <span className="text-sm">{`${filteredData.length} sự cố kỹ thuật được tìm thấy`}</span>
        </div>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-3">
            <span className="text-[0.8rem] text-gray-500 dark:text-gray-400">
              Số dòng mỗi trang
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

export default TechnicalIssueTableCpn;

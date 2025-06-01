"use client";

import { useMemo, useState } from "react";
import { getFirebaseImageUrls } from "@/app/service/firebase-image.service"; // ✅ Add this import
import Image from "next/image"; // ✅ Add Next.js Image import
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
import { ISSUE_FOR_REQUEST_DETAIL_WEB } from "@/types/request.type";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Eye,
  MoreHorizontal,
  Search,
  Image as ImageIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface IssueTableCpnProps {
  issues: ISSUE_FOR_REQUEST_DETAIL_WEB[];
  loading: boolean;
}

const IssueTableCpn = ({ issues, loading }: IssueTableCpnProps) => {
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(5);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [openImageModal, setOpenImageModal] = useState(false);
  const [imageLoading, setImageLoading] = useState(false); // ✅ Add this

  const filteredData = useMemo(() => {
    return issues.filter((issue) => {
      const searchableText = `${issue.displayName || ""} ${
        issue.status || ""
      }`.toLowerCase();
      return searchableText.includes(search.toLowerCase());
    });
  }, [issues, search]);

  const handleViewDetail = (issue: ISSUE_FOR_REQUEST_DETAIL_WEB) => {
    console.log("View issue detail:", issue);
    // Add navigation logic here if needed
  };

  const columns: ColumnDef<ISSUE_FOR_REQUEST_DETAIL_WEB>[] = [
    {
      accessorKey: "displayName",
      header: ({ column }) => (
        <span className="flex items-center gap-2">
          Display Name <ArrowUpDown size={15} />
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
              value === "Closed"
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
      accessorKey: "images",
      header: "Images",
      cell: (info) => {
        const images = info.getValue() as string[];
        const imageCount = images?.length || 0;

        if (imageCount === 0) {
          return (
            <div className="flex items-center gap-2 text-gray-400">
              <ImageIcon size={16} />
              <span>No images</span>
            </div>
          );
        }

        return (
          <Dialog open={openImageModal} onOpenChange={setOpenImageModal}>
            <DialogTrigger asChild>
              <div
                className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors"
                onClick={async () => {
                  setImageLoading(true); // ✅ Show loading
                  try {
                    console.log("🔄 Processing Firebase images:", images);
                    // ✅ Get proper Firebase URLs
                    const firebaseUrls = await getFirebaseImageUrls(images);
                    setSelectedImages(firebaseUrls);
                    setOpenImageModal(true);
                  } catch (error) {
                    console.error("❌ Failed to load Firebase images:", error);
                    // Fallback to original paths
                    setSelectedImages(images);
                    setOpenImageModal(true);
                  } finally {
                    setImageLoading(false); // ✅ Hide loading
                  }
                }}
              >
                <ImageIcon size={16} className="text-blue-500" />
                <span>{imageCount} image(s)</span>
                <Eye size={14} className="text-gray-400" />
                {/* ✅ Add loading indicator */}
                {imageLoading && (
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin ml-2"></div>
                )}
              </div>
            </DialogTrigger>

            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  Issue Images ({selectedImages.length})
                </DialogTitle>
                <DialogDescription>
                  Click on any image to view in full size
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {selectedImages.map((imageUrl, index) => (
                  <div key={index} className="relative group">
                    {/* Replace the Next.js Image with regular img for Firebase URLs */}
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                      <img
                        src={imageUrl}
                        alt={`Issue image ${index + 1}`}
                        className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => window.open(imageUrl, "_blank")}
                        onError={(e) => {
                          // Handle error with placeholder
                          e.currentTarget.src = "/placeholder-image.png";
                          console.error(
                            `Failed to load Firebase image: ${imageUrl}`
                          );
                        }}
                      />
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                      <Eye
                        className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        size={24}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: (info) => {
        const issue = info.row.original;

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
                  handleViewDetail(issue);
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

  if (issues.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 dark:text-gray-400 text-lg">
          No issues found
        </div>
        <div className="text-gray-400 dark:text-gray-500 text-sm mt-2">
          Issues will appear here when available
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
            placeholder="Search issues..."
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
          <span className="text-sm">{`${filteredData.length} issue(s) found`}</span>
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

      {/* Image Gallery Modal */}
      <Dialog open={openImageModal} onOpenChange={setOpenImageModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Issue Images ({selectedImages.length})</DialogTitle>
            <DialogDescription>
              Click on any image to view in full size
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {selectedImages.map((imageUrl, index) => (
              <div key={index} className="relative group">
                {/* Replace the Next.js Image with regular img for Firebase URLs */}
                <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                  <img
                    src={imageUrl}
                    alt={`Issue image ${index + 1}`}
                    className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => window.open(imageUrl, "_blank")}
                    onError={(e) => {
                      // Handle error with placeholder
                      e.currentTarget.src = "/placeholder-image.png";
                      console.error(
                        `Failed to load Firebase image: ${imageUrl}`
                      );
                    }}
                  />
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                  <Eye
                    className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    size={24}
                  />
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IssueTableCpn;

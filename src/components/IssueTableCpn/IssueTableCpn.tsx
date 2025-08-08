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
  ChevronDown,
  ChevronUp,
  AlertCircle,
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
  showToggle?: boolean;
  showAll?: boolean;
  onToggle?: () => void;
}

const IssueTableCpn = ({
  issues,
  loading,
  showToggle,
  showAll,
  onToggle,
}: IssueTableCpnProps) => {
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
          Tên sự cố <ArrowUpDown size={15} />
        </span>
      ),
      cell: (info) => {
        const value = info.getValue();
        if (!value) return "---";
        return <span className="font-medium">{String(value)}</span>;
      },
    },
    {
      accessorKey: "images",
      header: "Hình ảnh",
      cell: (info) => {
        const images = info.getValue() as string[];
        const imageCount = images?.length || 0;

        if (imageCount === 0) {
          return (
            <div className="flex items-center gap-2 text-gray-400">
              <ImageIcon size={16} />
              <span>Không có hình ảnh</span>
            </div>
          );
        }

        return (
          <Dialog open={openImageModal} onOpenChange={setOpenImageModal}>
            <DialogTrigger asChild>
              <div
                className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors"
                onClick={async () => {
                  setImageLoading(true);
                  try {
                    const firebaseUrls = await getFirebaseImageUrls(images);
                    setSelectedImages(firebaseUrls);
                    setOpenImageModal(true);
                  } catch (error) {
                    setSelectedImages(images);
                    setOpenImageModal(true);
                  } finally {
                    setImageLoading(false);
                  }
                }}
              >
                <ImageIcon size={16} className="text-blue-500" />
                <span>{imageCount} hình ảnh</span>
                <Eye size={14} className="text-gray-400" />
                {imageLoading && (
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin ml-2"></div>
                )}
              </div>
            </DialogTrigger>

            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  Hình ảnh sự cố ({selectedImages.length})
                </DialogTitle>
                <DialogDescription>
                  Nhấn vào hình để xem kích thước đầy đủ
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {selectedImages.map((imageUrl, index) => (
                  <div key={index} className="relative group">
                    {/* Optimized with Next.js Image */}
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                      <Image
                        src={imageUrl}
                        alt={`Hình sự cố ${index + 1}`}
                        fill
                        unoptimized
                        className="object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        sizes="(max-width: 768px) 50vw, 33vw"
                        onClick={() => window.open(imageUrl, "_blank")}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            "/placeholder-image.png";
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
    // {
    //   id: "actions",
    //   header: "Thao tác",
    //   cell: (info) => {
    //     const issue = info.row.original;

    //     return (
    //       <DropdownMenu>
    //         <DropdownMenuTrigger asChild>
    //           <Button variant="ghost" className="h-8 w-8 p-0">
    //             <span className="sr-only">Mở menu</span>
    //             <MoreHorizontal />
    //           </Button>
    //         </DropdownMenuTrigger>
    //         <DropdownMenuContent align="end">
    //           <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
    //           <DropdownMenuItem
    //             onClick={() => {
    //               handleViewDetail(issue);
    //             }}
    //           >
    //             <div className="flex items-center gap-3">
    //               <Eye size={15} /> Xem chi tiết
    //             </div>
    //           </DropdownMenuItem>
    //         </DropdownMenuContent>
    //       </DropdownMenu>
    //     );
    //   },
    // },
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
          Không tìm thấy sự cố nào
        </div>
        <div className="text-gray-400 dark:text-gray-500 text-sm mt-2">
          Sự cố sẽ hiển thị tại đây khi có dữ liệu
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <AlertCircle className="h-4 w-4 text-orange-600" />
        <span className="text-base font-semibold">Danh sách Sự cố</span>
        {showToggle && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto px-2 py-0 h-7"
            onClick={onToggle}
          >
            {showAll ? (
              <>
                Thu gọn <ChevronUp size={16} />
              </>
            ) : (
              <>
                Xem tất cả <ChevronDown size={16} />
              </>
            )}
          </Button>
        )}
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
                  Không có kết quả nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Image Gallery Modal */}
      <Dialog open={openImageModal} onOpenChange={setOpenImageModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Hình ảnh sự cố ({selectedImages.length})</DialogTitle>
            <DialogDescription>
              Nhấn vào hình để xem kích thước đầy đủ
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {selectedImages.map((imageUrl, index) => (
              <div key={index} className="relative group">
                {/* Use Next.js Image for optimization */}
                <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                  <Image
                    src={imageUrl}
                    alt={`Hình sự cố ${index + 1}`}
                    fill
                    unoptimized
                    className="object-cover cursor-pointer hover:opacity-80 transition-opacity"
                    sizes="(max-width: 768px) 50vw, 33vw"
                    onClick={() => window.open(imageUrl, "_blank")}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        "/placeholder-image.png";
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

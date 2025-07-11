import { Request } from '../../../type';
import StatusBadge from '../StatusBadge';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious, 
  PaginationEllipsis 
} from '@/components/ui/pagination';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

interface RequestsTableProps {
  requests: Request[];
  onRequestClick: (id: string) => void;
  onClearFilters: () => void;
  // Pagination props
  currentPage?: number;
  totalPages?: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export default function RequestsTable({ 
  requests, 
  onRequestClick, 
  onClearFilters,
  currentPage = 1,
  totalPages = 1,
  pageSize = 10,
  totalItems = 0,
  onPageChange,
  onPageSizeChange
}: RequestsTableProps) {
  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  if (requests.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            Không có yêu cầu nào phù hợp với bộ lọc
          </p>
          <button
            className="mt-2 text-primary underline text-sm"
            onClick={onClearFilters}
          >
            Xóa tất cả bộ lọc
          </button>
        </div>
        
        {/* Always show pagination bar even with no results */}
        <div className="flex items-center justify-between border-t pt-4 mt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Hiển thị
            </span>
            <Select 
              value={pageSize.toString()} 
              onValueChange={(value) => onPageSizeChange?.(parseInt(value))}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              trên tổng số {totalItems} mục
            </span>
          </div>

          <div className="flex justify-end">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => currentPage > 1 && onPageChange?.(currentPage - 1)}
                    className="pointer-events-none opacity-50"
                  />
                </PaginationItem>
                
                <PaginationItem>
                  <PaginationLink isActive={true} className="cursor-default">
                    1
                  </PaginationLink>
                </PaginationItem>
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => currentPage < totalPages && onPageChange?.(currentPage + 1)}
                    className="pointer-events-none opacity-50"
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-200">
              <th className="px-4 py-3 text-left font-medium">Mã yêu cầu</th>
              <th className="px-4 py-3 text-left font-medium">Ngày yêu cầu</th>
              <th className="px-4 py-3 text-left font-medium">Người nhận</th>
              <th className="px-4 py-3 text-left font-medium">Số lượng mặt hàng</th>
              <th className="px-4 py-3 text-left font-medium">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {requests.map((req) => (
              <tr
                key={req.id}
                className="hover:bg-primary/5 cursor-pointer transition-colors"
                onClick={() => onRequestClick(req.id)} 
              >
                <td className="px-4 py-3 font-medium">{req.code}</td> 
                <td className="px-4 py-3">{req.date}</td>
                <td className="px-4 py-3">{req.requestedBy}</td>
                <td className="px-4 py-3">{req.items}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={req.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls - Always show and right-aligned */}
      <div className="flex items-center justify-between border-t pt-4 mt-4">
        {/* Left side - Page size selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Hiển thị
          </span>
          <Select 
            value={pageSize.toString()} 
            onValueChange={(value) => onPageSizeChange?.(parseInt(value))}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            trên tổng số {totalItems} mục
          </span>
        </div>

        {/* Right side - Pagination - Always show */}
        <div className="flex justify-end">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => currentPage > 1 && onPageChange?.(currentPage - 1)}
                  className={currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {totalPages > 1 ? (
                generatePageNumbers().map((page, index) => (
                  <PaginationItem key={index}>
                    {page === 'ellipsis' ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink
                        onClick={() => onPageChange?.(page as number)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))
              ) : (
                <PaginationItem>
                  <PaginationLink isActive={true} className="cursor-default">
                    1
                  </PaginationLink>
                </PaginationItem>
              )}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => currentPage < totalPages && onPageChange?.(currentPage + 1)}
                  className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}
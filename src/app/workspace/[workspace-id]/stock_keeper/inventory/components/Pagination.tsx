// import { ChevronLeft, ChevronRight } from 'lucide-react';

// interface PaginationProps {
//   currentPage: number;
//   totalPages: number;
//   onPageChange: (page: number) => void;
// }

// export default function Pagination({
//   currentPage,
//   totalPages,
//   onPageChange,
// }: PaginationProps) {
//   // Ensure valid page bounds
//   const validCurrentPage = Math.max(1, Math.min(currentPage, totalPages));

//   // Generate page numbers to display
//   const getPageNumbers = () => {
//     const pages: (number | string)[] = [];

//     if (totalPages <= 5) {
//       // Show all pages if totalPages <= 5
//       for (let i = 1; i <= totalPages; i++) {
//         pages.push(i);
//       }
//     } else {
//       // Always show first page
//       pages.push(1);

//       // Calculate range around current page
//       let startPage = Math.max(2, validCurrentPage - 1);
//       let endPage = Math.min(totalPages - 1, validCurrentPage + 1);

//       // Add ellipsis after first page if needed
//       if (startPage > 2) {
//         pages.push('...');
//       }

//       // Add pages around current page
//       for (let i = startPage; i <= endPage; i++) {
//         pages.push(i);
//       }

//       // Add ellipsis before last page if needed
//       if (endPage < totalPages - 1) {
//         pages.push('...');
//       }

//       // Always show last page
//       if (totalPages > 1) {
//         pages.push(totalPages);
//       }
//     }

//     return pages;
//   };

//   const pageNumbers = getPageNumbers();

//   return (
//     <div className="flex justify-center items-center mt-8">
//       <div className="flex items-center gap-1">
//         <button
//           onClick={() => onPageChange(validCurrentPage - 1)}
//           disabled={validCurrentPage === 1}
//           className={`p-2 rounded-md ${
//             validCurrentPage === 1
//               ? 'text-gray-400 cursor-not-allowed'
//               : 'hover:bg-gray-100 dark:hover:bg-gray-700'
//           }`}
//           aria-label="Previous page"
//         >
//           <ChevronLeft className="h-5 w-5" />
//         </button>

//         {pageNumbers.map((page, index) => (
//           <button
//             key={index}
//             onClick={() => typeof page === 'number' && onPageChange(page)}
//             className={`px-3 py-1 rounded-md ${
//               validCurrentPage === page
//                 ? 'bg-primary text-white'
//                 : page === '...'
//                 ? 'cursor-default'
//                 : 'hover:bg-gray-100 dark:hover:bg-gray-700'
//             }`}
//             disabled={page === '...'}
//           >
//             {page}
//           </button>
//         ))}

//         <button
//           onClick={() => onPageChange(validCurrentPage + 1)}
//           disabled={validCurrentPage === totalPages}
//           className={`p-2 rounded-md ${
//             validCurrentPage === totalPages
//               ? 'text-gray-400 cursor-not-allowed'
//               : 'hover:bg-gray-100 dark:hover:bg-gray-700'
//           }`}
//           aria-label="Next page"
//         >
//           <ChevronRight className="h-5 w-5" />
//         </button>
//       </div>
//     </div>
//   );
// }
// 'use client';

// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { Badge } from "@/components/ui/badge";
// import { Calendar, User, Package, FileText, CheckCircle, Clock, AlertCircle, XCircle } from "lucide-react";
// import { SPAREPART_REQUEST_DETAIL } from "@/types/sparePart.type";

// interface SparePartRequestDetailModalProps {
//   request: SPAREPART_REQUEST_DETAIL | null;
//   isOpen: boolean;
//   onClose: () => void;
// }

// export default function SparePartRequestDetailModal({ 
//   request, 
//   isOpen, 
//   onClose 
// }: SparePartRequestDetailModalProps) {
  
//   if (!request) return null;

//   const getStatusColor = (status: string) => {
//     switch (status.toLowerCase()) {
//       case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
//       case 'confirmed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
//       case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
//       case 'insufficient': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
//       default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
//     }
//   };

//   const getStatusIcon = (status: string) => {
//     switch (status.toLowerCase()) {
//       case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
//       case 'confirmed': return <CheckCircle className="h-4 w-4 text-blue-500" />;
//       case 'delivered': return <CheckCircle className="h-4 w-4 text-green-500" />;
//       case 'insufficient': return <XCircle className="h-4 w-4 text-red-500" />;
//       default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
//     }
//   };

//   const getVietnameseStatus = (status: string) => {
//     const statusMap: { [key: string]: string } = {
//       'PENDING': 'Đang chờ xử lý',
//       'APPROVED': 'Đã duyệt',
//       'CONFIRMED': 'Đã xác nhận',
//       'UNCONFIRMED': 'Chưa xác nhận',
//       'DELIVERED': 'Đã giao',
//       'INSUFFICIENT': 'Thiếu hàng',
//       'REJECTED': 'Từ chối',
//       'CANCELLED': 'Đã hủy'
//     };
//     return statusMap[status.toUpperCase()] || status;
//   };

//   const formatDate = (dateString: string | null) => {
//     if (!dateString) return 'Chưa có';
//     const date = new Date(dateString);
//     const timeString = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
//     const dateTimeString = date.toLocaleDateString('vi-VN') + ' ' + timeString;
    
//     // Calculate relative time
//     const now = new Date();
//     const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
//     let relativeTime = '';
    
//     if (diffInHours < 1) {
//       const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
//       relativeTime = `${diffInMinutes} phút trước`;
//     } else if (diffInHours < 24) {
//       relativeTime = `${diffInHours} giờ trước`;
//     } else {
//       relativeTime = "Trên 1 ngày";
//     }
    
//     return `${dateTimeString} • ${relativeTime}`;
//   };

//   const totalQuantity = request.sparePartUsages?.reduce((sum, usage) => sum + usage.quantityUsed, 0) || 0;
//   const deliveredItems = request.sparePartUsages?.filter(usage => usage.isTakenFromStock).length || 0;
//   const totalItems = request.sparePartUsages?.length || 0;

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle className="text-xl font-semibold text-slate-800 dark:text-slate-200">
//             Chi tiết yêu cầu linh kiện: {request.requestCode}
//           </DialogTitle>
//         </DialogHeader>
        
//         <div className="space-y-6">
//           {/* Request Header */}
//           <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
//             <div className="flex items-start justify-between mb-4">
//               <div>
//                 <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
//                   {request.requestCode}
//                 </h3>
//               </div>
//               <div className="flex items-center gap-2">
//                 {getStatusIcon(request.status)}
//                 <Badge className={getStatusColor(request.status)}>
//                   {getVietnameseStatus(request.status)}
//                 </Badge>
//               </div>
//             </div>
//           </div>

//           {/* Request Information */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             {/* Request Information */}
//             <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
//               <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
//                 <FileText className="h-4 w-4" />
//                 Thông tin yêu cầu
//               </h4>
//               <div className="space-y-3 text-sm">
//                 <div>
//                   <span className="font-medium text-slate-700 dark:text-slate-300">Người nhận:</span>
//                   <p className="text-slate-600 dark:text-slate-400">{request.assigneeName}</p>
//                 </div>
//                 <div>
//                   <span className="font-medium text-slate-700 dark:text-slate-300">Ngày yêu cầu:</span>
//                   <p className="text-slate-600 dark:text-slate-400">{formatDate(request.requestDate)}</p>
//                 </div>
//                 {request.notes && (
//                   <div>
//                     <span className="font-medium text-slate-700 dark:text-slate-300">Ghi chú:</span>
//                     <p className="text-slate-600 dark:text-slate-400">{request.notes}</p>
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Request Summary - Updated with AdminQuickActions color scheme */}
//             <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
//               <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
//                 <Package className="h-4 w-4" />
//                 Tóm tắt yêu cầu
//               </h4>
//               <div className="grid grid-cols-2 gap-3">
//                 <div className="text-center p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
//                   <div className="text-lg font-bold text-blue-700 dark:text-blue-400">{totalItems}</div>
//                   <div className="text-xs font-medium text-blue-600 dark:text-blue-400">Tổng mặt hàng</div>
//                 </div>
//                 <div className="text-center p-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg dark:bg-purple-900/20 dark:border-purple-800">
//                   <div className="text-lg font-bold text-purple-700 dark:text-purple-400">{totalQuantity}</div>
//                   <div className="text-xs font-medium text-purple-600 dark:text-purple-400">Tổng số lượng</div>
//                 </div>
//                 <div className="text-center p-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800">
//                   <div className="text-lg font-bold text-green-700 dark:text-green-400">{deliveredItems}</div>
//                   <div className="text-xs font-medium text-green-600 dark:text-green-400">Đã giao</div>
//                 </div>
//                 <div className="text-center p-3 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg dark:bg-orange-900/20 dark:border-orange-800">
//                   <div className="text-lg font-bold text-orange-700 dark:text-orange-400">{totalItems - deliveredItems}</div>
//                   <div className="text-xs font-medium text-orange-600 dark:text-orange-400">Chưa giao</div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Spare Parts List */}
//           <div>
//             <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
//               <Package className="h-4 w-4" />
//               Danh sách linh kiện ({request.sparePartUsages?.length || 0} mặt hàng)
//             </h4>
            
//             {request.sparePartUsages && request.sparePartUsages.length > 0 ? (
//               <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
//                 <table className="w-full">
//                   <thead className="bg-slate-50 dark:bg-slate-800">
//                     <tr>
//                       <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Linh kiện</th>
//                       <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Mã linh kiện</th>
//                       <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Số lượng</th>
//                       <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Tồn kho</th>
//                       <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Trạng thái</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
//                     {request.sparePartUsages.map((usage, index) => {
//                       const sparePart = usage.spareparts?.[0];
                      
//                       return (
//                         <tr key={usage.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
//                           <td className="px-4 py-3">
//                             <div className="font-medium text-slate-900 dark:text-slate-100">
//                               {sparePart?.sparepartName || 'Tên linh kiện không xác định'}
//                             </div>
//                             {sparePart?.description && (
//                               <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
//                                 {sparePart.description}
//                               </div>
//                             )}
//                           </td>
//                           <td className="px-4 py-3">
//                             <code className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-sm">
//                               {sparePart?.sparepartCode || 'N/A'}
//                             </code>
//                           </td>
//                           <td className="px-4 py-3">
//                             <span className="font-semibold text-slate-900 dark:text-slate-100">
//                               {usage.quantityUsed}
//                             </span>
//                           </td>
//                           <td className="px-4 py-3">
//                             <span className="text-slate-600 dark:text-slate-400">
//                               {sparePart?.stockQuantity ?? 'N/A'}
//                             </span>
//                           </td>
//                           <td className="px-4 py-3">
//                             <Badge 
//                               variant="secondary" 
//                               className={
//                                 usage.isTakenFromStock 
//                                   ? 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400 dark:border-green-800' 
//                                   : 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800'
//                               }
//                             >
//                               {usage.isTakenFromStock ? 'Đã giao' : 'Chưa giao'}
//                             </Badge>
//                           </td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               </div>
//             ) : (
//               <div className="text-center py-8 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
//                 <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
//                 <p>Không có linh kiện nào trong yêu cầu này</p>
//               </div>
//             )}
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }
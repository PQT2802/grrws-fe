// 'use client';

// import { useState, useEffect } from 'react';
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { Badge } from "@/components/ui/badge";
// import { Calendar, User, Settings, FileText, ArrowRightLeft, Clock, CheckCircle, XCircle, AlertCircle, Package } from "lucide-react";
// import { MACHINE_REPLACEMENT_REQUEST } from "@/types/sparePart.type";
// import { MACHINE_WEB, DEVICE_WEB } from "@/types/device.type";
// import { apiClient } from "@/lib/api-client";
// import { Skeleton } from "@/components/ui/skeleton";

// interface MachineRequestDetailModalProps {
//   request: MACHINE_REPLACEMENT_REQUEST | null;
//   isOpen: boolean;
//   onClose: () => void;
// }

// export default function MachineRequestDetailModal({ 
//   request, 
//   isOpen, 
//   onClose 
// }: MachineRequestDetailModalProps) {
  
//   const [machine, setMachine] = useState<MACHINE_WEB | null>(null);
//   const [oldDevice, setOldDevice] = useState<DEVICE_WEB | null>(null);
//   const [newDevice, setNewDevice] = useState<DEVICE_WEB | null>(null);
//   const [isLoadingDetails, setIsLoadingDetails] = useState(false);

//   // Fetch machine and device details when modal opens
//   useEffect(() => {
//     const fetchDetails = async () => {
//       if (!request || !isOpen) return;

//       setIsLoadingDetails(true);
//       try {
//         // Fetch machine info using the machine ID - Fixed data access
//         const machinePromise = request.machineId 
//           ? apiClient.machine.getMachines(1, 100).then(response => {
//               // Fix: Handle different response structures properly
//               let machines: MACHINE_WEB[] = [];
              
//               // Check if response has nested data structure
//               if (response && typeof response === 'object' && 'data' in response) {
//                 const responseData = response.data;
                
//                 // Check if data is nested again
//                 if (responseData && typeof responseData === 'object' && 'data' in responseData && Array.isArray(responseData.data)) {
//                   machines = responseData.data;
//                 } else if (Array.isArray(responseData)) {
//                   machines = responseData;
//                 }
//               } 
//               // If response is directly an array
//               else if (Array.isArray(response)) {
//                 machines = response;
//               }
              
//               return machines.find((m: MACHINE_WEB) => m.id === request.machineId) || null;
//             }).catch(() => null)
//           : Promise.resolve(null);

//         // Fetch device details
//         const oldDevicePromise = request.oldDeviceId 
//           ? apiClient.device.getDeviceById(request.oldDeviceId).catch(() => null)
//           : Promise.resolve(null);

//         const newDevicePromise = request.newDeviceId 
//           ? apiClient.device.getDeviceById(request.newDeviceId).catch(() => null)
//           : Promise.resolve(null);

//         const [machineData, oldDeviceData, newDeviceData] = await Promise.all([
//           machinePromise,
//           oldDevicePromise,
//           newDevicePromise
//         ]);

//         setMachine(machineData);
//         setOldDevice(oldDeviceData);
//         setNewDevice(newDeviceData);
//       } catch (error) {
//         console.error('Failed to fetch request details:', error);
//       } finally {
//         setIsLoadingDetails(false);
//       }
//     };

//     fetchDetails();
//   }, [request, isOpen]);

//   if (!request) return null;

//   const getStatusColor = (status: string) => {
//     switch (status.toLowerCase()) {
//       case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
//       case 'confirmed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
//       case 'inprogress': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
//       case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
//       case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
//       default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
//     }
//   };

//   const getStatusIcon = (status: string) => {
//     switch (status.toLowerCase()) {
//       case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
//       case 'confirmed': return <CheckCircle className="h-4 w-4 text-blue-500" />;
//       case 'inprogress': return <Settings className="h-4 w-4 text-purple-500" />;
//       case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
//       case 'cancelled': return <XCircle className="h-4 w-4 text-red-500" />;
//       default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
//     }
//   };

//   const getVietnameseStatus = (status: string) => {
//     const statusMap: { [key: string]: string } = {
//       'PENDING': 'Đang chờ xử lý',
//       'CONFIRMED': 'Đã xác nhận', 
//       'INPROGRESS': 'Đang thực hiện',
//       'COMPLETED': 'Hoàn thành',
//       'CANCELLED': 'Đã hủy',
//       'REJECTED': 'Từ chối'
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

//   const requestCode = request.title.includes('-') ? request.title.split('-')[0] : `MR-${request.id.slice(0, 8)}`;

//   // Get confirmation data from request - Fixed to use actual data
//   const assigneeConfirm = request.assigneeConfirm ?? false;
//   const stockKeeperConfirm = request.stokkKeeperConfirm ?? false;

//   // Render device information matching Stock Keeper design exactly
//   const renderDeviceInfo = (device: DEVICE_WEB | null, title: string, isOld: boolean = false) => {
//     const borderColor = isOld ? 'border-red-200 dark:border-red-800' : 'border-green-200 dark:border-green-800';
//     const bgColor = isOld ? 'bg-red-50 dark:bg-red-950/10' : 'bg-green-50 dark:bg-green-950/10';
//     const titleColor = isOld ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400';
//     const iconColor = isOld ? 'text-red-600' : 'text-green-600';
    
//     return (
//       <div className={`border ${borderColor} rounded-lg p-4 ${bgColor} transition-all duration-300`}>
//         <div className="flex items-center gap-2 mb-4">
//           {isOld ? (
//             <Package className={`h-5 w-5 ${iconColor}`} />
//           ) : (
//             <Settings className={`h-5 w-5 ${iconColor}`} />
//           )}
//           <h3 className={`font-semibold ${titleColor}`}>
//             {title}
//           </h3>
//         </div>
        
//         {device ? (
//           <div className="space-y-3">
//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <p className="text-sm text-gray-600 dark:text-gray-400">Tên thiết bị</p>
//                 <p className="font-medium">{device.deviceName}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-600 dark:text-gray-400">Mã thiết bị</p>
//                 <p className="font-medium">{device.deviceCode}</p>
//               </div>
//             </div>
            
//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <p className="text-sm text-gray-600 dark:text-gray-400">Số seri</p>
//                 <p className="font-medium">{device.serialNumber}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-600 dark:text-gray-400">Model</p>
//                 <p className="font-medium">{device.model}</p>
//               </div>
//             </div>
            
//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <p className="text-sm text-gray-600 dark:text-gray-400">Nhà sản xuất</p>
//                 <p className="font-medium">{device.manufacturer}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-600 dark:text-gray-400">Trạng thái</p>
//                 <p className={`font-medium ${isOld ? 'text-red-600' : 'text-green-600'}`}>
//                   {device.status}
//                 </p>
//               </div>
//             </div>
            
//             {device.description && (
//               <div>
//                 <p className="text-sm text-gray-600 dark:text-gray-400">Mô tả</p>
//                 <p className="font-medium text-sm">{device.description}</p>
//               </div>
//             )}
            
//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <p className="text-sm text-gray-600 dark:text-gray-400">Ngày sản xuất</p>
//                 <p className="font-medium text-sm">{formatDate(device.manufactureDate)}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-600 dark:text-gray-400">Ngày lắp đặt</p>
//                 <p className="font-medium text-sm">{formatDate(device.installationDate)}</p>
//               </div>
//             </div>
            
//             {device.zoneName && (
//               <div>
//                 <p className="text-sm text-gray-600 dark:text-gray-400">Vị trí</p>
//                 <p className="font-medium text-sm">{device.zoneName} - {device.areaName}</p>
//               </div>
//             )}
//           </div>
//         ) : (
//           <div className="text-center py-4">
//             <p className="text-gray-500 dark:text-gray-400">Không thể tải thông tin thiết bị</p>
//           </div>
//         )}
//       </div>
//     );
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle className="text-xl font-semibold text-slate-800 dark:text-slate-200">
//             Chi tiết yêu cầu thiết bị: {requestCode}
//           </DialogTitle>
//         </DialogHeader>
        
//         <div className="space-y-6">
//           {/* Request Header */}
//           <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
//             <div className="flex items-start justify-between mb-4">
//               <div>
//                 <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
//                   {request.title}
//                 </div>
//               </div>
//               <div className="flex items-center gap-2">
//                 {getStatusIcon(request.status)}
//                 <Badge className={getStatusColor(request.status)}>
//                   {getVietnameseStatus(request.status)}
//                 </Badge>
//               </div>
//             </div>
//           </div>

//           {/* Request Information Grid */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             {/* Request Information */}
//             <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
//               <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
//                 <FileText className="h-4 w-4" />
//                 Thông tin yêu cầu
//               </h4>
//               <div className="space-y-3 text-sm">
//                 <div>
//                   <span className="font-medium text-slate-700 dark:text-slate-300">Người gửi:</span>
//                   <p className="text-slate-600 dark:text-slate-400">
//                     {request.assigneeName || 'Chưa có người nhận'}
//                   </p>
//                 </div>
//                 <div>
//                   <span className="font-medium text-slate-700 dark:text-slate-300">Ngày yêu cầu:</span>
//                   <p className="text-slate-600 dark:text-slate-400">{formatDate(request.requestDate)}</p>
//                 </div>
//                 <div>
//                   <span className="font-medium text-slate-700 dark:text-slate-300">Ghi chú:</span>
//                   <p className="text-slate-600 dark:text-slate-400">{request.description || 'Không có ghi chú'}</p>
//                 </div>
//               </div>
//             </div>

//             {/* Machine Information - Improved 2-column layout */}
//             <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
//               <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
//                 <Settings className="h-4 w-4" />
//                 Thông tin máy móc
//               </h4>
//               {isLoadingDetails ? (
//                 <div className="space-y-2">
//                   <Skeleton className="h-4 w-full" />
//                   <Skeleton className="h-4 w-3/4" />
//                   <Skeleton className="h-4 w-1/2" />
//                 </div>
//               ) : machine ? (
//                 <div className="grid grid-cols-2 gap-3 text-sm">
//                   <div>
//                     <span className="font-medium text-slate-700 dark:text-slate-300">Tên máy:</span>
//                     <p className="text-slate-600 dark:text-slate-400">{machine.machineName}</p>
//                   </div>
//                   <div>
//                     <span className="font-medium text-slate-700 dark:text-slate-300">Mã máy:</span>
//                     <p className="text-slate-600 dark:text-slate-400">{machine.machineCode}</p>
//                   </div>
//                   <div>
//                     <span className="font-medium text-slate-700 dark:text-slate-300">Nhà sản xuất:</span>
//                     <p className="text-slate-600 dark:text-slate-400">{machine.manufacturer}</p>
//                   </div>
//                   <div>
//                     <span className="font-medium text-slate-700 dark:text-slate-300">Model:</span>
//                     <p className="text-slate-600 dark:text-slate-400">{machine.model}</p>
//                   </div>
//                   <div className="col-span-2">
//                     <span className="font-medium text-slate-700 dark:text-slate-300">Trạng thái:</span>
//                     <p className="text-slate-600 dark:text-slate-400">{machine.status}</p>
//                   </div>
//                 </div>
//               ) : (
//                 <p className="text-slate-500 text-sm">Không thể tải thông tin máy móc</p>
//               )}
//             </div>
//           </div>

//           {/* Confirmation Section - Using AdminQuickActions color palette */}
//           <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
//             <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
//               <CheckCircle className="h-4 w-4" />
//               Xác nhận yêu cầu
//             </h4>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-600">
//                 <div>
//                   <div className="font-medium text-sm">Xác nhận từ thợ máy</div>
//                   <div className="text-xs text-slate-500">Assignee Confirmation</div>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   {assigneeConfirm ? (
//                     <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
//                   ) : (
//                     <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
//                   )}
//                   <Badge 
//                     variant="secondary" 
//                     className={
//                       assigneeConfirm 
//                         ? "bg-green-50 hover:bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400 dark:border-green-800"
//                         : "bg-red-50 hover:bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 dark:border-red-800"
//                     }
//                   >
//                     {assigneeConfirm ? "Đã xác nhận" : "Chưa xác nhận"}
//                   </Badge>
//                 </div>
//               </div>
//               <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-600">
//                 <div>
//                   <div className="font-medium text-sm">Xác nhận từ thủ kho</div>
//                   <div className="text-xs text-slate-500">Stock Keeper Confirmation</div>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   {stockKeeperConfirm ? (
//                     <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
//                   ) : (
//                     <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
//                   )}
//                   <Badge 
//                     variant="secondary" 
//                     className={
//                       stockKeeperConfirm 
//                         ? "bg-green-50 hover:bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400 dark:border-green-800"
//                         : "bg-red-50 hover:bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 dark:border-red-800"
//                     }
//                   >
//                     {stockKeeperConfirm ? "Đã xác nhận" : "Chưa xác nhận"}
//                   </Badge>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Device Replacement Information - Matching Stock Keeper exact design */}
//           <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6">
//             <div className="flex items-center gap-2 mb-6">
//               <ArrowRightLeft className="h-5 w-5 text-gray-600" />
//               <h2 className="text-lg font-semibold">Chi tiết thiết bị thay thế</h2>
//             </div>
            
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//               {/* Old Device */}
//               {renderDeviceInfo(oldDevice, "Thiết bị hiện tại (sẽ thay thế)", true)}
              
//               {/* New Device */}
//               {renderDeviceInfo(newDevice, "Thiết bị thay thế mới", false)}
//             </div>
//           </div>

//           {/* Status Timeline - Fixed Colors */}
//           <div className="rounded-lg p-4 border border-slate-200 dark:border-slate-700">
//             <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-4">
//               Tiến trình yêu cầu
//             </h4>
//             <div className="relative">
//               <div className="flex items-center justify-between">
//                 <div className={`flex flex-col items-center ${
//                   ['pending', 'confirmed', 'completed'].includes(request.status.toLowerCase()) ? 'text-blue-600' : 'text-gray-400'
//                 }`}>
//                   <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
//                     ['pending', 'confirmed', 'completed'].includes(request.status.toLowerCase()) 
//                       ? 'bg-blue-100 dark:bg-blue-900/30' 
//                       : 'bg-gray-100 dark:bg-gray-700'
//                   }`}>
//                     <CheckCircle className="h-4 w-4" />
//                   </div>
//                   <div className="text-xs mt-1 text-center">Đang chờ</div>
//                 </div>
                
//                 <div className={`flex flex-col items-center ${
//                   ['inprogress', 'completed'].includes(request.status.toLowerCase()) ? 'text-purple-600' : 'text-gray-400'
//                 }`}>
//                   <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
//                     ['inprogress', 'completed'].includes(request.status.toLowerCase()) 
//                       ? 'bg-purple-100 dark:bg-purple-900/30' 
//                       : 'bg-gray-100 dark:bg-gray-700'
//                   }`}>
//                     <Settings className="h-4 w-4" />
//                   </div>
//                   <div className="text-xs mt-1 text-center">Xác nhận</div>
//                 </div>
                
//                 <div className={`flex flex-col items-center ${
//                   request.status.toLowerCase() === 'completed' ? 'text-green-600' : 'text-gray-400'
//                 }`}>
//                   <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
//                     request.status.toLowerCase() === 'completed' 
//                       ? 'bg-green-100 dark:bg-green-900/30' 
//                       : 'bg-gray-100 dark:bg-gray-700'
//                   }`}>
//                     <CheckCircle className="h-4 w-4" />
//                   </div>
//                   <div className="text-xs mt-1 text-center">Hoàn thành</div>
//                 </div>
//               </div>
              
//               {/* Progress Line */}
//               <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200 dark:bg-gray-600 -z-10">
//                 <div 
//                   className={`h-full transition-all duration-300 ${
//                     request.status.toLowerCase() === 'completed' ? 'w-full bg-green-500' :
//                     request.status.toLowerCase() === 'confirmed' ? 'w-1/2 bg-purple-500' :
//                     request.status.toLowerCase() === 'pending' ? 'w-1 bg-blue-500' :
//                     'w-0 bg-blue-500'
//                   }`}
//                 />
//               </div>
//             </div>
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }
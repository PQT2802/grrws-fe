// "use client";

// import { useState, useEffect } from "react";
// import { X, Upload, AlertCircle, CheckCircle } from "lucide-react";
// import { sparePartService } from "@/app/service/sparePart.service";
// import { toast } from "react-toastify";

// interface Supplier {
//   id: string;
//   name: string;
// }

// interface ImportSparePartModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSuccess: () => void; // Callback to refresh inventory after successful import
// }

// export default function ImportSparePartModal({
//   isOpen,
//   onClose,
//   onSuccess
// }: ImportSparePartModalProps) {
//   // Form state
//   const [formData, setFormData] = useState({
//     sparepartCode: "",
//     sparepartName: "",
//     description: "",
//     specification: "",
//     stockQuantity: 0,
//     unit: "Cái",
//     unitPrice: 0,
//     expectedAvailabilityDate: "",
//     supplierId: "",
//     category: ""
//   });

//   // Additional state for UI
//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [imageFile, setImageFile] = useState<File | null>(null);
//   const [imagePreview, setImagePreview] = useState<string | null>(null);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [suppliers, setSuppliers] = useState<Supplier[]>([]);
//   const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);

//   // Reset form when modal opens
//   useEffect(() => {
//     if (isOpen) {
//       setFormData({
//         sparepartCode: "",
//         sparepartName: "",
//         description: "",
//         specification: "",
//         stockQuantity: 0,
//         unit: "Cái",
//         unitPrice: 0,
//         expectedAvailabilityDate: "",
//         supplierId: "",
//         category: ""
//       });
//       setImageFile(null);
//       setImagePreview(null);
//       setErrors({});
//       setIsSubmitting(false);
//       fetchSuppliers();
//     }
//   }, [isOpen]);

//   // Fetch suppliers for dropdown
//   const fetchSuppliers = async () => {
//     try {
//       setIsLoadingSuppliers(true);
//       // Replace with your actual API call
//       // For now, we'll use mock data
//       const mockSuppliers = [
//         { id: "50000000-0000-0000-0000-000000000001", name: "Công ty máy may Juki" },
//         { id: "50000000-0000-0000-0000-000000000002", name: "Công ty máy may gia đình Brother" }
//       ];
//       setSuppliers(mockSuppliers);
//     } catch (error) {
//       console.error("Error fetching suppliers:", error);
//       toast.error("Failed to load suppliers list");
//     } finally {
//       setIsLoadingSuppliers(false);
//     }
//   };

//   // Handle input changes
//   const handleChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
//   ) => {
//     const { name, value, type } = e.target;
//     let parsedValue: string | number = value;

//     // Parse numeric values
//     if (type === "number") {
//       parsedValue = value === "" ? 0 : Number(value);
//     }

//     setFormData((prev) => ({
//       ...prev,
//       [name]: parsedValue
//     }));

//     // Clear error when field is modified
//     if (errors[name]) {
//       setErrors((prev) => {
//         const newErrors = { ...prev };
//         delete newErrors[name];
//         return newErrors;
//       });
//     }
//   };

//   // Handle file input change
//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       setImageFile(file);
//       // Create preview URL
//       const reader = new FileReader();
//       reader.onload = () => {
//         setImagePreview(reader.result as string);
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   // Validate form
//   const validateForm = (): boolean => {
//     const newErrors: Record<string, string> = {};

//     // Required fields
//     if (!formData.sparepartCode.trim()) {
//       newErrors.sparepartCode = "Spare part code is required";
//     }
//     if (!formData.sparepartName.trim()) {
//       newErrors.sparepartName = "Spare part name is required";
//     }

//     // Validate numbers
//     if (formData.stockQuantity < 0) {
//       newErrors.stockQuantity = "Stock quantity cannot be negative";
//     }
//     if (formData.unitPrice < 0) {
//       newErrors.unitPrice = "Unit price cannot be negative";
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   // Handle form submission
//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
    
//     if (!validateForm()) {
//       return;
//     }
    
//     setIsSubmitting(true);
    
//     try {
//       // Prepare form data for API call
//       const apiData = new FormData();
      
//       // Add all form fields
//       Object.entries(formData).forEach(([key, value]) => {
//         if (value !== "") {
//           apiData.append(key, String(value));
//         }
//       });
      
//       // Add image file if exists
//       if (imageFile) {
//         apiData.append('imageFile', imageFile);
//       }
      
//       // Make API call
//       const result = await sparePartService.importSparePart(apiData);
      
//       toast.success("Spare part imported successfully!");
//       onSuccess(); // Refresh inventory
//       onClose(); // Close modal
//     } catch (error) {
//       console.error("Error importing spare part:", error);
//       toast.error("Failed to import spare part. Please try again.");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   // Close on escape key
//   useEffect(() => {
//     const handleEsc = (e: KeyboardEvent) => {
//       if (e.key === "Escape") onClose();
//     };
//     window.addEventListener("keydown", handleEsc);
//     return () => window.removeEventListener("keydown", handleEsc);
//   }, [onClose]);

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
//       <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
//         <div className="p-4 flex justify-between items-center border-b dark:border-gray-700">
//           <h2 className="text-lg font-bold">Import Spare Part</h2>
//           <button
//             onClick={onClose}
//             className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
//           >
//             <X className="h-5 w-5" />
//           </button>
//         </div>

//         <form onSubmit={handleSubmit} className="p-6">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             {/* Left Column */}
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium mb-1">
//                   Spare Part Code* <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   type="text"
//                   name="sparepartCode"
//                   value={formData.sparepartCode}
//                   onChange={handleChange}
//                   className={`w-full border ${
//                     errors.sparepartCode ? "border-red-500" : "border-gray-300 dark:border-gray-600"
//                   } rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-700`}
//                   required
//                 />
//                 {errors.sparepartCode && (
//                   <p className="mt-1 text-sm text-red-500">{errors.sparepartCode}</p>
//                 )}
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1">
//                   Spare Part Name <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   type="text"
//                   name="sparepartName"
//                   value={formData.sparepartName}
//                   onChange={handleChange}
//                   className={`w-full border ${
//                     errors.sparepartName ? "border-red-500" : "border-gray-300 dark:border-gray-600"
//                   } rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-700`}
//                   required
//                 />
//                 {errors.sparepartName && (
//                   <p className="mt-1 text-sm text-red-500">{errors.sparepartName}</p>
//                 )}
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1">Description</label>
//                 <textarea
//                   name="description"
//                   value={formData.description}
//                   onChange={handleChange}
//                   rows={3}
//                   className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-700"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1">Specification</label>
//                 <textarea
//                   name="specification"
//                   value={formData.specification}
//                   onChange={handleChange}
//                   rows={2}
//                   className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-700"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1">Upload Image</label>
//                 <div className="flex items-center gap-3">
//                   <label className="cursor-pointer flex items-center justify-center border border-dashed border-gray-300 dark:border-gray-600 hover:border-primary rounded-md p-4 h-24 w-full">
//                     <input
//                       type="file"
//                       accept="image/*"
//                       className="hidden"
//                       onChange={handleFileChange}
//                     />
//                     <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
//                       <Upload className="h-6 w-6 mb-1" />
//                       <span className="text-sm">Click to upload image</span>
//                     </div>
//                   </label>
                  
//                   {imagePreview && (
//                     <div className="relative h-24 w-24 border dark:border-gray-700 rounded-md overflow-hidden">
//                       <img
//                         src={imagePreview}
//                         alt="Preview"
//                         className="h-full w-full object-cover"
//                       />
//                       <button
//                         type="button"
//                         onClick={() => {
//                           setImageFile(null);
//                           setImagePreview(null);
//                         }}
//                         className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
//                       >
//                         <X className="h-4 w-4" />
//                       </button>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>

//             {/* Right Column */}
//             <div className="space-y-4">
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium mb-1">Stock Quantity</label>
//                   <input
//                     type="number"
//                     name="stockQuantity"
//                     value={formData.stockQuantity}
//                     onChange={handleChange}
//                     min={0}
//                     className={`w-full border ${
//                       errors.stockQuantity ? "border-red-500" : "border-gray-300 dark:border-gray-600"
//                     } rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-700`}
//                   />
//                   {errors.stockQuantity && (
//                     <p className="mt-1 text-sm text-red-500">{errors.stockQuantity}</p>
//                   )}
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium mb-1">Unit</label>
//                   <select
//                     name="unit"
//                     value={formData.unit}
//                     onChange={handleChange}
//                     className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-700"
//                   >
//                     <option value="Cái">Cái</option>
//                     <option value="Bộ">Bộ</option>
//                   </select>
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1">Unit Price</label>
//                 <div className="relative">
//                   <span className="absolute left-3 top-2.5">₫</span>
//                   <input
//                     type="number"
//                     name="unitPrice"
//                     value={formData.unitPrice}
//                     onChange={handleChange}
//                     min={0}
//                     step={0.01}
//                     className={`w-full pl-7 border ${
//                       errors.unitPrice ? "border-red-500" : "border-gray-300 dark:border-gray-600"
//                     } rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-700`}
//                   />
//                 </div>
//                 {errors.unitPrice && (
//                   <p className="mt-1 text-sm text-red-500">{errors.unitPrice}</p>
//                 )}
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1">
//                   Expected Availability Date
//                 </label>
//                 <input
//                   type="date"
//                   name="expectedAvailabilityDate"
//                   value={formData.expectedAvailabilityDate}
//                   onChange={handleChange}
//                   className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-700"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1">Category</label>
//                 <input
//                   type="text"
//                   name="category"
//                   value={formData.category}
//                   onChange={handleChange}
//                   className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-700"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1">Supplier</label>
//                 <select
//                   name="supplierId"
//                   value={formData.supplierId}
//                   onChange={handleChange}
//                   className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-700"
//                   disabled={isLoadingSuppliers}
//                 >
//                   <option value="">Select a supplier</option>
//                   {suppliers.map((supplier) => (
//                     <option key={supplier.id} value={supplier.id}>
//                       {supplier.name}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             </div>
//           </div>

//           <div className="mt-8 flex justify-end gap-3">
//             <button
//               type="button"
//               onClick={onClose}
//               className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
//               disabled={isSubmitting}
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               className="px-4 py-2 bg-primary text-white rounded-md text-sm flex items-center gap-2"
//               disabled={isSubmitting}
//             >
//               {isSubmitting ? (
//                 <>
//                   <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
//                   <span>Importing...</span>
//                 </>
//               ) : (
//                 <>
//                   <Upload className="h-4 w-4" />
//                   <span>Import Spare Part</span>
//                 </>
//               )}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }
"use client";

import { X, AlertTriangle, MapPin, Calendar, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { PartDetailModalProps } from "../../type";
import UpdateQuantityModal from "./UpdateQuantityModal";

export default function PartDetailModal({ isOpen, onClose, part }: PartDetailModalProps) {
  const isLowStock = part.quantity < part.minThreshold;
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // Close modal on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  // Handle form submission
  const handleUpdateSubmit = (data: { date: string; qty: number; method: string}) => {
    // Here you would typically call an API to update the quantity
    console.log("Updating quantity:", {
      partId: part.id,
      ...data
    });
    
    // For demo purposes, show an alert
    alert(`Updated ${part.name} quantity by ${data.qty} units (${data.method})`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 flex justify-between items-center border-b dark:border-gray-700">
          <h2 className="text-lg font-bold">{part.name}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left side - Image */}
            <div className="md:w-1/3">
              <div className="bg-gray-100 dark:bg-slate-700 rounded-lg p-4 flex items-center justify-center h-48">
                <img
                  src={part.image || "/assets/parts/placeholder.jpg"}
                  alt={part.name}
                  className="max-h-40 max-w-full object-contain"
                  onError={(e) => {
                    // Avoid infinite loop by checking current src
                    if (!e.currentTarget.src.includes("placeholder.jpg")) {
                      e.currentTarget.src = "/assets/parts/placeholder.jpg";
                    }
                  }}
                />
              </div>

              <div
                className={`mt-4 p-3 rounded-lg ${
                  isLowStock
                    ? "bg-red-50 dark:bg-red-900/20"
                    : "bg-green-50 dark:bg-green-900/20"
                }`}
              >
                {/* Stock information - unchanged */}
                <div className="flex items-center gap-2">
                  {isLowStock ? (
                    <>
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <span className="font-medium text-red-600 dark:text-red-400">
                        Low Stock
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        In Stock
                      </span>
                    </>
                  )}
                </div>
                <div className="mt-2 text-sm">
                  <div className="flex justify-between">
                    <span>Current Stock:</span>
                    <span className="font-bold">
                      {part.quantity} {part.unit}
                    </span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>Min Threshold:</span>
                    <span>
                      {part.minThreshold} {part.unit}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Details */}
            <div className="md:w-2/3">
              <h3 className="font-medium text-lg mb-2">Part Details</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {part.description}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-gray-500">Machine Type</div>
                    <div className="font-medium">{part.machineType}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <div className="text-gray-500 w-4 h-4 flex items-center justify-center">
                    #
                  </div>
                  <div>
                    <div className="text-gray-500">Category</div>
                    <div className="font-medium">{part.category}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-gray-500">Imported Date</div>
                    <div className="font-medium">{part.importedDate}</div>
                  </div>
                </div>

                {part.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="text-gray-500">Storage Location</div>
                      <div className="font-medium">{part.location}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 flex flex-col gap-2">
                <h3 className="font-medium text-sm">
                  Part ID: <span className="font-normal">{part.id}</span>
                </h3>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t dark:border-gray-700 p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
          >
            Close
          </button>
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm"
            onClick={() => setShowUpdateModal(true)}
          >
            Update Quantity
          </button>
          {isLowStock && (
            <button className="px-4 py-2 bg-green-500 text-white rounded-md text-sm">
              Order More
            </button>
          )}
        </div>
      </div>

      {/* Update Quantity Modal */}
      <UpdateQuantityModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        onSubmit={handleUpdateSubmit}
        defaultMethod="Import"
      />
    </div>
  );
}
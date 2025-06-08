"use client";
import { AlertTriangle } from "lucide-react";
import { PartCardProps } from "../../type";

export default function PartCard({ part, onClick }: PartCardProps) {
  const isLowStock = part.quantity < part.minThreshold;
  console.log(part);
  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-lg p-4 shadow transition-all duration-200 
        hover:shadow-lg border-l-4 cursor-pointer ${isLowStock ? "border-l-red-500" : "border-l-green-500"}`}
      onClick={() => onClick(part)}
    >
      <div className="flex items-center mb-3">
        <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded flex items-center justify-center mr-3">
          <img
            src={part.image}
            alt={part.name}
            className="w-12 h-12 object-contain"
          />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-sm">{part.name}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{part.machineType}</p>
        </div>
      </div>
      <div className="flex justify-between items-center text-sm">
        <div>
          <span className="font-semibold">Stock: </span>
          <span className={isLowStock ? "text-red-500 font-bold" : "text-green-500"}>
            {part.quantity} {part.unit}
          </span>
        </div>
        <div className="text-xs text-gray-500">Min: {part.minThreshold}</div>
      </div>
      {isLowStock && (
        <div className="mt-2 flex items-center gap-1 text-red-500 text-xs">
          <AlertTriangle size={12} />
          <span>Low stock</span>
        </div>
      )}
    </div>
  );
}
"use client";
import { AlertTriangle } from "lucide-react";
import { PartCardProps } from "../../type";

export default function PartCard({ part, onClick }: PartCardProps) {
  const isLowStock = part.quantity < part.minThreshold;
  const isOutOfStock = part.quantity === 0;
  
  return (
    <div
      className={`bg-card rounded-lg p-4 shadow transition-all duration-200 
        hover:shadow-lg border-l-4 cursor-pointer border border-border ${
          isOutOfStock 
            ? "border-l-red-600" 
            : isLowStock 
            ? "border-l-orange-500" 
            : "border-l-green-500"
        }`}
      onClick={() => onClick(part)}
    >
      <div className="flex items-center mb-3">
        <div className="w-16 h-16 bg-muted rounded flex items-center justify-center mr-3">
          <img
            src={part.image || "/file.svg"}
            alt={part.name}
            className="w-12 h-12 object-contain"
            onError={(e) => {
              if (!e.currentTarget.src.includes("file.svg")) {
                e.currentTarget.src = "/file.svg";
              }
            }}
          />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-sm text-foreground">{part.name}</h3>
          <p className="text-xs text-muted-foreground">{part.category}</p>
        </div>
      </div>
      <div className="flex justify-between items-center text-sm">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">Tồn kho: </span>
          <span className={
            isOutOfStock 
              ? "text-red-600 font-bold" 
              : isLowStock 
              ? "text-orange-500 font-bold" 
              : "text-green-500"
          }>
            {part.quantity} {part.unit}
          </span>
          
          {isOutOfStock && (
            <div className="flex items-center gap-1 text-red-600 text-xs ml-1">
              <AlertTriangle size={12} />
              <span>Hết hàng</span>
            </div>
          )}
          
          {isLowStock && !isOutOfStock && (
            <div className="flex items-center gap-1 text-orange-500 text-xs ml-1">
              <AlertTriangle size={12} />
              <span>Sắp hết</span>
            </div>
          )}
        </div>
        <div className="text-xs text-muted-foreground">Tối thiểu: {part.minThreshold}</div>
      </div>
    </div>
  );
}
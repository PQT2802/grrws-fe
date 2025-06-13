import { ChevronDown } from "lucide-react";

interface PageSizeSelectorProps {
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  options?: number[];
}

export default function PageSizeSelector({ 
  pageSize, 
  onPageSizeChange,
  options = [10, 20, 50, 100]
}: PageSizeSelectorProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-500">Items per page:</span>
      <div className="relative">
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="appearance-none bg-white dark:bg-slate-700 border rounded-md px-3 py-1 pr-8 focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          {options.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}
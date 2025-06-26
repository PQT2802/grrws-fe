"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  className,
  error = false,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [tempDate, setTempDate] = React.useState<Date | undefined>(value);
  const [selectedYear, setSelectedYear] = React.useState<number>(
    value?.getFullYear() || new Date().getFullYear() - 25
  );
  const [selectedMonth, setSelectedMonth] = React.useState<number>(
    value?.getMonth() || 0
  );
  const [selectedDay, setSelectedDay] = React.useState<number>(
    value?.getDate() || 1
  );

  // Update internal state when value prop changes
  React.useEffect(() => {
    if (value) {
      setTempDate(value);
      setSelectedYear(value.getFullYear());
      setSelectedMonth(value.getMonth());
      setSelectedDay(value.getDate());
    }
  }, [value]);

  // Generate year options (from 1950 to current year)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1949 }, (_, i) => 1950 + i);

  // Month names
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Get days in selected month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Ensure selected day is valid for the current month
  React.useEffect(() => {
    const maxDay = getDaysInMonth(selectedYear, selectedMonth);
    if (selectedDay > maxDay) {
      setSelectedDay(maxDay);
    }
  }, [selectedYear, selectedMonth, selectedDay]);

  const handleConfirm = () => {
    const newDate = new Date(selectedYear, selectedMonth, selectedDay);
    setTempDate(newDate);
    onChange?.(newDate);
    setIsOpen(false);
  };

  const handleCancel = () => {
    // Reset to original value
    if (value) {
      setSelectedYear(value.getFullYear());
      setSelectedMonth(value.getMonth());
      setSelectedDay(value.getDate());
      setTempDate(value);
    } else {
      setSelectedYear(new Date().getFullYear() - 25);
      setSelectedMonth(0);
      setSelectedDay(1);
      setTempDate(undefined);
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    setTempDate(undefined);
    onChange?.(undefined);
    setIsOpen(false);
  };

  // Add this new handler for popover content clicks
  const handlePopoverClick = (e: React.MouseEvent) => {
    // This prevents event bubbling which is causing the issues
    e.stopPropagation();
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !tempDate && "text-muted-foreground",
            error && "border-red-500",
            className
          )}
          disabled={disabled}
          onClick={(e) => {
            // Stop propagation to prevent modal closing
            e.stopPropagation();
          }}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {tempDate ? format(tempDate, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0" 
        align="start"
        onClick={handlePopoverClick}
      >
        <div className="p-4 space-y-4" onClick={handlePopoverClick}>
          {/* Header */}
          <div className="text-sm font-medium text-center">Select Date</div>
          
          {/* Year and Month Selectors */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Year</label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-48">
                  {years.reverse().map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Month</label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) => setSelectedMonth(parseInt(value))}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-48">
                  {months.map((month, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Day Selector */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Day</label>
            <Select
              value={selectedDay.toString()}
              onValueChange={(value) => setSelectedDay(parseInt(value))}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-48">
                {days.map((day) => (
                  <SelectItem key={day} value={day.toString()}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Selected Date:</div>
            <div className="text-sm font-medium">
              {format(new Date(selectedYear, selectedMonth, selectedDay), "PPP")}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            {tempDate && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                className="flex-1"
              >
                Clear
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleConfirm}
              className="flex-1"
            >
              Confirm
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
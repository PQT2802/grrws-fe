"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TimePickerDemo } from "./time-picker-demo";
import { toast } from "react-toastify";

interface PropType {
  date: Date;
  setDate: (date: Date | undefined) => void;
  minDate?: Date;
  disabled?: (date: Date) => boolean;
}

export function DateTimePicker({ date, setDate, minDate, disabled }: PropType) {
  // Function to check if date is in the past
  const isDateInPast = (date: Date) => {
    const now = new Date();
    now.setSeconds(0, 0);
    date.setSeconds(0, 0);
    return date < now;
  };

  // Create a default minDate if not provided (current date)
  const defaultMinDate = React.useMemo(() => new Date(), []);

  // Handle date selection
  const handleSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) return;

    // Copy time from current selection to new date
    if (date) {
      selectedDate.setHours(
        date.getHours(),
        date.getMinutes(),
        date.getSeconds()
      );
    }

    // Validate the date is not in the past
    if (isDateInPast(new Date(selectedDate.getTime()))) {
      toast.error("Không thể chọn thời gian trong quá khứ");
      return;
    }

    setDate(selectedDate);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "dd/MM/yyyy HH:mm") : <span>Chọn ngày</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => handleSelect(d)}
          initialFocus
          disabled={(date) => {
            // Combine both disabled functions
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // If custom disabled function provided, use it
            if (disabled && disabled(date)) return true;

            // Otherwise use minDate or default minDate
            const minDateToUse = minDate || defaultMinDate;
            const minDateCopy = new Date(minDateToUse);
            minDateCopy.setHours(0, 0, 0, 0);

            return date < minDateCopy;
          }}
        />
        <div className="p-3 border-t border-border">
          <TimePickerDemo setDate={setDate} date={date} />
        </div>
      </PopoverContent>
    </Popover>
  );
}

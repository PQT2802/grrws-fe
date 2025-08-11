"use client";

import { useState, useEffect, useRef } from "react";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { toast } from "react-toastify";

interface DateTimeSelectorProps {
  date: Date;
  setDate: (date: Date | undefined) => void;
  minDate?: Date;
}

export function DateTimeSelector({
  date,
  setDate,
  minDate,
}: DateTimeSelectorProps) {
  // Use refs to track previous values and prevent update loops
  const prevDateRef = useRef<Date>(date);
  const [selectedDate, setSelectedDate] = useState<Date>(date);
  const [hour, setHour] = useState<string>(
    date.getHours().toString().padStart(2, "0")
  );
  const [minute, setMinute] = useState<string>(
    date.getMinutes().toString().padStart(2, "0")
  );

  const hours = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, "0")
  );
  const minutes = Array.from({ length: 12 }, (_, i) =>
    (i * 5).toString().padStart(2, "0")
  );

  // Sync internal state when props change, but only if actually different
  useEffect(() => {
    if (date && prevDateRef.current.getTime() !== date.getTime()) {
      setHour(date.getHours().toString().padStart(2, "0"));
      setMinute(date.getMinutes().toString().padStart(2, "0"));
      setSelectedDate(date);
      prevDateRef.current = date;
    }
  }, [date]);

  // Check if date is in the past
  const isDateInPast = (date: Date) => {
    const now = new Date();
    now.setSeconds(0, 0);
    date.setSeconds(0, 0);
    return date < now;
  };

  // Handle explicit user changes, not automatic updates
  const handleCalendarSelect = (newDate: Date | undefined) => {
    if (!newDate) return;

    // Keep the current time
    newDate.setHours(parseInt(hour, 10), parseInt(minute, 10));

    if (isDateInPast(newDate)) {
      toast.error("Không thể chọn thời gian trong quá khứ");
      return;
    }

    setSelectedDate(newDate);
    prevDateRef.current = newDate;
    setDate(newDate);
  };

  const handleTimeChange = (newHour?: string, newMinute?: string) => {
    const updatedHour = newHour || hour;
    const updatedMinute = newMinute || minute;

    const newDate = new Date(selectedDate);
    newDate.setHours(parseInt(updatedHour, 10), parseInt(updatedMinute, 10));

    if (isDateInPast(newDate)) {
      toast.error("Không thể chọn thời gian trong quá khứ");
      return;
    }

    if (newHour) setHour(newHour);
    if (newMinute) setMinute(newMinute);

    prevDateRef.current = newDate;
    setDate(newDate);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-[180px] justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(selectedDate, "dd/MM/yyyy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleCalendarSelect}
              initialFocus
              disabled={(date) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return minDate ? date < minDate : date < today;
              }}
            />
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4 text-gray-500" />
          <Select
            value={hour}
            onValueChange={(value) => handleTimeChange(value, undefined)}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue placeholder="Giờ" />
            </SelectTrigger>
            <SelectContent>
              {hours.map((h) => (
                <SelectItem key={h} value={h}>
                  {h}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>:</span>
          <Select
            value={minute}
            onValueChange={(value) => handleTimeChange(undefined, value)}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue placeholder="Phút" />
            </SelectTrigger>
            <SelectContent>
              {minutes.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="text-xs text-gray-500">
        {format(selectedDate, "dd/MM/yyyy")} lúc {hour}:{minute}
      </div>
    </div>
  );
}

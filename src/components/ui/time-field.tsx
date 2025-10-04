"use client";

import * as React from "react";
import { Input } from "./input";

export interface TimeFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onTimeChange?: (value: string) => void;
}

const TimeField = React.forwardRef<HTMLInputElement, TimeFieldProps>(
  ({ className, onTimeChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onTimeChange) {
        onTimeChange(e.target.value);
      }
      if (props.onChange) {
        props.onChange(e);
      }
    };

    return (
      <Input
        type="time"
        className={className}
        ref={ref}
        onChange={handleChange}
        {...props}
      />
    );
  }
);

TimeField.displayName = "TimeField";

export { TimeField };
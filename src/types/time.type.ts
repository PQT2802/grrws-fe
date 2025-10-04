export interface Holiday {
  id: string;
  holidayDate: string; // ISO string
  description: string;
}
export interface Shift {
  id: string;
  shiftName: string;
  startTime: string; // "HH:mm:ss"
  endTime: string;   // "HH:mm:ss"
  isActive: boolean;
  isOfficeHour: boolean;
}
export interface WorkingHoursConfig {
  workingDays: string[]; // e.g., ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  officeHourShifts: Shift[];
}
export interface WorkingHoursCheckData {
  checkedDateTime: string; // ISO string
  isWithinWorkingHours: boolean;
}
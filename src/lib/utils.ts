import { KANBAN_COLUMN_TYPE } from "@/types";
import { clsx, type ClassValue } from "clsx";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import { twMerge } from "tailwind-merge";

dayjs.extend(relativeTime);
dayjs.extend(utc);

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const COLLECTION_NAME = {
  ["WORKSPACE_LIST"]: "workspace-list",
  ["WORKSPACE_JOIN_LIST"]: "workspace-join-list",
  ["PROJECT_LIST"]: "project-list",
  ["TASK_LIST"]: "task-list",
  ["USER_LIST"]: "user-list",
  ["NOTIFICATION_LIST"]: "notification-list",
};

export const getFirstLetterUppercase = (name: string) => {
  return name.split("")[0].toUpperCase();
};

// Convert ISO string to formatted date string
export const formatISODate = (
  isoString: string | null | undefined,
  type: "date" | "datetime"
) => {
  if (!isoString) return "Invalid date";

  const date = new Date(isoString);

  if (type === "date") return dayjs(date).format("DD/MM/YYYY");
  if (type === "datetime") return dayjs(date).format("DD/MM/YYYY HH:mm:ss");
};

// Convert Date to ISO string
export const convertToISOString = (date: Date): string => {
  return date.toISOString();
};

// Format Date to string dd/mm/yyyy hh:mm:ss
export const formatToDateStr = (date: Date) => {
  return dayjs(date).format("DD/MM/YYYY HH:mm:ss");
};

// Format Date for API (ISO string)
export const formatDateForAPI = (date: Date) => {
  return date.toISOString();
};

// Convert ISO string to Date object
export const convertISOStringToDate = (
  isoString: string | null | undefined
) => {
  if (!isoString) return null;
  return new Date(isoString);
};

// Calculate days left from ISO string
export const calculateDaysLeft = (
  isoString: string | null | undefined
): string => {
  if (!isoString) return "Invalid date";

  const targetDate = dayjs(isoString);
  const currentDate = dayjs();

  const diffInDays = targetDate.diff(currentDate, "day");

  if (diffInDays < 0) {
    return `${Math.abs(diffInDays)} days overdue`;
  } else if (diffInDays === 0) {
    return "Due today";
  } else {
    return `${diffInDays} days left`;
  }
};

// Convert ISO string to FullCalendar format
export const convertISOToFullCalendar = (
  isoString: string | null | undefined
): string => {
  if (!isoString) return "Invalid date";

  // ISO string is already in the correct format for FullCalendar
  return isoString;
};

// Format: "Thu Jan 16 2025 19:00:00 GMT+0700" to ISO string
export function convertDateStrToISOString(dateString: string): string {
  const date = new Date(dateString);
  return date.toISOString();
}

// Get time ago from formatted date string
export const getTimeAgo = (datetime: string) => {
  const date = dayjs(datetime, "DD/MM/YYYY HH:mm:ss", true).utc();

  if (!date.isValid()) {
    return "Invalid date format";
  }

  return date.fromNow();
};

// Get time ago from ISO string
export const getTimeAgoFromISO = (isoString: string) => {
  const date = dayjs(isoString);

  if (!date.isValid()) {
    return "Invalid date format";
  }

  return date.fromNow();
};

export type STATUS_TYPE_LIST =
  | "backlog"
  | "todo"
  | "inprogress"
  | "inreview"
  | "done";

export const STATUS_LIST = [
  {
    id: "backlog",
    title: "Backlog",
  },
  {
    id: "todo",
    title: "Todo",
  },
  {
    id: "inprogress",
    title: "In Progress",
  },
  {
    id: "inreview",
    title: "In Review",
  },
  {
    id: "done",
    title: "Done",
  },
];

export const getStatusObj = (
  id: "backlog" | "todo" | "inprogress" | "inreview" | "done"
) => {
  return STATUS_LIST.find((status) => {
    return status.id === id;
  });
};

export const COLUMNS_DATA: KANBAN_COLUMN_TYPE[] = [
  {
    id: "backlog",
    name: "Backlog",
    count: 0,
  },
  {
    id: "todo",
    name: "Todo",
    count: 0,
  },
  {
    id: "inprogress",
    name: "In Progress",
    count: 0,
  },
  {
    id: "inreview",
    name: "In Review",
    count: 0,
  },
  {
    id: "done",
    name: "Done",
    count: 0,
  },
];

// Updated Kanban columns (matches your types)
export const kanbanColumns: KANBAN_COLUMN_TYPE[] = [
  { id: "todo", name: "To Do", count: 0 },
  { id: "inProgress", name: "In Progress", count: 0 },
  { id: "underReview", name: "Under Review", count: 0 },
  { id: "finished", name: "Finished", count: 0 },
];

// Handle API errors (replaces Firebase error handling)
export const handleAPIError = (message: string) => {
  if (message.includes("email already exists") || message.includes("409"))
    return "Email already in use";

  if (message.includes("password") && message.includes("weak"))
    return "Password should be at least 6 characters";

  if (message.includes("401") || message.includes("unauthorized"))
    return "Invalid email or password";

  if (message.includes("404")) return "Resource not found";

  if (message.includes("500")) return "Server error. Please try again later";

  return "Something went wrong. Please try again";
};

// Utility for date validation
export const isValidDate = (dateString: string): boolean => {
  return dayjs(dateString).isValid();
};

// Format date for display in UI
export const formatDateForDisplay = (
  isoString: string | null | undefined
): string => {
  if (!isoString) return "No date";

  const date = dayjs(isoString);
  if (!date.isValid()) return "Invalid date";

  return date.format("MMM DD, YYYY");
};

// Format datetime for display in UI
export const formatDateTimeForDisplay = (
  isoString: string | null | undefined
): string => {
  if (!isoString) return "No date";

  const date = dayjs(isoString);
  if (!date.isValid()) return "Invalid date";

  return date.format("MMM DD, YYYY HH:mm");
};
// Add this function to your utils.ts file
export const formatTimeStampDate = (
  isoString: string | null | undefined,
  type: "date" | "datetime" | "time" = "date"
): string => {
  if (!isoString) return "Invalid date";

  const date = dayjs(isoString);

  if (!date.isValid()) return "Invalid date";

  switch (type) {
    case "date":
      return date.format("DD/MM/YYYY");
    case "datetime":
      return date.format("DD/MM/YYYY HH:mm:ss");
    case "time":
      return date.format("HH:mm:ss");
    default:
      return date.format("DD/MM/YYYY");
  }
};

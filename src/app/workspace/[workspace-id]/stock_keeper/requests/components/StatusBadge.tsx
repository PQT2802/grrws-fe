interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const getBadgeClasses = () => {
    switch (status) {
      case "Unconfirmed":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300";
      case "Confirmed":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
      case "Delivered":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300";
      case "Insufficient":
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "Unconfirmed":
        return "Chưa xác nhận";
      case "Confirmed":
        return "Đã xác nhận";
      case "Delivered":
        return "Đã giao";
      case "Insufficient":
        return "Thiếu hàng";
      default:
        return status;
    }
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${getBadgeClasses()}`}>
      {getStatusText()}
    </span>
  );
}
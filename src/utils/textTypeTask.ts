/**
 * Convert task group type to Vietnamese text
 */
export function translateGroupType(groupType: string): string {
  switch (groupType.toLowerCase()) {
    case "warranty":
      return "Bảo hành";
    case "repair":
      return "Sửa chữa";
    case "replacement":
      return "Thay thế";
    case "warrantysubmission":
      return "Gửi bảo hành";
    case "warrantyreturn":
      return "Trả bảo hành";
    case "uninstallation":
      return "Tháo dỡ";
    case "installation":
      return "Lắp đặt";
    case "storagereturn":
      return "Trả kho";
    case "stockreturn":
      return "Trả stock";
    default:
      return groupType; // Return original if no translation found
  }
}

/**
 * Convert task type to Vietnamese text
 */
export function translateTaskType(taskType: string): string {
  switch (taskType.toLowerCase()) {
    case "warranty":
      return "Bảo hành";
    case "repair":
      return "Sửa chữa";
    case "replacement":
      return "Thay thế";
    case "warrantysubmission":
      return "Gửi bảo hành";
    case "warrantyreturn":
      return "Trả bảo hành";
    case "uninstallation":
      return "Tháo dỡ";
    case "installation":
      return "Lắp đặt";
    case "storagereturn":
      return "Trả kho";
    case "stockreturn":
      return "Trả stock";
    default:
      return taskType; // Return original if no translation found
  }
}

/**
 * Convert task status to Vietnamese text
 */
export function translateTaskStatus(status: string): string {
  switch (status.toLowerCase()) {
    case "pending":
      return "Đang chờ";
    case "approved":
      return "Đã phê duyệt";
    case "rejected":
      return "Đã từ chối";
    case "inprogress":
    case "in progress":
      return "Đang thực hiện";
    case "completed":
      return "Hoàn thành";
    case "cancelled":
      return "Đã hủy";
    case "onhold":
    case "on hold":
      return "Tạm dừng";
    case "suggested":
      return "Đề xuất";
    case "waitingforconfirmation":
    case "waiting for confirmation":
      return "Chờ xác nhận";
    default:
      return status; // Return original if no translation found
  }
}

/**
 * Convert task priority to Vietnamese text
 */
export function translateTaskPriority(priority: string): string {
  switch (priority.toLowerCase()) {
    case "low":
      return "Thấp";
    case "medium":
      return "Trung bình";
    case "high":
      return "Cao";
    case "urgent":
      return "Khẩn cấp";
    default:
      return priority; // Return original if no translation found
  }
}
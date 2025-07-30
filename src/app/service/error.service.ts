import http from "@/lib/http";
import { ErrorGuideline } from "@/types/error.type";

class ErrorService {
  // ✅ Get error guidelines by error ID
  getErrorGuidelines = async (errorId: string): Promise<ErrorGuideline[]> => {
    console.log("🔧 ErrorService getErrorGuidelines called with:", errorId);

    const response = await http.get<ErrorGuideline[]>(
      `/api/error/guidelines/${errorId}`,
      {
        useInternalRoute: true,
      }
    );

    console.log("📨 ErrorService response (after HTTP processing):", response);
    return response;
  };
}

// eslint-disable-next-line import/no-anonymous-default-export
export default new ErrorService();

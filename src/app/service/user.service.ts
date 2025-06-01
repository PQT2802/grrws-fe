import http from "@/lib/http";
import { GET_MECHANIC_USER } from "@/types/user.type";

export const userService = {
  // ✅ Get users by role number
  getUsersByRole: async (role: number): Promise<GET_MECHANIC_USER[]> => {
    return http.get<GET_MECHANIC_USER[]>(`/api/users/${role}`, {
      useInternalRoute: true,
    });
  },
};

export default userService;

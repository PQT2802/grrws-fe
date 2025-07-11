import http from "@/lib/http";
import { GET_MECHANIC_USER, USER_LIST_RESPONSE } from "@/types/user.type";

export const userService = {
  // ✅ Get users by role number
  getUsersByRole: async (role: number): Promise<GET_MECHANIC_USER[]> => {
    return http.get<GET_MECHANIC_USER[]>(`/api/users/${role}`, {
      useInternalRoute: true,
    });
  },

  // getUsersList: async (
  //   pageNumber: number = 1,
  //   pageSize: number = 10
  // ): Promise<USER_LIST_RESPONSE> => {
  //   return http.get<USER_LIST_RESPONSE>(`/api/users/list?pageNumber=${pageNumber}&pageSize=${pageSize}`, {
  //     useInternalRoute: true
  //   });
  // },
};

export default userService;

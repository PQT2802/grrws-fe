import { USER_TYPE, WORKSPACE_TYPE, JOIN_WORKSPACE_TYPE } from "@/types";
import { create } from "zustand";
import {
  MOCK_WORKSPACES,
  MOCK_USERS,
  getMockWorkspaceById,
  getMockUserById,
  getMockProjectsByWorkspaceId,
  MOCK_PROJECTS,
} from "@/lib/mock-data";

export interface WorkspaceStoreState {
  workspace: WORKSPACE_TYPE | null;
  workspaces: WORKSPACE_TYPE[];
  joinUsers: USER_TYPE[];
  loading: boolean;
  error: unknown;
  setJoinUsers: (users: USER_TYPE[]) => Promise<USER_TYPE[]>;
  getWorkspaces: (userId: string) => Promise<WORKSPACE_TYPE[]>;
  createWorkspace: (workspace: WORKSPACE_TYPE) => Promise<WORKSPACE_TYPE>;
  createJoinWorkspace: (
    joinWorkspace: JOIN_WORKSPACE_TYPE
  ) => Promise<JOIN_WORKSPACE_TYPE>;
  getWorkspaceByJoinUrl: (joinUrl: string) => Promise<WORKSPACE_TYPE>;
  getWorkspaceByWorkspaceId: (workspaceId: string) => Promise<WORKSPACE_TYPE>;
}

const useWorkspaceStore = create<WorkspaceStoreState>((set, get) => ({
  workspace: null,
  workspaces: [],
  joinUsers: [],
  loading: false,
  error: null,

  setJoinUsers: async (users: USER_TYPE[]) => {
    set({ joinUsers: users });
    return users;
  },

  getWorkspaces: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      console.log("🔍 Getting workspaces for user:", userId);

      // ✅ Use mock data - get workspaces where user is owner or member
      const userWorkspaces = MOCK_WORKSPACES.filter(
        (workspace) =>
          workspace.ownerId === userId ||
          workspace.joinUsers?.some(
            (user: USER_TYPE) => user.id === userId || user.uid === userId
          )
      );

      // ✅ Add enhanced data
      const enhancedWorkspaces = userWorkspaces.map((workspace) => ({
        ...workspace,
        owner: getMockUserById(workspace.ownerId || ""),
        joinUsers: MOCK_USERS,
      }));

      console.log("✅ Found workspaces:", enhancedWorkspaces);

      set({ workspaces: enhancedWorkspaces, loading: false });
      return enhancedWorkspaces;
    } catch (error) {
      console.error("❌ Get workspaces failed:", error);
      set({ error: error, loading: false });
      return [];
    }
  },

  createWorkspace: async (workspace: WORKSPACE_TYPE) => {
    set({ loading: true, error: null });
    try {
      console.log("🔄 Creating workspace:", workspace);

      // ✅ Mock create workspace
      const newWorkspace: WORKSPACE_TYPE = {
        ...workspace,
        id: `workspace-${Date.now()}`,
        joinUsers: MOCK_USERS,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // ✅ Add to mock data
      MOCK_WORKSPACES.push(newWorkspace);

      console.log("✅ Workspace created:", newWorkspace);

      set({ loading: false });
      return newWorkspace;
    } catch (error) {
      console.error("❌ Create workspace failed:", error);
      set({ error: error, loading: false });
      throw error;
    }
  },

  createJoinWorkspace: async (joinWorkspace: JOIN_WORKSPACE_TYPE) => {
    set({ loading: true, error: null });
    try {
      console.log("🔄 Creating join workspace:", joinWorkspace);

      // ✅ Mock create join workspace
      const newJoinWorkspace: JOIN_WORKSPACE_TYPE = {
        ...joinWorkspace,
        id: `join-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log("✅ Join workspace created:", newJoinWorkspace);

      set({ loading: false });
      return newJoinWorkspace;
    } catch (error) {
      console.error("❌ Create join workspace failed:", error);
      set({ error: error, loading: false });
      throw error;
    }
  },

  getWorkspaceByJoinUrl: async (joinUrl: string) => {
    set({ loading: true, error: null });
    try {
      console.log("🔍 Getting workspace by join URL:", joinUrl);

      // ✅ Use mock data
      const workspace = MOCK_WORKSPACES.find((w) => w.joinUrl === joinUrl);

      if (!workspace) {
        throw new Error("Workspace not found");
      }

      // ✅ Enhance with additional data
      const enhancedWorkspace = {
        ...workspace,
        owner: getMockUserById(workspace.ownerId || ""),
        joinUsers: MOCK_USERS,
      };

      console.log("✅ Workspace found by join URL:", enhancedWorkspace);

      set({ loading: false });
      return enhancedWorkspace;
    } catch (error) {
      console.error("❌ Get workspace by join URL failed:", error);
      set({ error: error, loading: false });
      throw error;
    }
  },

  getWorkspaceByWorkspaceId: async (workspaceId: string) => {
    set({ loading: true, error: null });
    try {
      console.log("🔍 Getting workspace by ID:", workspaceId);

      // ✅ Use mock data
      const workspace = getMockWorkspaceById(workspaceId);

      if (!workspace) {
        throw new Error("Workspace not found");
      }

      // ✅ Enhance with additional data
      const enhancedWorkspace = {
        ...workspace,
        owner: getMockUserById(workspace.ownerId || ""),
        joinUsers: MOCK_USERS,
      };

      console.log("✅ Workspace found:", enhancedWorkspace);

      set({
        workspace: enhancedWorkspace,
        joinUsers: MOCK_USERS,
        loading: false,
      });
      return enhancedWorkspace;
    } catch (error) {
      console.error("❌ Get workspace by ID failed:", error);
      set({ error: error, loading: false });
      throw error;
    }
  },
}));

export default useWorkspaceStore;

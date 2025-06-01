import { PROJECT_TYPE, TASK_TYPE } from "@/types";
import { create } from "zustand";
import {
  MOCK_PROJECTS,
  MOCK_TASKS,
  getMockProjectsByWorkspaceId,
  getMockTasksByWorkspaceId,
  getMockTaskById,
  getMockProjectById,
  MOCK_USERS,
  getMockUserById,
} from "@/lib/mock-data";

export interface TaskStoreState {
  tasks: TASK_TYPE[];
  task: TASK_TYPE | null;
  projects: PROJECT_TYPE[];
  loading: boolean;
  error: unknown;
  getTasksByWorkspaceId: (workspaceId: string) => Promise<TASK_TYPE[]>;
  getProjectsByWorkspaceId: (workspaceId: string) => Promise<PROJECT_TYPE[]>;
  getTaskByTaskId: (taskId: string) => Promise<TASK_TYPE>;
  createTask: (task: TASK_TYPE) => Promise<TASK_TYPE>;
  updateTaskById: (task: TASK_TYPE) => Promise<TASK_TYPE>;
  deleteTaskById: (taskId: string) => Promise<void>;
}

const useTaskStore = create<TaskStoreState>((set, get) => ({
  tasks: [],
  task: null,
  projects: [],
  loading: false,
  error: null,

  getTasksByWorkspaceId: async (workspaceId: string) => {
    set({ loading: true, error: null });
    try {
      console.log("🔍 Getting tasks for workspace:", workspaceId);

      // ✅ Use mock data
      const tasks = getMockTasksByWorkspaceId(workspaceId);

      // ✅ Enhance tasks with additional data
      const enhancedTasks = tasks.map((task) => ({
        ...task,
        assignee: getMockUserById(task.assigneeId || ""),
        createdUser: getMockUserById(task.createdBy || ""),
        project: getMockProjectById(task.projectId || ""),
      }));

      console.log("✅ Found tasks:", enhancedTasks);

      set({ tasks: enhancedTasks, loading: false });
      return enhancedTasks;
    } catch (error) {
      console.error("❌ Get tasks failed:", error);
      set({ error: error, loading: false });
      return [];
    }
  },

  getProjectsByWorkspaceId: async (workspaceId: string) => {
    set({ loading: true, error: null });
    try {
      console.log("🔍 Getting projects for workspace:", workspaceId);

      // ✅ Use mock data
      const projects = getMockProjectsByWorkspaceId(workspaceId);

      // ✅ Enhance projects with additional data
      const enhancedProjects = projects.map((project) => ({
        ...project,
        joinUsers: MOCK_USERS,
      }));

      console.log("✅ Found projects:", enhancedProjects);

      // ✅ Also get tasks for this workspace
      const tasks = await get().getTasksByWorkspaceId(workspaceId);

      set({ projects: enhancedProjects, loading: false });
      return enhancedProjects;
    } catch (error) {
      console.error("❌ Get projects failed:", error);
      set({ error: error, loading: false });
      return [];
    }
  },

  getTaskByTaskId: async (taskId: string) => {
    set({ loading: true, error: null });
    try {
      console.log("🔍 Getting task by ID:", taskId);

      // ✅ Use mock data
      const task = getMockTaskById(taskId);

      if (!task) {
        throw new Error("Task not found");
      }

      // ✅ Enhance task with additional data
      const enhancedTask = {
        ...task,
        assignee: getMockUserById(task.assigneeId || ""),
        createdUser: getMockUserById(task.createdBy || ""),
        project: getMockProjectById(task.projectId || ""),
      };

      console.log("✅ Task found:", enhancedTask);

      set({ task: enhancedTask, loading: false });
      return enhancedTask;
    } catch (error) {
      console.error("❌ Get task failed:", error);
      set({ error: error, loading: false });
      throw error;
    }
  },

  createTask: async (task: TASK_TYPE) => {
    set({ loading: true, error: null });
    try {
      console.log("🔄 Creating task:", task);

      // ✅ Mock create task
      const newTask: TASK_TYPE = {
        ...task,
        id: `task-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // ✅ Enhance with user data
      const enhancedTask = {
        ...newTask,
        assignee: getMockUserById(newTask.assigneeId || ""),
        createdUser: getMockUserById(newTask.createdBy || ""),
        project: getMockProjectById(newTask.projectId || ""),
      };

      // ✅ Add to mock data
      MOCK_TASKS.push(enhancedTask);

      console.log("✅ Task created:", enhancedTask);

      // ✅ Update tasks list
      const currentTasks = get().tasks;
      set({ tasks: [...currentTasks, enhancedTask], loading: false });

      return enhancedTask;
    } catch (error) {
      console.error("❌ Create task failed:", error);
      set({ error: error, loading: false });
      throw error;
    }
  },

  updateTaskById: async (task: TASK_TYPE) => {
    set({ loading: true, error: null });
    try {
      console.log("🔄 Updating task:", task);

      // ✅ Find task in mock data
      const taskIndex = MOCK_TASKS.findIndex((t) => t.id === task.id);

      if (taskIndex === -1) {
        throw new Error("Task not found");
      }

      // ✅ Update task
      const updatedTask = {
        ...MOCK_TASKS[taskIndex],
        ...task,
        updatedAt: new Date().toISOString(),
      };

      // ✅ Enhance with user data
      const enhancedTask = {
        ...updatedTask,
        assignee: getMockUserById(updatedTask.assigneeId || ""),
        createdUser: getMockUserById(updatedTask.createdBy || ""),
        project: getMockProjectById(updatedTask.projectId || ""),
      };

      // ✅ Update mock data
      MOCK_TASKS[taskIndex] = enhancedTask;

      console.log("✅ Task updated:", enhancedTask);

      // ✅ Update tasks list
      const currentTasks = get().tasks;
      const updatedTasks = currentTasks.map((t) =>
        t.id === task.id ? enhancedTask : t
      );

      set({ tasks: updatedTasks, task: enhancedTask, loading: false });

      return enhancedTask;
    } catch (error) {
      console.error("❌ Update task failed:", error);
      set({ error: error, loading: false });
      throw error;
    }
  },

  deleteTaskById: async (taskId: string) => {
    set({ loading: true, error: null });
    try {
      console.log("🗑️ Deleting task:", taskId);

      // ✅ Remove from mock data
      const taskIndex = MOCK_TASKS.findIndex((t) => t.id === taskId);

      if (taskIndex === -1) {
        throw new Error("Task not found");
      }

      MOCK_TASKS.splice(taskIndex, 1);

      // ✅ Update tasks list
      const currentTasks = get().tasks;
      const filteredTasks = currentTasks.filter((t) => t.id !== taskId);

      set({ tasks: filteredTasks, loading: false });

      console.log("✅ Task deleted:", taskId);
    } catch (error) {
      console.error("❌ Delete task failed:", error);
      set({ error: error, loading: false });
      throw error;
    }
  },
}));

export default useTaskStore;

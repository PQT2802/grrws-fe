import {
  USER_TYPE,
  WORKSPACE_TYPE,
  PROJECT_TYPE,
  TASK_TYPE,
  NOTIFICATION_TYPE,
} from "@/types";

// ✅ Mock Users Data - Map to your AuthUser system
export const MOCK_USERS: USER_TYPE[] = [
  {
    id: "32222222-2222-2222-2222-222222222222", // ✅ Use your actual user ID
    uid: "32222222-2222-2222-2222-222222222222",
    displayName: "Head of Team",
    email: "hot@gmail.com",
    phoneNumber: "09785628660",
    photoURL: "https://github.com/shadcn.png",
  },
  {
    id: "user-2",
    uid: "user-2",
    displayName: "Jane Smith",
    email: "jane.smith@example.com",
    phoneNumber: "0987654321",
    photoURL: "https://github.com/shadcn.png",
  },
  {
    id: "user-3",
    uid: "user-3",
    displayName: "Mike Johnson",
    email: "mike.johnson@example.com",
    phoneNumber: "5555555555",
    photoURL: "https://github.com/shadcn.png",
  },
];

// ✅ Mock Workspaces Data - Add your specific workspace ID
export const MOCK_WORKSPACES: WORKSPACE_TYPE[] = [
  {
    id: "675f56bd85aa8bdedbab08f9", // ✅ Your actual workspace ID
    ownerId: "32222222-2222-2222-2222-222222222222", // ✅ Your user ID
    owner: MOCK_USERS[0],
    name: "Main Workspace",
    joinUrl: "https://app.com/join/675f56bd85aa8bdedbab08f9",
    avatarUrl: "https://github.com/workspace-main.png",
    joinUsers: MOCK_USERS,
    createdAt: new Date("2024-01-10").toISOString(),
    updatedAt: new Date("2024-01-10").toISOString(),
  },
  {
    id: "workspace-1",
    ownerId: "32222222-2222-2222-2222-222222222222",
    owner: MOCK_USERS[0],
    name: "Development Team",
    joinUrl: "https://app.com/join/workspace-1",
    avatarUrl: "https://github.com/workspace1.png",
    joinUsers: MOCK_USERS,
    createdAt: new Date("2024-01-15").toISOString(),
    updatedAt: new Date("2024-01-15").toISOString(),
  },
  {
    id: "workspace-2",
    ownerId: "user-2",
    owner: MOCK_USERS[1],
    name: "Design Team",
    joinUrl: "https://app.com/join/workspace-2",
    avatarUrl: "https://github.com/workspace2.png",
    joinUsers: [MOCK_USERS[1], MOCK_USERS[2]],
    createdAt: new Date("2024-01-20").toISOString(),
    updatedAt: new Date("2024-01-20").toISOString(),
  },
];

// ✅ Mock Projects Data
export const MOCK_PROJECTS: PROJECT_TYPE[] = [
  {
    id: "project-1",
    name: "Frontend Redesign",
    avatarUrl: "https://github.com/project1.png",
    workspaceId: "675f56bd85aa8bdedbab08f9", // ✅ Link to your workspace
    workspace: MOCK_WORKSPACES[0],
    joinUsers: MOCK_USERS,
    createdAt: new Date("2024-02-01").toISOString(),
    updatedAt: new Date("2024-02-01").toISOString(),
  },
  {
    id: "project-2",
    name: "Mobile App",
    avatarUrl: "https://github.com/project2.png",
    workspaceId: "675f56bd85aa8bdedbab08f9", // ✅ Link to your workspace
    workspace: MOCK_WORKSPACES[0],
    joinUsers: [MOCK_USERS[0], MOCK_USERS[2]],
    createdAt: new Date("2024-02-05").toISOString(),
    updatedAt: new Date("2024-02-05").toISOString(),
  },
  {
    id: "project-3",
    name: "Authentication System",
    avatarUrl: "https://github.com/project3.png",
    workspaceId: "workspace-1",
    workspace: MOCK_WORKSPACES[1],
    joinUsers: MOCK_USERS,
    createdAt: new Date("2024-02-10").toISOString(),
    updatedAt: new Date("2024-02-10").toISOString(),
  },
];

// ✅ Mock Tasks Data
export const MOCK_TASKS: TASK_TYPE[] = [
  {
    id: "task-1",
    name: "Design Homepage",
    description: "Create the new homepage design with modern UI",
    workspaceId: "675f56bd85aa8bdedbab08f9", // ✅ Your workspace
    workspace: MOCK_WORKSPACES[0],
    projectId: "project-1",
    project: MOCK_PROJECTS[0],
    assigneeId: "32222222-2222-2222-2222-222222222222", // ✅ Assigned to you
    assignee: MOCK_USERS[0],
    createdBy: "32222222-2222-2222-2222-222222222222",
    createdUser: MOCK_USERS[0],
    status: "inProgress",
    dueAt: new Date("2024-03-15").toISOString(),
    createdAt: new Date("2024-02-10").toISOString(),
    updatedAt: new Date("2024-02-10").toISOString(),
  },
  {
    id: "task-2",
    name: "Implement Authentication",
    description: "Add user login and registration functionality",
    workspaceId: "675f56bd85aa8bdedbab08f9", // ✅ Your workspace
    workspace: MOCK_WORKSPACES[0],
    projectId: "project-2",
    project: MOCK_PROJECTS[1],
    assigneeId: "user-3",
    assignee: MOCK_USERS[2],
    createdBy: "32222222-2222-2222-2222-222222222222",
    createdUser: MOCK_USERS[0],
    status: "todo",
    dueAt: new Date("2024-03-20").toISOString(),
    createdAt: new Date("2024-02-12").toISOString(),
    updatedAt: new Date("2024-02-12").toISOString(),
  },
  {
    id: "task-3",
    name: "Setup Database",
    description: "Configure database schema and connections",
    workspaceId: "675f56bd85aa8bdedbab08f9", // ✅ Your workspace
    workspace: MOCK_WORKSPACES[0],
    projectId: "project-1",
    project: MOCK_PROJECTS[0],
    assigneeId: "32222222-2222-2222-2222-222222222222", // ✅ Another task for you
    assignee: MOCK_USERS[0],
    createdBy: "32222222-2222-2222-2222-222222222222",
    createdUser: MOCK_USERS[0],
    status: "done", // ✅ Completed task
    dueAt: new Date("2024-02-28").toISOString(),
    createdAt: new Date("2024-02-08").toISOString(),
    updatedAt: new Date("2024-02-25").toISOString(),
  },
  {
    id: "task-4",
    name: "API Documentation",
    description: "Write comprehensive API documentation",
    workspaceId: "675f56bd85aa8bdedbab08f9",
    workspace: MOCK_WORKSPACES[0],
    projectId: "project-2",
    project: MOCK_PROJECTS[1],
    assigneeId: "user-2",
    assignee: MOCK_USERS[1],
    createdBy: "32222222-2222-2222-2222-222222222222",
    createdUser: MOCK_USERS[0],
    status: "underReview",
    dueAt: new Date("2024-01-15").toISOString(), // ✅ Overdue task
    createdAt: new Date("2024-01-01").toISOString(),
    updatedAt: new Date("2024-02-14").toISOString(),
  },
];

// ✅ Mock Notifications Data
export const MOCK_NOTIFICATIONS: NOTIFICATION_TYPE[] = [
  {
    id: "notif-1",
    name: "Head of Team assigned a new task for you",
    url: "/workspace/675f56bd85aa8bdedbab08f9/tasks/task-1",
    senderId: "32222222-2222-2222-2222-222222222222",
    sender: MOCK_USERS[0],
    receiverId: "user-2",
    receiver: MOCK_USERS[1],
    isSeen: false,
    createdAt: new Date("2024-02-10").toISOString(),
    updatedAt: new Date("2024-02-10").toISOString(),
  },
];

// ✅ Helper functions
export const getMockUserById = (id: string): USER_TYPE | undefined => {
  return MOCK_USERS.find((user) => user.id === id || user.uid === id);
};

export const getMockWorkspaceById = (
  id: string
): WORKSPACE_TYPE | undefined => {
  return MOCK_WORKSPACES.find((workspace) => workspace.id === id);
};

export const getMockProjectById = (id: string): PROJECT_TYPE | undefined => {
  return MOCK_PROJECTS.find((project) => project.id === id);
};

export const getMockTaskById = (id: string): TASK_TYPE | undefined => {
  return MOCK_TASKS.find((task) => task.id === id);
};

export const getMockProjectsByWorkspaceId = (
  workspaceId: string
): PROJECT_TYPE[] => {
  return MOCK_PROJECTS.filter((project) => project.workspaceId === workspaceId);
};

export const getMockTasksByWorkspaceId = (workspaceId: string): TASK_TYPE[] => {
  return MOCK_TASKS.filter((task) => task.workspaceId === workspaceId);
};

export const getMockNotificationsByReceiverId = (
  receiverId: string
): NOTIFICATION_TYPE[] => {
  return MOCK_NOTIFICATIONS.filter((notif) => notif.receiverId === receiverId);
};

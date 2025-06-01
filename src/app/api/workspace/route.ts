import { NextResponse } from "next/server";
import { WORKSPACE_TYPE } from "@/types";
import {
  getMockWorkspaceById,
  MOCK_USERS,
  getMockUserById,
  MOCK_WORKSPACES,
} from "@/lib/mock-data";

// ✅ Get workspace by ID using mock data
export async function GET(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace ID is required" },
        { status: 400 }
      );
    }

    console.log("🔍 Getting workspace by ID:", workspaceId);

    // ✅ Use mock data instead of Firebase
    const workspace = getMockWorkspaceById(workspaceId);

    if (!workspace) {
      console.log("❌ Workspace not found:", workspaceId);
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // ✅ Enhance workspace with additional data
    const enhancedWorkspace: WORKSPACE_TYPE = {
      ...workspace,
      owner: getMockUserById(workspace.ownerId || ""),
      joinUsers: MOCK_USERS,
    };

    console.log("✅ Workspace found:", enhancedWorkspace);

    return NextResponse.json(enhancedWorkspace, { status: 200 });
  } catch (error: any) {
    console.error("❌ Get workspace by ID failed:", error.message);

    return NextResponse.json(
      { error: "Get workspace by ID failed" },
      { status: 500 }
    );
  }
}

// ✅ Update workspace
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;
    const body = await req.json();

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace ID is required" },
        { status: 400 }
      );
    }

    console.log("🔄 Updating workspace:", workspaceId, body);

    const workspace = getMockWorkspaceById(workspaceId);

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // ✅ Mock update workspace
    const updatedWorkspace: WORKSPACE_TYPE = {
      ...workspace,
      ...body,
      id: workspaceId,
      updatedAt: new Date().toISOString(),
    };

    console.log("✅ Workspace updated:", updatedWorkspace);

    return NextResponse.json(updatedWorkspace, { status: 200 });
  } catch (error: any) {
    console.error("❌ Update workspace failed:", error.message);

    return NextResponse.json(
      { error: "Update workspace failed" },
      { status: 500 }
    );
  }
}

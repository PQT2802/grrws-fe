import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { COLLECTION_NAME } from "@/lib/utils";

// Get project from PROEJCT_LIST by projectId
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;

    if (!id) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    const docRef = doc(db, COLLECTION_NAME.PROJECT_LIST, id);
    const docSnap = await getDoc(docRef);

    return NextResponse.json(
      { id: docRef.id, ...docSnap.data() },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Get project by project ID failed:", error.message);

    return NextResponse.json(
      { error: "Get project by project ID failed" },
      { status: 500 }
    );
  }
}

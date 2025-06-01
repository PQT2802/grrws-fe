import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

// Initialize Firebase Admin (only if not already initialized)
if (!getApps().length) {
  const serviceAccount = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url:
      process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
  };

  initializeApp({
    credential: cert(serviceAccount as any),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

// POST /api/firebase/image-url - Get Firebase image URLs
export async function POST(request: NextRequest) {
  try {
    console.log("🔄 GET FIREBASE IMAGE URLS API ROUTE STARTED");

    const { imagePaths } = await request.json();

    if (!Array.isArray(imagePaths)) {
      return NextResponse.json(
        { error: "imagePaths must be an array" },
        { status: 400 }
      );
    }

    console.log("📨 Image paths received:", imagePaths);

    const storage = getStorage();
    const bucket = storage.bucket();

    const urlPromises = imagePaths.map(async (path: string) => {
      try {
        if (path.startsWith("http://") || path.startsWith("https://")) {
          return path; // Already a complete URL
        }

        console.log(`🔗 Getting URL for: ${path}`);
        const file = bucket.file(path);

        // Generate signed URL valid for 1 hour
        const [url] = await file.getSignedUrl({
          action: "read",
          expires: Date.now() + 60 * 60 * 1000, // 1 hour
        });

        console.log(`✅ Generated URL for: ${path}`);
        return url;
      } catch (error) {
        console.error(`❌ Failed to get URL for ${path}:`, error);
        return null;
      }
    });

    const urls = await Promise.all(urlPromises);
    const validUrls = urls.filter((url) => url !== null);

    console.log(
      `✅ Successfully processed ${validUrls.length}/${imagePaths.length} images`
    );
    return NextResponse.json({ urls: validUrls });
  } catch (error) {
    console.error("❌ Failed to get Firebase image URLs:", error);
    return NextResponse.json(
      { error: "Failed to get image URLs" },
      { status: 500 }
    );
  }
}

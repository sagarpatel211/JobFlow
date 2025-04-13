import { NextRequest, NextResponse } from "next/server";
import { TrackerAPIResponse } from "@/types/api";

export async function GET(request: NextRequest) {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
    const url = new URL(request.url);
    const params = new URLSearchParams(url.search);

    // Forward all query parameters to the backend
    const apiUrl = `${API_URL}/api/tracker?${params.toString()}`;

    const response = await fetch(apiUrl, {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch tracker data");
    }

    const data = (await response.json()) as TrackerAPIResponse;

    if (!data.success) {
      throw new Error(data.error || "Failed to fetch tracker data");
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

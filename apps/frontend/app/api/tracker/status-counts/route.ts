import { NextResponse } from "next/server";
import { TrackerAPIResponse } from "@/types/api";

export async function GET() {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

    // Fetch minimal data - just what we need for status counts
    const response = await fetch(`${API_URL}/api/tracker?count_only=1`, {
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

    // Return just the status counts
    return NextResponse.json({
      success: true,
      statusCounts: data.trackerData.statusCounts,
    });
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

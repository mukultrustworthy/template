import { NextRequest, NextResponse } from "next/server";
import { renderImageService } from "../../services/renderImageService";

export async function POST(request: NextRequest) {
  try {
    const { html } = await request.json();

    if (!html) {
      return NextResponse.json(
        { error: "Missing required field: html" },
        { status: 400 }
      );
    }

    const result = await renderImageService.htmlToJpeg(html);

    // Return the image as a binary response
    return new NextResponse(result.buffer, {
      headers: {
        "Content-Type": result.contentType,
        "Content-Disposition": "attachment; filename=rendered-image.jpg"
      }
    });
  } catch (error) {
    console.error("Error converting HTML to JPEG:", error);
    return NextResponse.json(
      { error: "Failed to convert HTML to JPEG" },
      { status: 500 }
    );
  }
} 
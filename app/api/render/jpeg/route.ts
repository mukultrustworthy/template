import { NextRequest, NextResponse } from "next/server";
import { renderImageService } from "../../services/renderImageService";

export async function POST(request: NextRequest) {
  try {
    const { html, responseFormat = "base64", uploadToS3 = true } = await request.json();

    if (!html) {
      return NextResponse.json(
        { error: "Missing required field: html" },
        { status: 400 }
      );
    }

    const result = await renderImageService.htmlToJpeg(html, uploadToS3);

    // If uploadToS3 is true and we have a URL, return it
    if (uploadToS3 && result.url) {
      return NextResponse.json({
        url: result.url,
        contentType: result.contentType
      });
    }

    // Return as base64 JSON by default
    if (responseFormat === "base64") {
      if (!result.buffer) {
        return NextResponse.json(
          { error: "Image buffer not available" },
          { status: 500 }
        );
      }
      
      const base64Image = result.buffer.toString('base64');
      return NextResponse.json({
        image: `data:${result.contentType};base64,${base64Image}`,
        contentType: result.contentType
      });
    }
    
    // Return the binary image as before if specifically requested
    if (!result.buffer) {
      return NextResponse.json(
        { error: "Image buffer not available" },
        { status: 500 }
      );
    }
    
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
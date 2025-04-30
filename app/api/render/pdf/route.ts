import { NextRequest, NextResponse } from "next/server";
import { renderPdfService } from "../../services/renderPdfService";

export async function POST(request: NextRequest) {
    try {
        const { html, responseFormat = "base64", uploadToS3 = true } = await request.json();

        if (!html) {
            return NextResponse.json(
                { error: "Missing required field: html" },
                { status: 400 }
            );
        }

        console.log("html", html);

        const result = await renderPdfService.htmlToPdf(html, uploadToS3);

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
                    { error: "Pdf buffer not available" },
                    { status: 500 }
                );
            }

            const base64Pdf = result.buffer.toString('base64');
            return NextResponse.json({
                pdf: `data:${result.contentType};base64,${base64Pdf}`,
                contentType: result.contentType
            });
        }

        // Return the binary image as before if specifically requested
        if (!result.buffer) {
            return NextResponse.json(
                { error: "Pdf buffer not available" },
                { status: 500 }
            );
        }

        return new NextResponse(result.buffer, {
            headers: {
                "Content-Type": result.contentType,
                "Content-Disposition": "attachment; filename=rendered-pdf.pdf"
            }
        });
    } catch (error) {
        console.error("Error converting HTML to PDF:", error);
        return NextResponse.json(
            { error: "Failed to convert HTML to PDF" },
            { status: 500 }
        );
    }
}
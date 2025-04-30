import { NextRequest, NextResponse } from 'next/server';
import PDFMerger from 'pdf-merger-js';
import axios from 'axios';

export async function POST(request: NextRequest) {
    try {
        const { pdfUrls } = await request.json();

        // Validate input
        if (!pdfUrls || !Array.isArray(pdfUrls) || pdfUrls.length === 0) {
            return NextResponse.json(
                { error: 'Please provide an array of PDF URLs' },
                { status: 400 }
            );
        }

        // Create a new PDF merger instance
        const merger = new PDFMerger();

        // Download and add each PDF to the merger
        for (const url of pdfUrls) {
            try {
                // Fetch the PDF from the URL
                const response = await axios.get(url, {
                    responseType: 'arraybuffer',
                });

                // Add the PDF to the merger
                await merger.add(Buffer.from(response.data));
            } catch (error) {
                console.error(`Error downloading PDF from ${url}:`, error);
                return NextResponse.json(
                    { error: `Failed to download PDF from ${url}` },
                    { status: 400 }
                );
            }
        }

        // Merge the PDFs and get the buffer
        const mergedPdfBuffer = await merger.saveAsBuffer();

        console.log("Generated merged PDF buffer")

        // Return the merged PDF file
        return new NextResponse(mergedPdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="merged.pdf"',
            },
        });
    } catch (error) {
        console.error('Error merging PDFs:', error);
        return NextResponse.json(
            { error: 'Failed to merge PDFs' },
            { status: 500 }
        );
    }
}

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { nanoid } from "nanoid";

// Initialize S3 client for Cloudflare R2
const R2 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.CLOUDFLARE_ACCOUNTID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "",
    },
});

class RenderPdfService {
    private logger = console;

    async htmlToPdf(
        html: string,
        uploadToS3: boolean = false
    ): Promise<{ buffer?: Buffer; contentType: string; url?: string }> {
        try {
            this.logger.info(html);
            const encodedHTML = Buffer.from(html, "utf8").toString("base64");

            const response = await fetch("https://api.doppio.sh/v1/render/pdf/direct", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.DOPPIO_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    page: {
                        setContent: {
                            html: encodedHTML,
                        },
                        pdf: {
                            "printBackground": true,
                            "height": 1080,
                            "width": 1080,
                        },
                    }
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                const errorMessage = `Doppio API returned error: ${response.status} ${errorText}`;
                this.logger.error(errorMessage);
                throw new Error(errorMessage);
            }

            const contentType = response.headers.get("content-type") || "application/pdf";
            this.logger.info(`Doppio API returned content type: ${contentType}`);

            const arrayBuffer = await response.arrayBuffer();
            const pdfBuffer = Buffer.from(arrayBuffer);

            if (pdfBuffer.length === 0) {
                throw new Error("Received empty pdf buffer from Doppio API");
            }

            this.logger.debug(
                `Received pdf from Doppio API, size: ${pdfBuffer.length} bytes`
            );

            // If uploadToS3 is true, upload the pdf to S3 and return the URL
            if (uploadToS3) {
                console.log("Uploading to R2");
                const url = await this.uploadPdfToR2(pdfBuffer, contentType);
                return {
                    contentType,
                    url,
                };
            }

            // Otherwise return the buffer as before
            return {
                buffer: pdfBuffer,
                contentType: contentType,
            };
        } catch (error) {
            this.logger.error("Error converting HTML to PDF:", error);
            throw error;
        }
    }

    /**
     * Uploads a PDF buffer to Cloudflare R2 storage
     * @param pdfBuffer The PDF buffer to upload
     * @param contentType The content type of the PDF
     * @returns The URL of the uploaded PDF
     */
    private async uploadPdfToR2(
        pdfBuffer: Buffer,
        contentType: string
    ): Promise<string> {
        try {
            const bucketName = process.env.CLOUDFLARE_BUCKET_NAME || "";
            if (!bucketName) {
                throw new Error("Cloudflare R2 bucket name not configured");
            }

            // Generate a unique filename with timestamp and random ID
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const uniqueId = nanoid(8);
            const filename = `pdfs/${timestamp}-${uniqueId}.pdf`;

            // Upload to R2
            const command = new PutObjectCommand({
                Bucket: bucketName,
                Key: filename,
                Body: pdfBuffer,
                ContentType: contentType,
            });

            await R2.send(command);

            // Construct the URL
            const fileUrl = `${process.env.CLOUDFLARE_R2_ASSETS_URL}/${filename}`;
            console.log(fileUrl);

            this.logger.info(`Uploaded PDF to Cloudflare R2: ${fileUrl}`);
            return fileUrl;
        } catch (error) {
            console.log(error);
            this.logger.error("Error uploading PDF to Cloudflare R2:", error);
            throw error;
        }
    }
}

// Singleton instance
export const renderPdfService = new RenderPdfService();
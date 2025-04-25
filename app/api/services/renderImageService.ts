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

class RenderImageService {
  private logger = console;

  async htmlToJpeg(
    html: string,
    uploadToS3: boolean = false
  ): Promise<{ buffer?: Buffer; contentType: string; url?: string }> {
    try {
      this.logger.info(html);
      const encodedHTML = Buffer.from(html, "utf8").toString("base64");
      
      const response = await fetch("https://api.doppio.sh/v1/render/screenshot/direct", {
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
            screenshot: {
              type: "jpeg",
              quality: 100,
              fullPage: true,
            },
          },
          launch: {
            defaultViewport: {
            //   deviceScaleFactor: 1,
              width: 1080,
              height: 1080,
            },
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const errorMessage = `Doppio API returned error: ${response.status} ${errorText}`;
        this.logger.error(errorMessage);
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get("content-type") || "image/jpeg";
      this.logger.info(`Doppio API returned content type: ${contentType}`);

      const arrayBuffer = await response.arrayBuffer();
      const imageBuffer = Buffer.from(arrayBuffer);

      if (imageBuffer.length === 0) {
        throw new Error("Received empty image buffer from Doppio API");
      }

      this.logger.debug(
        `Received image from Doppio API, size: ${imageBuffer.length} bytes`
      );

      if (
        imageBuffer.length > 2 &&
        imageBuffer[0] === 0xff &&
        imageBuffer[1] === 0xd8
      ) {
        this.logger.debug("JPEG signature verified in response");
      } else {
        this.logger.warn(
          "Response does not have JPEG signature - may not be a valid image"
        );
      }

      // If uploadToS3 is true, upload the image to S3 and return the URL
      if (uploadToS3) {
        console.log("Uploading to R2");
        const url = await this.uploadImageToR2(imageBuffer, contentType);
        return {
          contentType,
          url,
        };
      }

      // Otherwise return the buffer as before
      return {
        buffer: imageBuffer,
        contentType: contentType,
      };
    } catch (error) {
      this.logger.error("Error converting HTML to JPG:", error);
      throw error;
    }
  }

  /**
   * Uploads an image buffer to Cloudflare R2 storage
   * @param imageBuffer The image buffer to upload
   * @param contentType The content type of the image
   * @returns The URL of the uploaded image
   */
  private async uploadImageToR2(
    imageBuffer: Buffer,
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
      const filename = `images/${timestamp}-${uniqueId}.jpg`;

      // Upload to R2
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: filename,
        Body: imageBuffer,
        ContentType: contentType,
      });

      await R2.send(command);

      // Construct the URL
      const fileUrl = `${process.env.CLOUDFLARE_R2_ASSETS_URL}/${filename}`;
      console.log(fileUrl);

      this.logger.info(`Uploaded image to Cloudflare R2: ${fileUrl}`);
      return fileUrl;
    } catch (error) {
      console.log(error);
      this.logger.error("Error uploading image to Cloudflare R2:", error);
      throw error;
    }
  }
}

// Singleton instance
export const renderImageService = new RenderImageService(); 
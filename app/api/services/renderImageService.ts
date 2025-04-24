class RenderImageService {
  private logger = console;

  async htmlToJpeg(
    html: string
  ): Promise<{ buffer: Buffer; contentType: string }> {
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

      return {
        buffer: imageBuffer,
        contentType: contentType,
      };
    } catch (error) {
      this.logger.error("Error converting HTML to JPG:", error);
      throw error;
    }
  }
}

// Singleton instance
export const renderImageService = new RenderImageService(); 
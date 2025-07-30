import { ParameterStoreService } from "./parameters";

export class RevalidationService {
  /**
   * Trigger revalidation for specific tags
   * @param tags Array of tags to revalidate (e.g., ['albums', 'media'])
   */
  static async revalidate(tags: string[]): Promise<void> {
    if (!tags || tags.length === 0) {
      console.log("No revalidation tags provided, skipping revalidation");
      return;
    }

    try {
      console.log("Fetching revalidation parameters...");

      const [frontendUrl, revalidateSecret] = await Promise.all([
        ParameterStoreService.getFrontendUrl(),
        ParameterStoreService.getRevalidateSecret(),
      ]);

      // Trigger revalidation for each tag
      const revalidationPromises = tags.map(async (tag) => {
        const revalidateUrl = `${frontendUrl}/api/revalidate?secret=${revalidateSecret}&tag=${tag}`;
        console.log(
          "Triggering revalidation for tag:",
          tag,
          "URL:",
          revalidateUrl.replace(revalidateSecret, "***")
        );

        try {
          const revalidateResponse = await fetch(revalidateUrl, {
            method: "POST",
          });

          if (!revalidateResponse.ok) {
            const errorText = await revalidateResponse.text();
            console.error(`Revalidation failed for tag ${tag}:`, {
              status: revalidateResponse.status,
              statusText: revalidateResponse.statusText,
              body: errorText,
            });
          } else {
            const result = await revalidateResponse.json();
            console.log(`Revalidation successful for tag ${tag}:`, result);
          }
        } catch (error) {
          console.error(`Error during revalidation for tag ${tag}:`, error);
        }
      });

      await Promise.all(revalidationPromises);
    } catch (revalidateError) {
      console.error("Error triggering revalidation:", revalidateError);
      // Do not block the response for revalidation failure
    }
  }

  /**
   * Trigger revalidation for albums
   */
  static async revalidateAlbums(): Promise<void> {
    await this.revalidate(["albums"]);
  }

  /**
   * Trigger revalidation for a specific album
   * @param albumId The album ID to revalidate
   */
  static async revalidateAlbum(albumId: string): Promise<void> {
    await this.revalidate(["albums", `album-${albumId}`]);
  }

  /**
   * Trigger revalidation for a specific media page
   * @param mediaId The media ID to revalidate
   */
  static async revalidateMedia(mediaId: string): Promise<void> {
    await this.revalidate(["medias", `media-${mediaId}`]);
  }
}

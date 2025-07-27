// Re-export all API modules from their themed files
export { userApi } from "./user";
export { interactionApi } from "./interactions";
export { albumsApi } from "./albums";
export { adminAlbumsApi } from "./admin-albums";
export { mediaApi } from "./media";

// Export API_URL for backward compatibility
const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not set");
}

export default API_URL;

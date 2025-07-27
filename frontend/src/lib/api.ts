// Re-export all API modules from their themed files
export { userApi } from "./api/user";
export { interactionApi } from "./api/interactions";
export { albumsApi } from "./api/albums";
export { adminAlbumsApi } from "./api/admin-albums";
export { mediaApi } from "./api/media";

// Export API_URL for backward compatibility
const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  // This error will be caught during server-side rendering and build time
  throw new Error("NEXT_PUBLIC_API_URL is not set");
}

export default API_URL;

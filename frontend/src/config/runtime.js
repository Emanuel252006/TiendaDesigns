const cleanBaseUrl = (import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/, "");

export const API_BASE_URL = cleanBaseUrl;
export const API_PREFIX = `${API_BASE_URL}/api`;
export const IMAGES_BASE_URL = `${API_BASE_URL}/images`;

/**
 * API utility functions with proper error handling
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export interface ApiError {
  message: string;
  status?: number;
}

export class ApiException extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiException";
    this.status = status;
  }
}

/**
 * Get auth token from localStorage
 */
export const getAuthToken = (): string | null => {
  const user = localStorage.getItem("user");
  if (user) {
    try {
      const parsed = JSON.parse(user);
      return parsed.token || null;
    } catch {
      return null;
    }
  }
  return null;
};

/**
 * Get auth headers with token
 */
export const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

/**
 * Handle API response and throw appropriate errors
 */
export const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    let errorMessage = "An error occurred";
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // If response is not JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }
    throw new ApiException(errorMessage, response.status);
  }
  return response.json();
};

/**
 * API functions for buckets
 */
export const bucketApi = {
  /**
   * Fetch all buckets for the current user
   */
  getBuckets: async (): Promise<any[]> => {
    const response = await fetch(`${API_URL}/buckets`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<any[]>(response);
  },

  /**
   * Create a new bucket
   */
  createBucket: async (name: string, region: string): Promise<any> => {
    const response = await fetch(`${API_URL}/buckets`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, region }),
    });
    return handleResponse<any>(response);
  },

  /**
   * Delete a bucket
   */
  deleteBucket: async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/buckets/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      await handleResponse(response);
    }
  },

  /**
   * Add a file to a bucket
   */
  addFileToBucket: async (bucketId: string, file: File, parentId?: string): Promise<any> => {
    const formData = new FormData();
    formData.append("file", file);
    // Use file.name which may include the folder path
    formData.append("name", file.name);
    formData.append("type", file.type);
    formData.append("size", file.size.toString());
    if (parentId) {
      formData.append("parentId", parentId);
    }

    const token = getAuthToken();
    const headers: HeadersInit = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/buckets/${bucketId}/files`, {
      method: "POST",
      headers,
      body: formData,
    });
    return handleResponse<any>(response);
  },

  /**
   * Delete a file from a bucket
   */
  deleteFileFromBucket: async (bucketId: string, fileId: string): Promise<any> => {
    const response = await fetch(`${API_URL}/buckets/${bucketId}/files/${fileId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(response);
  },

  /**
   * Create a folder in a bucket
   */
  createFolder: async (bucketId: string, folderName: string, parentId?: string): Promise<any> => {
    const response = await fetch(`${API_URL}/buckets/${bucketId}/folders`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ folderName, parentId }),
    });
    return handleResponse<any>(response);
  },
};

/**
 * API functions for authentication
 */
export const authApi = {
  /**
   * Login user
   */
  login: async (email: string, password: string): Promise<any> => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse<any>(response);
  },

  /**
   * Register user
   */
  register: async (name: string, email: string, password: string): Promise<any> => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    return handleResponse<any>(response);
  },

  /**
   * Get user profile
   */
  getProfile: async (): Promise<any> => {
    const response = await fetch(`${API_URL}/auth/profile`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(response);
  },
};

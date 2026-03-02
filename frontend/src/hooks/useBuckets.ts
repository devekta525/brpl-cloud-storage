/**
 * React Query hooks for bucket operations
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { bucketApi } from "@/lib/api";
import { Bucket, StoredFile } from "@/context/AppContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * Recursively map file items from nested structure to flat structure with path
 */
const mapFileItem = (item: any, bucketName: string, parentPath: string = ""): StoredFile[] => {
  const currentPath = parentPath ? `${parentPath}${item.name}/` : `${item.name}/`;
  const fullPath = parentPath ? `${parentPath}${item.name}` : item.name;
  
  const isBase64 = item.dataUrl && item.dataUrl.startsWith("data:");
  const dynamicUrl = item.dataUrl || `${API_URL}/public/${bucketName}/${fullPath}`;
  
  const mappedItem: StoredFile = {
    id: item._id,
    name: item.type === "folder" ? currentPath : fullPath,
    type: item.type,
    size: item.size,
    dataUrl: isBase64 ? item.dataUrl : dynamicUrl,
    uploadedAt: item.uploadedAt,
    parentId: item.parent || null,
    children: item.children || [],
  };

  const result: StoredFile[] = [mappedItem];

  // Recursively map children
  if (item.children && item.children.length > 0) {
    for (const child of item.children) {
      result.push(...mapFileItem(child, bucketName, currentPath));
    }
  }

  return result;
};

/**
 * Map backend bucket format to frontend format
 */
export const mapBucket = (b: any): Bucket => ({
  id: b._id,
  name: b.name,
  region: b.region,
  createdAt: b.createdAt,
  files: b.files
    ? b.files.flatMap((f: any) => mapFileItem(f, b.name, ""))
    : [],
});

/**
 * Query key factory for buckets
 */
export const bucketKeys = {
  all: ["buckets"] as const,
  lists: () => [...bucketKeys.all, "list"] as const,
  list: (filters: string) => [...bucketKeys.lists(), { filters }] as const,
  details: () => [...bucketKeys.all, "detail"] as const,
  detail: (id: string) => [...bucketKeys.details(), id] as const,
};

/**
 * Hook to fetch all buckets
 */
export const useBuckets = () => {
  return useQuery({
    queryKey: bucketKeys.lists(),
    queryFn: async () => {
      const data = await bucketApi.getBuckets();
      return data.map(mapBucket);
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
  });
};

/**
 * Hook to create a new bucket
 */
export const useCreateBucket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, region }: { name: string; region: string }) =>
      bucketApi.createBucket(name, region),
    onSuccess: (data) => {
      // Invalidate and refetch buckets list
      queryClient.invalidateQueries({ queryKey: bucketKeys.lists() });
      toast.success("Bucket created successfully");
    },
    onError: (error: any) => {
      const message = error?.message || "Failed to create bucket";
      toast.error(message);
    },
  });
};

/**
 * Hook to delete a bucket
 */
export const useDeleteBucket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => bucketApi.deleteBucket(id),
    onSuccess: () => {
      // Invalidate and refetch buckets list
      queryClient.invalidateQueries({ queryKey: bucketKeys.lists() });
      toast.success("Bucket deleted");
    },
    onError: (error: any) => {
      const message = error?.message || "Failed to delete bucket";
      toast.error(message);
    },
  });
};

/**
 * Hook to add a file to a bucket
 */
export const useAddFileToBucket = () => {
  const queryClient = useQueryClient();
  const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

  return useMutation({
    mutationFn: ({ bucketId, file, parentId }: { bucketId: string; file: File; parentId?: string }) =>
      bucketApi.addFileToBucket(bucketId, file, parentId),
    onSuccess: (data, variables) => {
      // Invalidate buckets list to refetch updated bucket
      queryClient.invalidateQueries({ queryKey: bucketKeys.lists() });
      // Show just the filename without the path
      const fileName = variables.file.name.split("/").pop() || variables.file.name;
      toast.success(`Uploaded ${fileName}`);
    },
    onError: (error: any) => {
      // Handle 413 (Request Entity Too Large) specifically
      if (error?.status === 413) {
        const message = error?.message || `File too large. Maximum file size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
        toast.error(message);
      } else {
        const message = error?.message || "Failed to upload file";
        toast.error(message);
      }
    },
  });
};

/**
 * Hook to delete a file from a bucket
 */
export const useDeleteFileFromBucket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bucketId, fileId }: { bucketId: string; fileId: string }) =>
      bucketApi.deleteFileFromBucket(bucketId, fileId),
    onSuccess: () => {
      // Invalidate buckets list to refetch updated bucket
      queryClient.invalidateQueries({ queryKey: bucketKeys.lists() });
      toast.success("File deleted");
    },
    onError: (error: any) => {
      const message = error?.message || "Failed to delete file";
      toast.error(message);
    },
  });
};

/**
 * Hook to create a folder in a bucket
 */
export const useCreateFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bucketId, folderName, parentId }: { bucketId: string; folderName: string; parentId?: string }) =>
      bucketApi.createFolder(bucketId, folderName, parentId),
    onSuccess: () => {
      // Invalidate buckets list to refetch updated bucket
      queryClient.invalidateQueries({ queryKey: bucketKeys.lists() });
      toast.success("Folder created successfully");
    },
    onError: (error: any) => {
      const message = error?.message || "Failed to create folder";
      toast.error(message);
    },
  });
};

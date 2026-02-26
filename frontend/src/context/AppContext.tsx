import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export interface StoredFile {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  uploadedAt: string;
}

export interface Bucket {
  id: string;
  name: string;
  region: string;
  createdAt: string;
  files: StoredFile[];
}

interface AuthUser {
  id: string;
  email: string;
  name: string;
  token: string;
}

interface AppContextType {
  user: AuthUser | null;
  buckets: Bucket[];
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  createBucket: (name: string, region: string) => Promise<void>;
  deleteBucket: (id: string) => Promise<void>;
  addFileToBucket: (bucketId: string, file: Omit<StoredFile, "id" | "uploadedAt">) => Promise<void>;
  deleteFileFromBucket: (bucketId: string, fileId: string) => Promise<void>;
  loading: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
};

const mapBucket = (b: any): Bucket => ({
  id: b._id,
  name: b.name,
  region: b.region,
  createdAt: b.createdAt,
  files: b.files ? b.files.map((f: any) => {
    const isBase64 = f.dataUrl && f.dataUrl.startsWith("data:");
    const dynamicUrl = `${API_URL}/public/${b.name}/${f.name}`;
    return {
      id: f._id,
      name: f.name,
      type: f.type,
      size: f.size,
      dataUrl: isBase64 ? f.dataUrl : dynamicUrl,
      uploadedAt: f.uploadedAt,
    };
  }) : [],
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const token = localStorage.getItem("token");
    const u = localStorage.getItem("user");
    if (token && u) return JSON.parse(u);
    return null;
  });
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBuckets = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/buckets`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBuckets(data.map(mapBucket));
      }
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchBuckets().finally(() => setLoading(false));
    } else {
      setLoading(false);
      setBuckets([]);
    }
  }, [user, fetchBuckets]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      let res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.status === 401 || res.status === 400 || res.status === 404) {
        res = await fetch(`${API_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: email.split("@")[0], email, password }),
        });
      }

      if (res.ok) {
        const data = await res.json();
        const u = { id: data._id, name: data.name, email: data.email, token: data.token };
        setUser(u);
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(u));
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }, []);

  const createBucket = useCallback(async (name: string, region: string) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/buckets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ name, region }),
      });
      if (res.ok) {
        const newB = await res.json();
        setBuckets(prev => [...prev, mapBucket(newB)]);
        toast.success("Bucket created successfully");
      } else {
        toast.error("Failed to create bucket");
      }
    } catch {
      toast.error("Network error");
    }
  }, [user]);

  const deleteBucket = useCallback(async (id: string) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/buckets/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (res.ok) {
        setBuckets(prev => prev.filter(b => b.id !== id));
        toast.success("Bucket deleted");
      } else {
        toast.error("Failed to delete bucket");
      }
    } catch {
      toast.error("Network error");
    }
  }, [user]);

  const addFileToBucket = useCallback(async (bucketId: string, file: Omit<StoredFile, "id" | "uploadedAt">) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/buckets/${bucketId}/files`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: file.dataUrl
        }),
      });
      if (res.ok) {
        const updatedB = await res.json();
        setBuckets(prev => prev.map(b => b.id === bucketId ? mapBucket(updatedB) : b));
        toast.success("File uploaded");
      } else {
        toast.error("Failed to upload file");
      }
    } catch {
      toast.error("Network error");
    }
  }, [user]);

  const deleteFileFromBucket = useCallback(async (bucketId: string, fileId: string) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/buckets/${bucketId}/files/${fileId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (res.ok) {
        const updatedB = await res.json();
        setBuckets(prev => prev.map(b => b.id === bucketId ? mapBucket(updatedB) : b));
        toast.success("File deleted");
      } else {
        toast.error("Failed to delete file");
      }
    } catch {
      toast.error("Network error");
    }
  }, [user]);

  return (
    <AppContext.Provider value={{
      user, buckets, login, logout, createBucket, deleteBucket, addFileToBucket, deleteFileFromBucket, loading
    }}>
      {children}
    </AppContext.Provider>
  );
};

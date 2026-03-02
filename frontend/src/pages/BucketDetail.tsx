import { useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { StoredFile } from "@/context/AppContext";
import { useBuckets, useAddFileToBucket, useDeleteFileFromBucket, useCreateFolder } from "@/hooks/useBuckets";
import AwsNavbar from "@/components/AwsNavbar";
import AwsSidebar from "@/components/AwsSidebar";
import AwsBreadcrumb from "@/components/AwsBreadcrumb";
import FilePreviewDialog from "@/components/FilePreviewDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, Search, Trash2, Copy, Eye, RefreshCw, FolderPlus, Download, ExternalLink, Folder } from "lucide-react";
import { toast } from "sonner";

const BucketDetail = () => {
  const { bucketId } = useParams<{ bucketId: string }>();
  const { data: buckets = [], isLoading, refetch } = useBuckets();
  const addFileMutation = useAddFileToBucket();
  const deleteFileMutation = useDeleteFileFromBucket();
  const createFolderMutation = useCreateFolder();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [previewFile, setPreviewFile] = useState<StoredFile | null>(null);
  const [tab, setTab] = useState("Objects");
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null); // Track current folder ID

  const bucket = buckets.find(b => b.id === bucketId);

  const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

  const handleUpload = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = "image/*,video/*";
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || !bucketId) return;

      // Validate file sizes before uploading
      const oversizedFiles: string[] = [];
      for (const file of Array.from(files)) {
        if (file.size > MAX_FILE_SIZE) {
          oversizedFiles.push(file.name);
        }
      }

      if (oversizedFiles.length > 0) {
        toast.error(
          `File(s) too large (max ${MAX_FILE_SIZE / (1024 * 1024)}MB): ${oversizedFiles.join(", ")}`
        );
        return;
      }

      // Upload files sequentially to avoid overwhelming the server
      for (const file of Array.from(files)) {
        try {
          await addFileMutation.mutateAsync({
            bucketId,
            file,
            parentId: currentFolderId || undefined
          });
        } catch (err: any) {
          // Check for 413 error specifically
          if (err?.status === 413) {
            toast.error(
              `File "${file.name}" is too large. Maximum file size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
            );
          }
          // Other errors are already handled by the mutation's onError
          console.error(`Failed to upload ${file.name}:`, err);
        }
      }
    };
    input.click();
  }, [bucketId, addFileMutation, currentFolderId]);

  const handleDelete = async () => {
    if (!bucketId) return;

    // Delete files sequentially
    for (const fileId of selected) {
      try {
        await deleteFileMutation.mutateAsync({ bucketId, fileId });
      } catch (err) {
        // Error is already handled by the mutation's onError
        console.error(`Failed to delete file ${fileId}:`, err);
      }
    }
    setSelected([]);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleCreateFolder = async () => {
    if (!bucketId || !folderName.trim()) {
      toast.error("Please enter a folder name");
      return;
    }

    try {
      await createFolderMutation.mutateAsync({
        bucketId,
        folderName: folderName.trim(),
        parentId: currentFolderId || undefined
      });
      setShowCreateFolderDialog(false);
      setFolderName("");
    } catch (err) {
      // Error is already handled by the mutation's onError
      console.error("Failed to create folder:", err);
    }
  };

  // Navigate into a folder
  const handleFolderClick = (folderId: string) => {
    setCurrentFolderId(folderId);
    setSelected([]); // Clear selection when navigating
  };

  // Navigate up/back from current folder
  const handleNavigateUp = () => {
    if (!currentFolderId || !bucket) return;

    // Find the current folder to get its parent
    const currentFolder = bucket.files.find(f => f.id === currentFolderId);
    if (currentFolder && currentFolder.parentId) {
      setCurrentFolderId(currentFolder.parentId);
    } else {
      setCurrentFolderId(null); // Go back to root
    }
    setSelected([]);
  };

  // Get files/folders in the current folder
  const getFilesInCurrentFolder = () => {
    if (!bucket) return [];

    // Filter files by parentId
    return bucket.files.filter(file => {
      if (currentFolderId === null) {
        // Root level: files with no parentId
        return !file.parentId;
      } else {
        // Children of current folder
        return file.parentId === currentFolderId;
      }
    });
  };

  // Get breadcrumb path
  const getBreadcrumbPath = () => {
    if (!bucket || !currentFolderId) return [];

    const path: Array<{ id: string | null; name: string }> = [];
    let currentId: string | null = currentFolderId;

    while (currentId) {
      const folder = bucket.files.find(f => f.id === currentId);
      if (folder) {
        path.unshift({ id: currentId, name: folder.name.replace(/\/$/, "") });
        currentId = folder.parentId || null;
      } else {
        break;
      }
    }

    return path;
  };

  const handleDownloadObject = async () => {
    if (selected.length !== 1) return;
    const file = filtered.find(f => f.id === selected[0]);
    if (!file) return;
    try {
      const baseUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");
      const url = `${baseUrl}${file.dataUrl}`;
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(objectUrl);
      document.body.removeChild(a);
    } catch (error) {
      toast.error("Failed to download file");
    }
  };

  const copyLink = (file: StoredFile) => {
    const baseUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");
    const url = `${baseUrl}${file.dataUrl}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (!bucket) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AwsNavbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Bucket not found</p>
        </div>
      </div>
    );
  }

  const filesInCurrentFolder = getFilesInCurrentFolder();
  const filtered = filesInCurrentFolder.filter(f => {
    const displayName = f.type === "folder" ? f.name.replace(/\/$/, "") : f.name.split("/").pop() || f.name;
    return displayName.toLowerCase().includes(search.toLowerCase());
  });
  const tabs = ["Objects", "Metadata", "Properties", "Permissions", "Metrics", "Management"];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AwsNavbar />
      <div className="flex flex-1 overflow-hidden">
        <AwsSidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <AwsBreadcrumb items={[
            { label: "CloudStore S3", onClick: () => navigate("/dashboard") },
            { label: "Buckets", onClick: () => navigate("/dashboard") },
            { label: bucket.name },
            ...getBreadcrumbPath().map((item) => ({
              label: item.name,
              onClick: () => {
                setCurrentFolderId(item.id);
                setSelected([]);
              }
            }))
          ]} />

          <div className="flex items-center gap-3 mt-2 mb-4">
            <h1 className="text-xl font-bold">
              {currentFolderId
                ? bucket.files.find(f => f.id === currentFolderId)?.name.replace(/\/$/, "") || bucket.name
                : bucket.name}
            </h1>
            {currentFolderId && (
              <button
                onClick={handleNavigateUp}
                className="text-xs text-aws-link hover:underline"
                title="Go up one level"
              >
                ← Up
              </button>
            )}
            <span className="text-xs text-aws-link cursor-pointer">Info</span>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border mb-4">
            {tabs.map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === "Objects" && (
            <div className="bg-card border border-border rounded-sm">
              {/* Actions bar */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="aws-btn-secondary p-1.5 disabled:opacity-40"
                    title="Refresh"
                  >
                    <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
                  </button>
                  <button onClick={() => copyLink(filtered[0])} disabled={selected.length !== 1} className="aws-btn-secondary disabled:opacity-40 flex items-center gap-1">
                    <Copy size={14} />Copy URL
                  </button>
                  <button onClick={handleDownloadObject} disabled={selected.length !== 1} className="aws-btn-secondary disabled:opacity-40 flex items-center gap-1">
                    <Download size={14} />Download
                  </button>
                  <button onClick={() => {
                    const file = filtered.find(f => f.id === selected[0]);
                    if (file) {
                      const baseUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");
                      window.open(`${baseUrl}${file.dataUrl}`, "_blank");
                    }
                  }} disabled={selected.length !== 1} className="aws-btn-secondary disabled:opacity-40 flex items-center gap-1">
                    <ExternalLink size={14} />Open
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={selected.length === 0 || deleteFileMutation.isPending}
                    className="aws-btn-secondary disabled:opacity-40 flex items-center gap-1"
                  >
                    <Trash2 size={14} />Delete
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleUpload}
                    disabled={addFileMutation.isPending}
                    className="aws-btn-primary disabled:opacity-40 flex items-center gap-1"
                  >
                    <Upload size={14} />{addFileMutation.isPending ? "Uploading..." : "Upload"}
                  </button>
                  <button
                    onClick={() => setShowCreateFolderDialog(true)}
                    className="aws-btn-secondary flex items-center gap-1"
                  >
                    <FolderPlus size={14} />Create folder
                  </button>
                </div>
              </div>

              <div className="px-4 py-2 text-xs text-muted-foreground">
                Objects are the fundamental entities stored in CloudStore S3.
              </div>

              <div className="px-4 pb-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Find objects by prefix"
                    className="w-full max-w-md border border-input rounded-sm pl-9 pr-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring bg-card"
                  />
                </div>
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr className="border-t border-border bg-secondary/50">
                    <th className="w-10 px-4 py-2"><input type="checkbox" className="accent-primary" /></th>
                    <th className="text-left px-4 py-2 font-semibold text-xs">Name</th>
                    <th className="text-left px-4 py-2 font-semibold text-xs">Type</th>
                    <th className="text-left px-4 py-2 font-semibold text-xs">Last modified</th>
                    <th className="text-left px-4 py-2 font-semibold text-xs">Size</th>
                    <th className="text-left px-4 py-2 font-semibold text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                        Loading files...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                        {search ? "No files match your search." : "No objects in this bucket. Upload files to get started."}
                      </td>
                    </tr>
                  ) : (
                    filtered.map(file => (
                      <tr key={file.id} className="border-t border-border hover:bg-muted/50">
                        <td className="px-4 py-2">
                          <input
                            type="checkbox"
                            checked={selected.includes(file.id)}
                            onChange={() => setSelected(prev => prev.includes(file.id) ? prev.filter(x => x !== file.id) : [...prev, file.id])}
                            className="accent-primary"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            {file.type === "folder" ? (
                              <Folder size={16} className="text-aws-link" />
                            ) : null}
                            <button
                              onClick={() => {
                                if (file.type === "folder") {
                                  handleFolderClick(file.id);
                                } else {
                                  setPreviewFile(file);
                                }
                              }}
                              className="aws-link font-medium hover:underline"
                            >
                              {file.type === "folder"
                                ? file.name.replace(/\/$/, "")
                                : file.name.split("/").pop() || file.name}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {file.type === "folder" ? "folder" : file.type.split("/")[1]}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {new Date(file.uploadedAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {file.type === "folder" ? "-" : formatSize(file.size)}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-1">
                            {file.type !== "folder" && (
                              <>
                                <button onClick={() => setPreviewFile(file)} className="p-1 hover:bg-secondary rounded-sm" title="Preview">
                                  <Eye size={14} className="text-aws-link" />
                                </button>
                                <button onClick={() => copyLink(file)} className="p-1 hover:bg-secondary rounded-sm" title="Copy URL">
                                  <Copy size={14} className="text-aws-link" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {previewFile && (
        <FilePreviewDialog file={previewFile} bucketName={bucket.name} region={bucket.region} onClose={() => setPreviewFile(null)} />
      )}

      {/* Create Folder Dialog */}
      <Dialog open={showCreateFolderDialog} onOpenChange={setShowCreateFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Folder</DialogTitle>
            <DialogDescription>
              Enter a name for the new folder. The folder will be created in the current bucket.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Folder name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreateFolder();
                }
              }}
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-2">
              Folder names cannot contain special characters except hyphens and underscores.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateFolderDialog(false);
                setFolderName("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFolder}
              disabled={!folderName.trim() || createFolderMutation.isPending}
            >
              {createFolderMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BucketDetail;

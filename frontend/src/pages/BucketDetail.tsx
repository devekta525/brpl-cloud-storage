import { useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppContext, StoredFile } from "@/context/AppContext";
import AwsNavbar from "@/components/AwsNavbar";
import AwsSidebar from "@/components/AwsSidebar";
import AwsBreadcrumb from "@/components/AwsBreadcrumb";
import FilePreviewDialog from "@/components/FilePreviewDialog";
import { Upload, Search, Trash2, Copy, Eye, RefreshCw, FolderPlus, Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const BucketDetail = () => {
  const { bucketId } = useParams<{ bucketId: string }>();
  const { buckets, addFileToBucket, deleteFileFromBucket } = useAppContext();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [previewFile, setPreviewFile] = useState<StoredFile | null>(null);
  const [tab, setTab] = useState("Objects");

  const bucket = buckets.find(b => b.id === bucketId);

  const handleUpload = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = "image/*,video/*";
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || !bucketId) return;

      for (const file of Array.from(files)) {
        const success = await addFileToBucket(bucketId, file);
        if (success) {
          toast.success(`Uploaded ${file.name}`);
        }
      }
    };
    input.click();
  }, [bucketId, addFileToBucket]);

  const handleDelete = () => {
    if (!bucketId) return;
    selected.forEach(id => deleteFileFromBucket(bucketId, id));
    setSelected([]);
    toast.success("Files deleted");
  };

  const handleDownloadObject = async () => {
    if (selected.length !== 1) return;
    const file = filtered.find(f => f.id === selected[0]);
    if (!file) return;
    try {
      const url = `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/public/${bucket?.name}/${file.name}`;
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
    const url = `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/public/${bucket?.name}/${file.name}`;
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

  const filtered = bucket.files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
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
          ]} />

          <div className="flex items-center gap-3 mt-2 mb-4">
            <h1 className="text-xl font-bold">{bucket.name}</h1>
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
                  <button className="aws-btn-secondary p-1.5"><RefreshCw size={14} /></button>
                  <button onClick={() => copyLink(filtered[0])} disabled={selected.length !== 1} className="aws-btn-secondary disabled:opacity-40 flex items-center gap-1">
                    <Copy size={14} />Copy URL
                  </button>
                  <button onClick={handleDownloadObject} disabled={selected.length !== 1} className="aws-btn-secondary disabled:opacity-40 flex items-center gap-1">
                    <Download size={14} />Download
                  </button>
                  <button onClick={() => window.open(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/public/${bucket?.name}/${filtered.find(f => f.id === selected[0])?.name}`, "_blank")} disabled={selected.length !== 1} className="aws-btn-secondary disabled:opacity-40 flex items-center gap-1">
                    <ExternalLink size={14} />Open
                  </button>
                  <button onClick={handleDelete} disabled={selected.length === 0} className="aws-btn-secondary disabled:opacity-40 flex items-center gap-1">
                    <Trash2 size={14} />Delete
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleUpload} className="aws-btn-primary flex items-center gap-1">
                    <Upload size={14} />Upload
                  </button>
                  <button className="aws-btn-secondary flex items-center gap-1">
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
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                        No objects in this bucket. Upload files to get started.
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
                          <button onClick={() => setPreviewFile(file)} className="aws-link font-medium">
                            {file.name}
                          </button>
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">{file.type.split("/")[1]}</td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {new Date(file.uploadedAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">{formatSize(file.size)}</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setPreviewFile(file)} className="p-1 hover:bg-secondary rounded-sm" title="Preview">
                              <Eye size={14} className="text-aws-link" />
                            </button>
                            <button onClick={() => copyLink(file)} className="p-1 hover:bg-secondary rounded-sm" title="Copy URL">
                              <Copy size={14} className="text-aws-link" />
                            </button>
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
    </div>
  );
};

export default BucketDetail;

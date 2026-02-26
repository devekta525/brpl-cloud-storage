import { StoredFile } from "@/context/AppContext";
import { X, Copy, Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface Props {
  file: StoredFile;
  bucketName: string;
  region: string;
  onClose: () => void;
}

const FilePreviewDialog = ({ file, bucketName, region, onClose }: Props) => {
  const s3Url = `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/public/${bucketName}/${file.name}`;
  const s3Uri = `s3://${bucketName}/${file.name}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(s3Url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error("Failed to download");
    }
  };

  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="fixed inset-0 bg-foreground/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-sm w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-lg" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-lg">{file.name}</h2>
            <span className="text-xs text-aws-link cursor-pointer">Info</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => copyToClipboard(s3Url, "URL")} className="aws-btn-secondary flex items-center gap-1 text-xs">
              <Copy size={12} />Copy URL
            </button>
            <button onClick={handleDownload} className="aws-btn-secondary flex items-center gap-1 text-xs">
              <Download size={12} />Download
            </button>
            <button onClick={() => window.open(s3Url, "_blank")} className="aws-btn-secondary flex items-center gap-1 text-xs">
              <ExternalLink size={12} />Open
            </button>
            <button onClick={onClose} className="p-1 hover:bg-secondary rounded-sm ml-2">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="p-6 border-b border-border bg-muted/30">
          {isImage && (
            <div className="flex justify-center">
              <img src={file.dataUrl} alt={file.name} className="max-h-80 rounded-sm border border-border object-contain" />
            </div>
          )}
          {isVideo && (
            <div className="flex justify-center">
              <video src={file.dataUrl} controls className="max-h-80 rounded-sm border border-border" />
            </div>
          )}
          {!isImage && !isVideo && (
            <div className="text-center text-muted-foreground py-8">Preview not available for this file type</div>
          )}
        </div>

        {/* Properties */}
        <div className="px-6 py-4">
          <h3 className="font-bold text-sm mb-4">Object overview</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Last modified</p>
              <p>{new Date(file.uploadedAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">S3 URI</p>
              <div className="flex items-center gap-1">
                <button onClick={() => copyToClipboard(s3Uri, "S3 URI")} className="p-0.5 hover:bg-secondary rounded-sm">
                  <Copy size={12} className="text-aws-link" />
                </button>
                <span className="text-xs truncate">{s3Uri}</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Size</p>
              <p>{formatSize(file.size)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Object URL</p>
              <div className="flex items-center gap-1">
                <button onClick={() => copyToClipboard(s3Url, "URL")} className="p-0.5 hover:bg-secondary rounded-sm">
                  <Copy size={12} className="text-aws-link" />
                </button>
                <span className="aws-link text-xs truncate">{s3Url}</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Type</p>
              <p>{file.type}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilePreviewDialog;

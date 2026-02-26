import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import AwsNavbar from "@/components/AwsNavbar";
import AwsSidebar from "@/components/AwsSidebar";
import AwsBreadcrumb from "@/components/AwsBreadcrumb";

const REGIONS = [
  "Asia Pacific (Mumbai) ap-south-1",
  "US East (N. Virginia) us-east-1",
  "US West (Oregon) us-west-2",
  "Europe (Ireland) eu-west-1",
  "Europe (Frankfurt) eu-central-1",
  "Asia Pacific (Singapore) ap-southeast-1",
  "Asia Pacific (Tokyo) ap-northeast-1",
];

const CreateBucket = () => {
  const { createBucket } = useAppContext();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [region, setRegion] = useState(REGIONS[0]);
  const [error, setError] = useState("");

  const handleCreate = () => {
    if (!name.trim()) {
      setError("Bucket name is required");
      return;
    }
    if (!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(name)) {
      setError("Bucket name must be 3-63 chars, lowercase letters, numbers, hyphens, dots");
      return;
    }
    createBucket(name, region);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AwsNavbar />
      <div className="flex flex-1 overflow-hidden">
        <AwsSidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <AwsBreadcrumb items={[
            { label: "CloudStore S3", onClick: () => navigate("/dashboard") },
            { label: "Buckets", onClick: () => navigate("/dashboard") },
            { label: "Create bucket" },
          ]} />

          <h1 className="text-xl font-bold mt-2 mb-6">Create bucket</h1>

          <div className="bg-card border border-border rounded-sm max-w-2xl">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="font-bold text-sm">General configuration</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Bucket name</label>
                <input
                  value={name}
                  onChange={e => { setName(e.target.value); setError(""); }}
                  placeholder="my-bucket-name"
                  className="w-full border border-input rounded-sm px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring bg-card"
                />
                {error && <p className="text-destructive text-xs mt-1">{error}</p>}
                <p className="text-xs text-muted-foreground mt-1">
                  Bucket name must be globally unique and follow naming rules.
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">AWS Region</label>
                <select
                  value={region}
                  onChange={e => setRegion(e.target.value)}
                  className="w-full border border-input rounded-sm px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring bg-card"
                >
                  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
              <button onClick={() => navigate("/dashboard")} className="aws-btn-secondary">Cancel</button>
              <button onClick={handleCreate} className="aws-btn-primary">Create bucket</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreateBucket;

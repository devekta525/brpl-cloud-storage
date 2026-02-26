import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import AwsNavbar from "@/components/AwsNavbar";
import AwsSidebar from "@/components/AwsSidebar";
import AwsBreadcrumb from "@/components/AwsBreadcrumb";
import { RefreshCw, Search, Trash2, Plus, Info } from "lucide-react";

const Dashboard = () => {
  const { buckets, deleteBucket } = useAppContext();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = buckets.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleDelete = () => {
    selected.forEach(id => deleteBucket(id));
    setSelected([]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AwsNavbar />
      <div className="flex flex-1 overflow-hidden">
        <AwsSidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <AwsBreadcrumb items={[
            { label: "CloudStore S3" },
            { label: "Buckets" },
          ]} />

          <div className="flex items-center gap-2 mb-1 mt-2">
            <h1 className="text-xl font-bold">General purpose buckets</h1>
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-sm">All Regions</span>
          </div>

          {/* Bucket list card */}
          <div className="bg-card border border-border rounded-sm mt-4">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm">General purpose buckets ({filtered.length})</h2>
                <Info size={12} className="text-muted-foreground" />
              </div>
              <div className="flex items-center gap-2">
                <button className="aws-btn-secondary p-1.5"><RefreshCw size={14} /></button>
                <button
                  onClick={handleDelete}
                  disabled={selected.length === 0}
                  className="aws-btn-secondary disabled:opacity-40"
                >
                  <Trash2 size={14} className="inline mr-1" />Delete
                </button>
                <button onClick={() => navigate("/create-bucket")} className="aws-btn-primary flex items-center gap-1">
                  <Plus size={14} />Create bucket
                </button>
              </div>
            </div>

            <div className="px-4 py-2 text-xs text-muted-foreground">
              Buckets are containers for data stored in S3.
            </div>

            <div className="px-4 pb-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Find buckets by name"
                  className="w-full max-w-md border border-input rounded-sm pl-9 pr-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring bg-card"
                />
              </div>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-border bg-secondary/50">
                  <th className="w-10 px-4 py-2"><input type="checkbox" className="accent-primary" /></th>
                  <th className="text-left px-4 py-2 font-semibold text-xs">Name</th>
                  <th className="text-left px-4 py-2 font-semibold text-xs">Region</th>
                  <th className="text-left px-4 py-2 font-semibold text-xs">Objects</th>
                  <th className="text-left px-4 py-2 font-semibold text-xs">Creation date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                      No buckets found. Create one to get started.
                    </td>
                  </tr>
                ) : (
                  filtered.map(bucket => (
                    <tr key={bucket.id} className="border-t border-border hover:bg-muted/50">
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={selected.includes(bucket.id)}
                          onChange={() => toggleSelect(bucket.id)}
                          className="accent-primary"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <button onClick={() => navigate(`/bucket/${bucket.id}`)} className="aws-link font-medium">
                          {bucket.name}
                        </button>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{bucket.region}</td>
                      <td className="px-4 py-2 text-muted-foreground">{bucket.files.length}</td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {new Date(bucket.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;

import { ChevronDown, ChevronRight, Database, Shield, BarChart3 } from "lucide-react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const sections = [
  {
    title: "Buckets",
    items: [
      { name: "General purpose buckets", path: "/dashboard" },
      { name: "Directory buckets", path: "/directory-buckets" },
      { name: "Table buckets", path: "/table-buckets" },
    ],
  },
  {
    title: "Access management",
    items: [
      { name: "Access Points", path: "/access-points" },
      { name: "Access Grants", path: "/access-grants" },
      { name: "IAM Access Analyzer", path: "/iam-access-analyzer" },
    ],
  },
  {
    title: "Storage insights",
    items: [
      { name: "Storage Lens", path: "/storage-lens" },
      { name: "Batch Operations", path: "/batch-operations" },
    ],
  },
];

const iconMap: Record<string, React.ReactNode> = {
  Buckets: <Database size={14} />,
  "Access management": <Shield size={14} />,
  "Storage insights": <BarChart3 size={14} />,
};

const AwsSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Buckets: true,
    "Access management": true,
    "Storage insights": true,
  });
  const navigate = useNavigate();
  const location = useLocation();

  const toggle = (title: string) => {
    setOpenSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  if (collapsed) {
    return (
      <div className="w-10 bg-card border-r border-border flex flex-col items-center pt-4 shrink-0 transition-all">
        <button onClick={() => setCollapsed(false)} className="text-muted-foreground hover:text-foreground">
          <ChevronRight size={16} />
        </button>
      </div>
    );
  }

  return (
    <aside className="w-56 bg-card border-r border-border shrink-0 overflow-y-auto transition-all">
      <div className="flex items-center justify-between px-3 py-3 border-b border-border">
        <span className="font-bold text-sm">CloudStore S3</span>
        <button onClick={() => setCollapsed(true)} className="text-muted-foreground hover:text-foreground">
          <ChevronRight size={14} className="rotate-180" />
        </button>
      </div>
      <nav className="py-2">
        {sections.map(section => (
          <div key={section.title} className="mb-1">
            <button
              onClick={() => toggle(section.title)}
              className="flex items-center gap-2 px-3 py-1.5 w-full text-left text-xs font-bold text-foreground hover:bg-secondary focus:outline-none"
            >
              <div className="w-3 flex justify-center">
                {openSections[section.title] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </div>
              {iconMap[section.title]}
              {section.title}
            </button>
            {openSections[section.title] && (
              <div className="ml-7 flex flex-col">
                {section.items.map((item) => {
                  const isActive = location.pathname === item.path || (location.pathname.startsWith('/bucket/') && item.path === '/dashboard') || (location.pathname === '/create-bucket' && item.path === '/dashboard');
                  return (
                    <button
                      key={item.name}
                      onClick={() => navigate(item.path)}
                      className={`px-3 py-1 text-xs cursor-pointer text-left hover:bg-secondary transition-colors ${isActive ? "text-aws-link font-semibold border-l-2 border-aws-link -ml-[2px] pl-[10px] bg-secondary/50" : "text-muted-foreground border-l-2 border-transparent -ml-[2px] pl-[10px]"
                        }`}
                    >
                      {item.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default AwsSidebar;

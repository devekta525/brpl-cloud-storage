import { Search, Bell, Settings, HelpCircle } from "lucide-react";
import { useAppContext } from "@/context/AppContext";

const AwsNavbar = () => {
  const { user, logout } = useAppContext();

  return (
    <header className="bg-aws-nav text-aws-nav-foreground h-12 flex items-center px-4 justify-between text-sm shrink-0">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground font-bold px-2 py-0.5 rounded-sm text-xs">S3</div>
          <span className="font-bold text-base tracking-tight">CloudStore</span>
        </div>
        <div className="hidden md:flex items-center bg-aws-nav-accent rounded-sm px-3 py-1.5 gap-2 w-80">
          <Search size={14} className="opacity-60" />
          <input
            type="text"
            placeholder="Search [Alt+S]"
            className="bg-transparent outline-none text-aws-nav-foreground placeholder:opacity-50 w-full text-sm"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Bell size={16} className="opacity-70 cursor-pointer hover:opacity-100" />
        <HelpCircle size={16} className="opacity-70 cursor-pointer hover:opacity-100" />
        <Settings size={16} className="opacity-70 cursor-pointer hover:opacity-100" />
        {user && (
          <div className="flex items-center gap-3 ml-2">
            <span className="text-xs opacity-80">{user.name}</span>
            <button onClick={logout} className="text-xs opacity-70 hover:opacity-100 hover:underline">
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default AwsNavbar;

import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Lock, Eye, EyeOff } from "lucide-react";

const LoginPage = () => {
  const { login } = useAppContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }
    setIsLoading(true);
    const success = await login(email, password);
    setIsLoading(false);
    if (!success) {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-aws-nav h-12 flex items-center px-6 shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground font-bold px-2 py-0.5 rounded-sm text-xs">S3</div>
          <span className="font-bold text-base text-aws-nav-foreground tracking-tight">CloudStore Console</span>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-card border border-border rounded-sm shadow-sm p-8">
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="text-primary" size={24} />
              </div>
            </div>
            <h1 className="text-xl font-bold text-center mb-1">Sign in</h1>
            <p className="text-xs text-muted-foreground text-center mb-6">to access CloudStore S3 Console</p>

            {error && <div className="text-destructive text-xs mb-4 text-center">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full border border-input rounded-sm px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring bg-card"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full border border-input rounded-sm px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring bg-card pr-10"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button disabled={isLoading} type="submit" className="aws-btn-primary w-full py-2">
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
            </form>
            <p className="text-xs text-muted-foreground text-center mt-4">
              Enter any email & password to sign in
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

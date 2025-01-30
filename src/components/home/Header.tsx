"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { supabase } from "@/lib/supabase";

const Header = () => {
  const pathname = usePathname();

  const handleSignIn = async () => {
    try {
      const currentUrl = window.location.href;
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: currentUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to start sign in process. Please try again.");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-zinc-900/80 border-b border-white/5">
      <div className="max-w-[1800px] mx-auto">
        <div className="flex items-center justify-between h-16 px-4 md:px-8">
          {/* Logo and Navigation */}
          <div className="flex items-center gap-8">
            <Link 
              href="/" 
              className="text-white font-bold text-xl tracking-tight hover:text-white/80 transition-colors"
            >
              AntiPlaylist
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {[
                { name: "Discover", href: "/discover" },
                { name: "About", href: "/about" },
              ].map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? "bg-white/10 text-white"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Search and Actions */}
          <div className="flex items-center gap-4">


            {/* Authentication Action */}
            <button
              onClick={handleSignIn}
              className="inline-flex items-center justify-center h-9 px-4 rounded-full 
                       bg-white/5 hover:bg-white/10 border border-white/5
                       text-sm font-medium text-white/90 hover:text-white 
                       transition-all gap-2"
            >
              <FcGoogle className="w-4 h-4" />
              <span>Sign in with Google</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

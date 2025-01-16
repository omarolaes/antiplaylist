"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import React, { useState, useEffect } from "react";
import { RxHamburgerMenu } from "react-icons/rx";
import { useAuth } from "@/lib/auth-context";
import { BsHeart } from "react-icons/bs";
import { supabase } from "@/lib/supabase";

interface HeaderProps {
  setUseYouTubeMode: (value: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ setUseYouTubeMode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const [youtubeQuota, setYoutubeQuota] = useState<number | null>(null);
  const [useYouTubeMode, setLocalYouTubeMode] = useState(false);
  const [isLocalhost, setIsLocalhost] = useState(false);

  useEffect(() => {
    console.log("Current user:", user);
    console.log("User email:", user?.email);
    console.log("Is localhost:", isLocalhost);
    console.log("YouTube quota:", youtubeQuota);
    
    setIsLocalhost(window.location.hostname === "localhost");

    const fetchYoutubeQuota = async () => {
      if (!isLocalhost && user?.email?.toLowerCase() !== "omarolaes@gmail.com") return;

      try {
        const response = await fetch("/api/youtube-quota");
        if (!response.ok) {
          console.warn("YouTube quota fetch failed:", response.statusText);
          return;
        }
        const data = await response.json();
        setYoutubeQuota(data.quota);
      } catch (error) {
        console.warn("Error fetching YouTube quota:", error);
      }
    };

    fetchYoutubeQuota();
  }, [isLocalhost, user]);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (pathname === "/") {
      window.location.href = "/";
    } else {
      router.push("/");
    }
  };

  useEffect(() => {
    console.log("Menu state:", isMenuOpen);
  }, [isMenuOpen]);

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

  const handleYouTubeModeToggle = () => {
    const newValue = !useYouTubeMode;
    setLocalYouTubeMode(newValue);
    setUseYouTubeMode(newValue);
  };

  const calculateQuotaPercentage = (quota: number) => {
    return (quota / 10000) * 100;
  };

  return (
    <div className="w-full py-4 bg-white z-50">
      <div className="container mx-auto px-1 flex items-center justify-between tracking-wide uppercase">
        <button
          onClick={handleLogoClick}
          className="text-3xl font-extrabold leading-[0.5] text-zinc-950 flex items-end gap-2"
        >
          <span className="italic tracking-tighter">AntiPlaylist</span>
          <small className="ml-2 text-[10px] font-medium leading-[0.5] tracking-wider hidden md:block opacity-40 uppercase">
            Beta
          </small>
        </button>

        <button
          className="md:hidden p-2"
          onClick={(e) => {
            e.stopPropagation();
            setIsMenuOpen(!isMenuOpen);
            console.log("Menu toggled:", !isMenuOpen);
          }}
        >
          <RxHamburgerMenu size={24} />
        </button>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          {youtubeQuota !== null && (
            user?.email?.toLowerCase() === "omarolaes@gmail.com" || 
            isLocalhost
          ) && (
            <button
              onClick={handleYouTubeModeToggle}
              className={`text-xs px-6 py-1 bg-white transition-all uppercase ${
                useYouTubeMode 
                  ? 'text-red-500 border-red-500' 
                  : 'text-zinc-950 hover:text-red-500 hover:border-red-500'
              }`}
            >
              <div className="flex items-center gap-1 w-full h-1 bg-gray-200 rounded">
                <div 
                  className="h-full bg-red-500 rounded transition-all"
                  style={{ width: `${calculateQuotaPercentage(youtubeQuota)}%` }}
                />
              </div>
              <span className="text-xs text-gray-600">
                ({calculateQuotaPercentage(youtubeQuota).toFixed(1)}%)
              </span>
            </button>
          )}
          {user && (
            <>
              <Link
                href="/profile"
                className="text-xs px-6 py-1 bg-white text-zinc-950 hover:text-green-500 hover:border-green-500 transition-all uppercase flex items-center gap-1"
              >
                <BsHeart className="mr-1" /> FAVORITES
              </Link>
              <button
                onClick={signOut}
                className="text-xs px-6 py-1 bg-white text-zinc-950 border-2 border-zinc-950 hover:bg-zinc-950 hover:text-white transition-all uppercase"
              >
                Sign Out
              </button>
            </>
          )}
          <Link
            href="/about"
            className="text-xs px-6 py-1 bg-white text-zinc-950 relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-zinc-950 after:transition-all hover:after:w-full uppercase"
          >
            ABOUT
          </Link>
          {!user && (
            <button
              onClick={handleSignIn}
              className="text-xs px-6 py-1 border-2 border-zinc-950 relative text-zinc-950 hover:text-white transition-all uppercase before:absolute before:inset-0 before:bg-zinc-950 before:origin-left before:scale-x-0 before:transition-transform before:duration-300 hover:before:scale-x-100"
            >
              <span className="relative z-10">Sign in</span>
            </button>
          )}
        </nav>

        {isMenuOpen && (
          <div className="fixed top-[60px] left-0 right-0 bg-white border-b border-zinc-950 md:hidden z-50 h-full flex flex-col justify-center">
            <nav className="flex flex-col items-center pb-32">
              {user && (
                <>
                  <button
                    onClick={handleYouTubeModeToggle}
                    className={`transition-colors w-full text-center py-2 ${
                      useYouTubeMode ? 'text-red-500' : 'text-zinc-950 hover:text-red-500'
                    }`}
                  >
                    Toggle YouTube Mode
                  </button>
                  <Link
                    href="/profile"
                    className="text-zinc-950 transition-colors w-full text-center py-2 hover:text-green-500"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="flex items-center justify-center gap-1">
                      <BsHeart /> FAVORITES
                    </span>
                  </Link>
                </>
              )}
              <Link
                href="/about"
                className="text-4xl text-zinc-950 transition-colors w-full text-center py-12 relative after:absolute after:bottom-0 after:left-0 after:right-0 after:mx-auto after:h-[1px] after:w-0 after:bg-zinc-950 after:transition-all hover:after:w-[200px]"
                onClick={() => setIsMenuOpen(false)}
              >
                ABOUT
              </Link>
              {!user && (
                <Link
                  href="/auth/signup"
                  className="text-4xl px-6 py-4 my-8 border-2 border-zinc-950 relative text-zinc-950 transition-colors duration-300 hover:text-white overflow-hidden uppercase"
                >
                  <span className="relative z-10">Sign Up</span>
                  <div className="absolute inset-0 bg-zinc-950 -z-[1] transform scale-x-0 transition-transform duration-300 origin-left hover:scale-x-100" />
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;
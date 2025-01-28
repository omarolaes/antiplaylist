'use client';

import React, { useState, useEffect } from 'react';
import Timeline from '@/components/Timeline';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  const [availableGenres, setAvailableGenres] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string>('');
  const router = useRouter();

  // Check if already authenticated
  useEffect(() => {
    const auth = localStorage.getItem('admin-auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch available genres
  useEffect(() => {
    if (isAuthenticated) {
      fetchAvailableGenres();
    }
  }, [isAuthenticated]);

  const fetchAvailableGenres = async () => {
    try {
      const response = await fetch('/api/available-genres');
      const data = await response.json();
      
      if (!response.ok) throw new Error('Failed to fetch genres');
      
      setAvailableGenres(new Set(data.genres));
    } catch (error) {
      console.error('Error fetching available genres:', error);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('admin-auth', 'true');
      setError('');
    } else {
      setError('Invalid password');
    }
  };

  const handleVideoSelect = (videoId: string, genreName: string) => {
    router.push(`/genre/${encodeURIComponent(genreName)}`);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <form 
          onSubmit={handleLogin}
          className="bg-zinc-800 p-8 rounded-lg shadow-lg max-w-md w-full mx-4"
        >
          <h1 className="text-2xl font-bold text-white mb-6">Admin Access</h1>
          <div className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-2 bg-zinc-700 rounded border border-zinc-600 text-white"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full bg-emerald-600 text-white py-2 rounded hover:bg-emerald-700 transition-colors"
            >
              Login
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900">
      <Timeline
        onVideoSelect={handleVideoSelect}
        availableGenres={availableGenres}
        isAdminView={true}
      />
    </div>
  );
}

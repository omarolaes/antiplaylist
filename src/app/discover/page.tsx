import React from "react";
import { Metadata } from 'next'
import Header from "@/components/home/Header";
import GenresMarquee from "@/components/home/GenresMarquee";
import Footer from "@/components/home/Footer";

export const metadata: Metadata = {
  title: 'Discover | AntiPlaylist',
  description: 'Explore and discover music genres randomly without algorithms',
}

export default function DiscoverPage() {
  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main className="max-w-[1800px] mx-auto px-4 md:px-8">
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-black" />
        {/* Hero Banner */}
        <div className="relative h-80">
          <div className="absolute inset-0 bg-[url('/images/discover-banner.jpg')] bg-cover bg-center opacity-30" />
          <div className="relative h-full flex flex-col justify-end p-8 md:p-12">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-4">
              Discover
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl">
              Explore random genres and find your next musical obsession
            </p>
          </div>
        </div>

        {/* Featured Sections */}
        <div className="space-y-16 mb-32">
          {/* Top Genres */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Featured Genres</h2>
              <a href="/genres" className="text-sm text-white/60 hover:text-white transition-colors">
                View All
              </a>
            </div>
            <GenresMarquee />
          </section>

        </div>
      </main>
      <Footer />
    </div>
  );
}

import React from "react";
import { Metadata } from 'next'
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";

export const metadata: Metadata = {
  title: 'About | mentiras',
  description: 'AI-powered journey through genres',
}

export default function AboutPage() {
  return (
    <div className="relative min-h-screen bg-black">
      <Header />
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-black" />
      <main className="relative container mx-auto px-4 py-16 md:py-24">
        {/* Hero Section */}
        <div className="text-center mb-20 animate-fade-in">
          <h1 className="text-6xl md:text-6xl font-bold text-white">
            AntiPlaylist
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
            An art project exploring music without algorithms. Pure random discovery.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24 max-w-4xl mx-auto">
          <FeatureCard
            title="No Algorithms"
            description="Pure random discovery. No taste prediction, no recommendations, just music."
          />
          <FeatureCard
            title="Made in México"
            description={
              <>
                Created with ♥️ by <a href="https://twitter.com/omarolaes" className="text-white hover:text-white/80 underline">@omarolaes</a>
              </>
            }
          />
        </div>

        {/* Collaboration Section */}
        <div className="text-center mb-32">
          <h2 className="text-2xl font-bold text-white mb-8">Want to Collaborate?</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="https://twitter.com/omarolaes"
              className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-full text-white transition-all"
            >
              DM on Twitter
            </a>
            <a
              href="mailto:antiplaylist@humanzzz.com"
              className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-full text-white transition-all"
            >
              Send Email
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

const FeatureCard = ({
  title,
  description,
}: {
  title: string;
  description: React.ReactNode;
}) => (
  <div className="p-8 rounded-2xl bg-zinc-800/80 transition-all">
    <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
    <p className="text-white/60 leading-relaxed">{description}</p>
  </div>
);

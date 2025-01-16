import React from "react";
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About | mentiras',
  description: 'AI-powered journey through genres',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-8 py-12 md:py-24" role="main">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-4xl md:text-4xl font-medium text-zinc-950">
            <span className="text-zinc-950">AntiPlaylist</span>
            <span className="font-extrabold text-6xl translate-y-4 inline-block">*</span>
          </h1>
          <p className="text-base text-zinc-950 max-w-md mx-auto pt-4 tracking-wide">
            AI-powered journey through genres.
          </p>
        </div>

        {/* Features Grid - Ensure full width and proper alignment */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16 w-full">
          <FeatureCard
            title="Free"
            description="Until the server runs out."
          />
          <FeatureCard
            title="Learn"
            description="Continue listening by learning."
          />
          <FeatureCard
            title="Curated"
            description="Discovery and refinement by AI."
          />
          <FeatureCard
            title="Favorites"
            description="Save tracks"
          />
          <FeatureCard
            title=".random()"
            description="No complex algorithms."
          />
          <FeatureCard
            title="Mexico"
            description={
              <>
                Created by <a href="https://twitter.com/omarolaes" className="underline hover:text-zinc-600">@omarolaes</a>
              </>
            }
          />
        </div>

        {/* Contact Section - Updated button styling with animation */}
        <div className="mt-32 mb-64 mx-auto text-center animate-fade-in">
          <a
            href="mailto:antiplaylist@humanzzz.com"
            aria-label="Contact Us via Email"
            className="inline-block px-24 py-2 bg-white border-x border-zinc-950 hover:border-zinc-950 hover:scale-95 hover:border-x-4 text-zinc-950 text-xl font-medium transition-all"
          >
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
}

{
  /* FeatureCard Component - Updated styling */
}
const FeatureCard = ({
  title,
  description,
}: {
  title: string;
  description: React.ReactNode;
}) => (
  <div className="relative p-6 even:border-y odd:border-x border-zinc-950 text-right">
    <div className="flex items-center justify-end gap-3 mb-4">
      <h3 className="text-6xl text-zinc-950">{title}</h3>
    </div>
    <p className="text-zinc-950 text-xl">{description}</p>
  </div>
);

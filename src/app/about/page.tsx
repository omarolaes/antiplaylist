import React from "react";
import { Metadata } from 'next'
import Header from "@/components/home/Header";

export const metadata: Metadata = {
  title: 'About | mentiras',
  description: 'AI-powered journey through genres',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black">
      <Header />
      <div className="container mx-auto px-4 py-16 md:py-24" role="main">
        {/* Hero Section */}
        <div className="text-center mb-20 animate-fade-in">
          <h1 className="text-6xl md:text-7xl font-bold text-rose-100">
            AntiPlaylist
            <span className="font-black text-rose-200 text-7xl translate-y-4 inline-block ml-2">*</span>
          </h1>
          <p className="text-lg text-rose-200/80 max-w-xl mx-auto mt-6 leading-relaxed">
            An art project exploring music without algorithms. Pure random discovery.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-24 max-w-4xl mx-auto">
          <FeatureCard
            title="No Algorithms"
            description="Pure random discovery. No taste prediction, no recommendations, just music."
          />
          <FeatureCard
            title="Learn & Explore"
            description="Each skip teaches you something new about music genres and artists."
          />
          <FeatureCard
            title="Free Access"
            description="We'll try to keep it free as long as possible. Art should be accessible."
          />
          <FeatureCard
            title="Made in México"
            description={
              <>
                Created with ♥️ by <a href="https://twitter.com/omarolaes" className="text-rose-200 hover:text-rose-100 underline">@omarolaes</a>
              </>
            }
          />
        </div>

        {/* Collaboration Section */}
        <div className="text-center mb-32">
          <h2 className="text-2xl font-bold text-rose-100 mb-6">Want to Collaborate?</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="https://twitter.com/omarolaes"
              className="px-8 py-3 bg-rose-100/10 hover:bg-rose-100/20 border border-rose-200/20 rounded-full text-rose-100 transition-all"
            >
              DM on Twitter
            </a>
            <a
              href="mailto:antiplaylist@humanzzz.com"
              className="px-8 py-3 bg-rose-100/10 hover:bg-rose-100/20 border border-rose-200/20 rounded-full text-rose-100 transition-all"
            >
              Send Email
            </a>
          </div>
        </div>
      </div>
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
  <div className="p-6 rounded-xl bg-rose-100/5 hover:bg-rose-100/10 transition-all border border-rose-200/10 hover:border-rose-200/20">
    <h3 className="text-2xl font-bold text-rose-100 mb-3">{title}</h3>
    <p className="text-rose-200/80 leading-relaxed">{description}</p>
  </div>
);

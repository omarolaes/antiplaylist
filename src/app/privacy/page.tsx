import React from "react";
import { Metadata } from 'next'
import Header from "@/components/home/Header";

export const metadata: Metadata = {
  title: 'Privacy Policy | AntiPlaylist',
  description: 'Privacy Policy and Terms of Use for AntiPlaylist',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-900">
      <Header />
      <div className="container mx-auto px-8 py-12 md:py-24" role="main">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">
            Privacy Policy & Terms
          </h1>

          <div className="space-y-8 text-zinc-300">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-white">Art Project Declaration</h2>
              <p>
                AntiPlaylist is an artistic exploration of music discovery and AI interaction. This project is created for educational and artistic purposes, serving as an experimental platform for exploring the intersection of artificial intelligence and music curation.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-white">Data Collection & Usage</h2>
              <p>
                We utilize third-party services including YouTube and Perplexity AI to enhance your experience. We do not store or process any personal data beyond what is strictly necessary for the functionality of the application.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>We do not sell or share your data with third parties</li>
                <li>Any stored preferences are kept locally on your device</li>
                <li>We do not track individual user behavior or create user profiles</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-white">Third-Party Services</h2>
              <p>
                This project interfaces with YouTube and Perplexity AI services. Your use of these services through our platform is subject to their respective terms of service and privacy policies:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>YouTube&apos;s Terms of Service and Privacy Policy</li>
                <li>Perplexity AI&apos;s Terms of Service and Privacy Policy</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-white">Disclaimer</h2>
              <p>
                This is an experimental art project and is provided &quot;as is&quot; without any warranties. We are not responsible for any content retrieved from third-party services. All content rights belong to their respective owners.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-white">Changes to Policy</h2>
              <p>
                We reserve the right to modify this privacy policy at any time. Changes will be effective immediately upon posting to this page.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-white">Contact</h2>
              <p>
                For any questions regarding this privacy policy or the project in general, please contact us at:{' '}
                <a href="mailto:antiplaylist@humanzzz.com" className="text-white underline hover:text-zinc-400">
                  antiplaylist@humanzzz.com
                </a>
              </p>
            </section>

            <section className="pt-8 text-sm text-zinc-400">
              <p>Last updated: {new Date().toLocaleDateString()}</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

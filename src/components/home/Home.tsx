"use client";

import { useRouter } from "next/navigation";
import Header from "./Header";
import Hero from "./Hero";
import Footer from "./Footer";

const HomePage: React.FC = () => {
  const router = useRouter();

  const handleStartClick = async () => {
    try {
      const response = await fetch('/api/random-genre');
      const data = await response.json();
      
      if (data.genre?.slug) {
        router.push(`/genre/${data.genre.slug}`);
      }
    } catch (error) {
      console.error('Failed to fetch random genre:', error);
    }
  };

  return (
    <div className="min-h-screen relative">
      <Header />
      <Hero handleStartClick={handleStartClick} />
      <Footer />
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-black z-0" />
    </div>
  );
};

export default HomePage;

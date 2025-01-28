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
    <>
      <Header />
      <Hero handleStartClick={handleStartClick} />
      <Footer />
    </>
  );
};

export default HomePage;

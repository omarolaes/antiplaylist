"use client";

import { useState, useEffect } from "react";
import { MdDelete, MdRefresh } from "react-icons/md";
import { IoMdAdd } from "react-icons/io";

interface Genre {
  id: string;
  name: string;
  slug: string;
  description: string;
  genre_songs: {
    id: string;
    artist: string;
    song: string;
    video_id: string;
  }[];
}

interface ProcessingState {
  id: string | null;
  message: string;
}

export default function GenreCleaner() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processing, setProcessing] = useState<ProcessingState>({ id: null, message: '' });

  useEffect(() => {
    fetchGenres();
  }, []);

  const fetchGenres = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/genres");
      if (!response.ok) throw new Error("Failed to fetch genres");
      const data = await response.json();
      
      // Sort genres by number of songs (ascending)
      const sortedGenres = data.genres.sort((a: Genre, b: Genre) => 
        (a.genre_songs?.length || 0) - (b.genre_songs?.length || 0)
      );
      
      setGenres(sortedGenres);
    } catch (error) {
      console.error("Error fetching genres:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGenre = async (genreId: string) => {
    if (!confirm("Are you sure you want to delete this genre and all its songs?")) return;
    
    setProcessing({ id: genreId, message: 'Deleting genre...' });
    try {
      const response = await fetch("/api/admin/delete-genre", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ genreId }),
      });

      if (!response.ok) throw new Error("Failed to delete genre");
      
      // Remove genre from state
      setGenres(prev => prev.filter(g => g.id !== genreId));
    } catch (error) {
      console.error("Error deleting genre:", error);
      alert("Failed to delete genre");
    } finally {
      setProcessing({ id: null, message: '' });
    }
  };

  const handleAddSongs = async (genre: Genre) => {
    setProcessing({ id: genre.id, message: 'Generating new songs...' });
    try {
      const response = await fetch("/api/admin/add-songs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          genreId: genre.id,
          genreName: genre.name,
          existingSongs: genre.genre_songs
        }),
      });

      if (!response.ok) throw new Error("Failed to add songs");
      
      const data = await response.json();
      
      if (data.addedSongs?.length === 0) {
        alert("No new unique songs were found to add.");
      } else {
        alert(`Successfully added ${data.addedSongs.length} new songs!`);
      }
      
      // Refresh genres list
      await fetchGenres();
    } catch (error) {
      console.error("Error adding songs:", error);
      alert("Failed to add songs");
    } finally {
      setProcessing({ id: null, message: '' });
    }
  };

  const handleRegenerateSongs = async (genre: Genre) => {
    if (!confirm("This will delete all existing songs and generate new ones. Are you sure?")) return;
    
    setProcessing({ id: genre.id, message: 'Regenerating songs...' });
    try {
      // First delete existing songs
      const deleteResponse = await fetch("/api/admin/delete-genre", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ genreId: genre.id }),
      });

      if (!deleteResponse.ok) throw new Error("Failed to delete existing songs");

      // Then generate new songs
      const generateResponse = await fetch("/api/generate-songs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ genre: genre.name }),
      });

      if (!generateResponse.ok) throw new Error("Failed to generate new songs");
      
      // Refresh genres list
      await fetchGenres();
      alert("Successfully regenerated songs!");
    } catch (error) {
      console.error("Error regenerating songs:", error);
      alert("Failed to regenerate songs");
    } finally {
      setProcessing({ id: null, message: '' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">Genre Manager</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your genres and their songs. Genres with fewer songs appear first.
          </p>
        </div>
        
        <div className="divide-y divide-gray-200">
          {genres.map((genre) => (
            <div 
              key={genre.id}
              className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-medium text-gray-900 truncate">
                  {genre.name}
                </h2>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500">
                    {genre.genre_songs?.length || 0} songs
                  </p>
                  {processing.id === genre.id && (
                    <span className="text-xs text-blue-500 animate-pulse">
                      {processing.message}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => handleAddSongs(genre)}
                  disabled={processing.id === genre.id}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md
                    ${processing.id === genre.id
                      ? 'bg-green-100 text-green-400 cursor-not-allowed'
                      : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                >
                  <IoMdAdd className={`${processing.id === genre.id ? 'animate-spin' : ''}`} />
                  Add Songs
                </button>

                <button
                  onClick={() => handleRegenerateSongs(genre)}
                  disabled={processing.id === genre.id}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md
                    ${processing.id === genre.id
                      ? 'bg-blue-100 text-blue-400 cursor-not-allowed'
                      : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                    }`}
                >
                  <MdRefresh className={`${processing.id === genre.id ? 'animate-spin' : ''}`} />
                  Regenerate
                </button>
                
                <button
                  onClick={() => handleDeleteGenre(genre.id)}
                  disabled={processing.id === genre.id}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md
                    ${processing.id === genre.id
                      ? 'bg-red-100 text-red-400 cursor-not-allowed'
                      : 'bg-red-50 text-red-600 hover:bg-red-100'
                    }`}
                >
                  <MdDelete />
                  Delete
                </button>
              </div>
            </div>
          ))}
          
          {genres.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-500">
              No genres found
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
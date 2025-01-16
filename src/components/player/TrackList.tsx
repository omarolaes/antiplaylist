import React from 'react';
import { BsChevronRight } from 'react-icons/bs';
import { TiHeartFullOutline } from "react-icons/ti";
import { TbMusicPlus } from "react-icons/tb";
import { useEffect, useState } from 'react';
import { IoTrashSharp } from 'react-icons/io5';

interface ArtistSong {
  artist: string;
  song: string;
  videoId: string;
}

interface TrackListProps {
  songs: ArtistSong[];
  onTrackSelect: (videoId: string, index: number) => void;
  currentIndex?: number;
  isLiked?: boolean;
  onLike?: (videoId: string) => void;
  onDelete?: (videoId: string) => void;
  onAddSongs?: () => void;
  isLoading?: boolean;
}

const TrackList: React.FC<TrackListProps> = ({ 
  songs, 
  onTrackSelect, 
  currentIndex = 0,
  isLiked = false,
  onLike,
  onDelete,
  onAddSongs,
  isLoading = false
}) => {
  const [isLocalhost, setIsLocalhost] = useState(false);

  useEffect(() => {
    setIsLocalhost(window.location.hostname === 'localhost');
  }, []);

  if (isLoading) {
    return (
      <div className="border-2 border-zinc-950 max-h-64 p-4 flex justify-center items-center">
        <p>Loading tracks...</p>
      </div>
    );
  }

  if (songs.length === 0) return null;

  return (
    <div className="bg-zinc-950 min-h-full overflow-auto">
      {songs.map((item, index) => (
        <div key={index} className="flex items-center gap-2 border-b border-zinc-800">
          <button
            onClick={() => item.videoId ? onTrackSelect(item.videoId, index) : null}
            disabled={!item.videoId}
            className={`
              group flex-1 py-1 md:py-4 pt-8 text-sm md:text-xl
              transition-all px-4 truncate max-w-full ${index === currentIndex ? 'text-white' : 'text-white/50 hover:text-white/75'}`}
          >
            <div className="flex items-center">
                <div className={`
                  overflow-hidden transition-all duration-300 ease-in-out
                  ${index === currentIndex 
                    ? 'w-5 text-white' 
                    : 'w-0 text-transparent group-hover:w-5 group-hover:text-white'
                  }`}
                >
                  <BsChevronRight size={12} />
                </div>
              <div className="font-medium truncate">{item.artist}</div>
              <div className="">—</div>
              <div className="truncate">{item.song}</div>
            </div>
          </button>
          
            <div className="flex">
              {isLocalhost && onDelete && (
                <button
                  onClick={() => onDelete(item.videoId)}
                  className="p-2 text-white/25 hover:text-white border-x border-zinc-950"
                >
                  <IoTrashSharp size={12} />
                </button>
              )}
              {onLike && index === currentIndex && (
                <button
                  onClick={() => onLike(item.videoId)}
                  className={`p-2 mr-2 ${
                    isLiked 
                      ? 'text-red-500' 
                      : 'text-white/25 hover:text-red-500 bg-zinc-950'
                  }`}
                >
                  <TiHeartFullOutline size={24} />
                </button>
              )}
            </div>
        </div>
      ))}
      
      {/* Add Songs Button (localhost only) */}
      {isLocalhost && onAddSongs && (
        <button
          onClick={onAddSongs}
          className="w-full py-2 px-4 flex items-center justify-center gap-2 text-sm text-zinc-200 border-t border-zinc-800 hover:text-zinc-100 transition-all"
        >
          <TbMusicPlus size={20} />
          Add More Songs
        </button>
      )}
    </div>
  );
};

export default TrackList;

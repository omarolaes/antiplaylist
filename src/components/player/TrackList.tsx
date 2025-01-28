import React from 'react';

interface TrackListProps {
  songs: Array<{
    artist: string;
    song: string;
    videoId: string;
  }>;
  currentIndex: number;
  onTrackSelect: (videoId: string, index?: number) => void;
  isLiked?: boolean;
  onLike?: () => void;
  onDelete?: (videoId: string) => void;
  onAddSongs?: () => void;
}

const TrackList: React.FC<TrackListProps> = ({ songs, currentIndex, onTrackSelect }) => {

  if (songs.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white mb-4">Tracks</h2>
      <div className="space-y-2">
        {songs.map((song, index) => (
          <button
            key={song.videoId}
            onClick={() => onTrackSelect(song.videoId, index)}
            className={`w-full text-left p-4 rounded-lg transition-all ${
              currentIndex === index
                ? "bg-zinc-700 text-white"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
            }`}
          >
            <div className="flex flex-col">
              <span className="font-medium">{song.song}</span>
              <span className="text-sm text-zinc-400">{song.artist}</span>

            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TrackList;

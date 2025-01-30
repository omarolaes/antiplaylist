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
}

const TrackList: React.FC<TrackListProps> = ({ 
  songs, 
  currentIndex, 
  onTrackSelect,
  onDelete,
  onLike,
  isLiked,
}) => {
  if (songs.length === 0) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {songs.map((song, index) => (
          <div
            key={`${song.videoId}-${index}`}
            className={`flex rounded-xl items-center gap-3 px-4 py-2.5 ${
              currentIndex === index
                ? "bg-white/10"
                : "hover:bg-white/5"
            }`}
          >
            {/* Track Number/Playing Indicator */}
            <div className="w-6 text-center text-sm font-medium text-white/40">
              {currentIndex === index ? (
                <div className="w-2 h-2 mx-auto bg-emerald-500 rounded-full animate-pulse" />
              ) : (
                index + 1
              )}
            </div>

            {/* Track Info */}
            <button
              onClick={() => onTrackSelect(song.videoId, index)}
              className="flex-1 flex items-center text-left"
            >
              <div className="flex flex-col min-w-0">
                <span className={`text-sm font-medium truncate ${
                  currentIndex === index ? "text-emerald-500" : "text-white/90"
                }`}>
                  {song.song}
                </span>
                <span className="text-xs text-white/50 truncate">
                  {song.artist}
                </span>
              </div>
            </button>

            {/* Action Buttons */}
            <div className={`flex items-center gap-1 ${
              currentIndex === index ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            } transition-opacity`}>
              {onLike && (
                <button
                  onClick={onLike}
                  className={`p-1.5 rounded-full ${
                    isLiked ? "text-rose-500" : "text-white/60 hover:text-white"
                  }`}
                >
                  {isLiked ? "♥" : "♡"}
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(song.videoId)}
                  className="p-1.5 text-white/60 hover:text-white rounded-full"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrackList;

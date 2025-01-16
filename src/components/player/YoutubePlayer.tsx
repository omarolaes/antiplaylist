import React, { useCallback, useEffect, useRef, useState } from 'react';

interface YouTubePlayer {
  destroy: () => void;
  loadVideoById: (videoId: string) => void;
  getVideoData: () => { video_id?: string };
  playVideo: () => void;
  unMute: () => void;
}

interface YouTubeEvent {
  data: number;
}

interface YouTubeWindow extends Window {
  YT: {
    Player: new (elementId: string, config: YouTubePlayerConfig) => YouTubePlayer;
    PlayerState: {
      PLAYING: number;
      ENDED: number;
    };
  };
  onYouTubeIframeAPIReady: () => void;
}

interface YouTubePlayerConfig {
  height: string;
  width: string;
  videoId: string;
  playerVars: {
    autoplay: number;
    controls: number;
    playsinline: number;
    rel: number;
    showinfo: number;
    iv_load_policy: number;
    modestbranding: number;
  };
  events: {
    onReady: (event: { target: YouTubePlayer }) => void;
    onStateChange: (event: YouTubeEvent) => void;
    onError: (event: YouTubeEvent) => void;
  };
}

interface YoutubePlayerProps {
  videoId: string;
  onVideoEnd?: () => void;
  onLikeChange?: () => void;
}

const YoutubePlayer: React.FC<YoutubePlayerProps> = ({ videoId, onVideoEnd }) => {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [hasError, setHasError] = useState(false);

  const destroyPlayer = useCallback(() => {
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
        playerRef.current = null;
      } catch (e) {
        console.warn("Error cleaning up player:", e);
      }
    }
  }, []);

  const createPlayer = useCallback(() => {
    if (!videoId) return;
    setHasError(false);

    const container = document.getElementById("youtube-player");
    if (!container) {
      setHasError(true);
      return;
    }

    try {
      playerRef.current = new ((window as unknown) as YouTubeWindow).YT.Player(
        "youtube-player",
        {
          height: "100%",
          width: "100%",
          videoId: videoId,
          playerVars: {
            autoplay: 1,
            controls: 1,
            playsinline: 1,
            rel: 0,
            showinfo: 0,
            iv_load_policy: 3,
            modestbranding: 1,
          },
          events: {
            onReady: (event: { target: YouTubePlayer }) => {
              console.log("Player ready");
              try {
                event.target.unMute();
                event.target.playVideo();
              } catch (e) {
                console.warn("Error unmuting player:", e);
              }
            },
            onStateChange: (event: YouTubeEvent) => {
              if (event.data === ((window as unknown) as YouTubeWindow).YT.PlayerState.ENDED) {
                onVideoEnd?.();
              }
            },
            onError: (event: YouTubeEvent) => {
              console.warn("YouTube player error:", event);
            },
          },
        }
      );
    } catch (error) {
      console.error("Error creating YouTube player:", error);
    }
  }, [videoId, onVideoEnd]);

  useEffect(() => {
    destroyPlayer();
    createPlayer();
    
    return () => destroyPlayer();
  }, [videoId, createPlayer, destroyPlayer]);

  useEffect(() => {
    if (document.getElementById("youtube-iframe-api")) {
      return;
    }

    const tag = document.createElement("script");
    tag.id = "youtube-iframe-api";
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);

    (window as unknown as YouTubeWindow).onYouTubeIframeAPIReady = createPlayer;

    return () => destroyPlayer();
  }, [createPlayer, destroyPlayer]);

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('YouTube Player Error:', error);
      // Attempt recovery
      destroyPlayer();
      createPlayer();
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [destroyPlayer, createPlayer]);

  if (hasError) {
    return (
      <div className="aspect-video bg-zinc-950 border-2 border-zinc-950 flex items-center justify-center text-white">
        <p>Failed to load video. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="aspect-video overflow-hidden bg-zinc-950 border-2 border-zinc-950">
        <div id="youtube-player" className="w-full h-full" />
      </div>
    </div>
  );
};

export default YoutubePlayer;

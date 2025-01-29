"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';

interface YouTubePlayer {
  destroy: () => void;
  loadVideoById: (videoId: string) => void;
  getVideoData: () => { video_id?: string };
  playVideo: () => void;
  unMute: () => void;
  mute: () => void;
  getPlayerState: () => number;
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
      PAUSED: number;
      BUFFERING: number;
      CUED: number;
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
  const [isAPIReady, setIsAPIReady] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const playerId = useRef(`youtube-player-${videoId}`);

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

  const attemptAutoplay = useCallback(async (player: YouTubePlayer) => {
    try {
      // Start muted first (more likely to be allowed by browser)
      player.mute();
      await player.playVideo();
      
      // Check if video actually started playing
      const checkPlayingInterval = setInterval(() => {
        if (!player) {
          clearInterval(checkPlayingInterval);
          return;
        }

        try {
          const state = player.getPlayerState();
          const YT = (window as unknown as YouTubeWindow).YT;
          
          if (state === YT.PlayerState.PLAYING) {
            // If we got here, autoplay worked - now try unmuting
            player.unMute();
            clearInterval(checkPlayingInterval);
          } else if (state === YT.PlayerState.PAUSED || state === YT.PlayerState.CUED) {
            // Video is paused or cued but not playing - likely blocked by autoplay policy
            clearInterval(checkPlayingInterval);
          }
        } catch (e) {
          clearInterval(checkPlayingInterval);
        }
      }, 250);

      // Clear interval after 5 seconds to prevent memory leaks
      setTimeout(() => clearInterval(checkPlayingInterval), 5000);
    } catch (e) {
      console.warn("Autoplay failed:", e);
    }
  }, []);

  const createPlayer = useCallback(() => {
    if (!videoId || !isAPIReady) return;
    setHasError(false);

    const container = document.getElementById(playerId.current);
    if (!container) {
      setHasError(true);
      return;
    }

    try {
      const YT = (window as unknown as YouTubeWindow).YT;
      if (!YT || !YT.Player) {
        console.warn("YouTube API not ready yet");
        return;
      }

      playerRef.current = new YT.Player(playerId.current, {
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
            attemptAutoplay(event.target);
          },
          onStateChange: (event: YouTubeEvent) => {
            const YT = (window as unknown as YouTubeWindow).YT;
            if (event.data === YT.PlayerState.ENDED) {
              onVideoEnd?.();
            }
          },
          onError: (event: YouTubeEvent) => {
            console.warn("YouTube player error:", event);
            setHasError(true);
          },
        },
      });
    } catch (error) {
      console.error("Error creating YouTube player:", error);
      setHasError(true);
    }
  }, [videoId, onVideoEnd, isAPIReady, attemptAutoplay]);

  useEffect(() => {
    if (!isAPIReady) return;
    destroyPlayer();
    createPlayer();
    
    return () => destroyPlayer();
  }, [videoId, createPlayer, destroyPlayer, isAPIReady]);

  useEffect(() => {
    if (document.getElementById("youtube-iframe-api")) {
      if ((window as unknown as YouTubeWindow).YT) {
        setIsAPIReady(true);
      }
      return;
    }

    const tag = document.createElement("script");
    tag.id = "youtube-iframe-api";
    tag.src = "https://www.youtube.com/iframe_api";
    
    tag.onload = () => {
      (window as unknown as YouTubeWindow).onYouTubeIframeAPIReady = () => {
        setIsAPIReady(true);
      };
    };

    document.head.appendChild(tag);

    return () => {
      destroyPlayer();
      const scriptTag = document.getElementById("youtube-iframe-api");
      if (scriptTag) {
        scriptTag.remove();
      }
    };
  }, [destroyPlayer]);

  if (hasError) {
    return (
      <div className="aspect-video bg-zinc-950/95 rounded-lg backdrop-blur-sm flex items-center justify-center text-white/75">
        <p className="text-sm">Failed to load video. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="relative mb-2">
      <div 
        className="aspect-video overflow-hidden bg-zinc-950/95 rounded-lg backdrop-blur-sm"
        onClick={() => setHasUserInteracted(true)}
      >
        <div id={playerId.current} className="w-full h-full" />
      </div>
    </div>
  );
};

export default YoutubePlayer;

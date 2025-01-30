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

// Keep the global API loaded flag
let isYouTubeAPILoaded = false;

const YoutubePlayer: React.FC<YoutubePlayerProps> = ({ videoId, onVideoEnd }) => {
  console.log('YoutubePlayer rendered with videoId:', videoId);
  
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [hasError, setHasError] = useState(false);
  const [isAPIReady, setIsAPIReady] = useState(isYouTubeAPILoaded);
  // Use a stable ID that won't change during hydration
  const playerId = useRef(`youtube-player-${videoId}`);
  const containerRef = useRef<HTMLDivElement>(null);

  const destroyPlayer = useCallback(() => {
    console.log('Destroying player instance');
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
        playerRef.current = null;
        console.log('Player destroyed successfully');
      } catch (error) {
        console.error("Error destroying player:", error);
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
        } catch {
          clearInterval(checkPlayingInterval);
        }
      }, 250);

      // Clear interval after 5 seconds to prevent memory leaks
      setTimeout(() => clearInterval(checkPlayingInterval), 5000);
    } catch {
      console.warn("Autoplay failed");
    }
  }, []);

  const createPlayer = useCallback(() => {
    console.log('Attempting to create player:', {
      videoId,
      isAPIReady,
      containerId: playerId.current
    });

    if (!videoId || !isAPIReady) {
      console.log('Cannot create player - missing requirements:', {
        hasVideoId: !!videoId,
        isAPIReady
      });
      return;
    }

    destroyPlayer();

    // Use containerRef instead of getElementById
    if (!containerRef.current) {
      console.error('Player container not found');
      setHasError(true);
      return;
    }

    try {
      const YT = (window as unknown as YouTubeWindow).YT;
      if (!YT || !YT.Player) {
        console.error("YouTube API not available");
        return;
      }

      console.log('Creating new YT.Player instance');
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
            console.log("Player ready event fired");
            attemptAutoplay(event.target);
          },
          onStateChange: (event: YouTubeEvent) => {
            console.log('Player state changed:', event.data);
            const YT = (window as unknown as YouTubeWindow).YT;
            if (event.data === YT.PlayerState.ENDED) {
              console.log('Video ended, calling onVideoEnd');
              onVideoEnd?.();
            }
          },
          onError: (event: YouTubeEvent) => {
            console.error("YouTube player error:", event);
            setHasError(true);
          },
        },
      });
    } catch (error) {
      console.error("Error creating YouTube player:", error);
      setHasError(true);
    }
  }, [videoId, isAPIReady, destroyPlayer, attemptAutoplay, onVideoEnd]);

  // Initialize YouTube API
  useEffect(() => {
    if (isYouTubeAPILoaded) {
      console.log('YouTube API already loaded, setting ready state');
      setIsAPIReady(true);
      return;
    }

    const loadYouTubeAPI = () => {
      if (document.getElementById("youtube-iframe-api")) return;

      console.log('Injecting YouTube API script');
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      
      tag.onload = () => {
        console.log('YouTube API script loaded');
        (window as unknown as YouTubeWindow).onYouTubeIframeAPIReady = () => {
          console.log('YouTube API ready');
          isYouTubeAPILoaded = true;
          setIsAPIReady(true);
        };
      };

      document.head.appendChild(tag);
    };

    // Delay the API loading slightly to ensure hydration is complete
    const timeoutId = setTimeout(loadYouTubeAPI, 0);
    return () => {
      clearTimeout(timeoutId);
      destroyPlayer();
    };
  }, [destroyPlayer]);

  // Create/update player when videoId changes
  useEffect(() => {
    console.log('videoId changed effect triggered:', videoId);
    if (isAPIReady && containerRef.current) {
      // Small delay to ensure DOM is ready
      const timeoutId = setTimeout(createPlayer, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [videoId, createPlayer, isAPIReady]);

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
        className="aspect-video overflow-hidden bg-zinc-950/95 rounded-xl backdrop-blur-sm border border-white/15 ring-1 ring-white/10"
      >
        <div 
          ref={containerRef}
          id={playerId.current} 
          className="w-full h-full rounded-xl overflow-hidden" 
        />
      </div>
    </div>
  );
};

export default YoutubePlayer;

// src/context/MusicContext.tsx

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Track, ApiService } from '../services/ApiService';
import { StorageService, Playlist } from '../services/StorageService';
import { DownloadManager } from '../services/DownloadManager';

interface MusicContextType {
  // Player State
  currentTrack: Track | null;
  isPlaying: boolean;
  position: number;       // Current progress in ms
  duration: number;       // Total length in ms
  queue: Track[];
  currentIndex: number;
  shuffleMode: boolean;
  repeatMode: 'none' | 'one' | 'all';
  offlineMode: boolean;
  
  // Library State
  playlists: Playlist[];
  downloadedTracks: Track[];
  recentlyPlayed: Track[];
  favorites: Track[];
  
  // Operations
  playTrack: (track: Track, tracksQueue?: Track[]) => Promise<void>;
  togglePlay: () => Promise<void>;
  nextTrack: () => Promise<void>;
  prevTrack: () => Promise<void>;
  seekTo: (positionMs: number) => Promise<void>;
  addToQueue: (track: Track) => void;
  removeFromQueue: (trackId: string) => void;
  clearQueue: () => void;
  
  // Storage operations
  toggleFavorite: (track: Track) => Promise<void>;
  createPlaylist: (name: string) => Promise<void>;
  deletePlaylist: (playlistId: string) => Promise<void>;
  addTrackToPlaylist: (playlistId: string, track: Track) => Promise<void>;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  
  // Download operations
  downloadTrack: (track: Track) => Promise<void>;
  deleteDownload: (trackId: string) => Promise<void>;
  setOfflineMode: (enabled: boolean) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [position, setPosition] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [shuffleMode, setShuffleMode] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none');
  const [offlineMode, setOfflineMode] = useState<boolean>(false);

  // Library States
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [downloadedTracks, setDownloadedTracks] = useState<Track[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>([]);
  const [favorites, setFavorites] = useState<Track[]>([]);

  // Sound playback reference
  const soundRef = useRef<Audio.Sound | null>(null);
  
  // Track state ref to avoid stale closures in audio listener
  const stateRef = useRef({ queue, currentIndex, shuffleMode, repeatMode, currentTrack });
  
  useEffect(() => {
    stateRef.current = { queue, currentIndex, shuffleMode, repeatMode, currentTrack };
  }, [queue, currentIndex, shuffleMode, repeatMode, currentTrack]);

  // Configure Audio settings for background play
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (error) {
        console.error('Error setting up audio mode:', error);
      }
    };
    setupAudio();
    loadLibraryData();

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // Load playlists, downloads, history, favorites on mount
  const loadLibraryData = async () => {
    try {
      const pl = await StorageService.getPlaylists();
      const dl = await StorageService.getDownloadedTracks();
      const rec = await StorageService.getRecentlyPlayed();
      const fav = await StorageService.getFavorites();
      
      setPlaylists(pl);
      setDownloadedTracks(dl);
      setRecentlyPlayed(rec);
      setFavorites(fav);
    } catch (e) {
      console.error('Error loading initial library data:', e);
    }
  };

  // Playback Status Update Listener
  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        console.error(`Playback Error: ${status.error}`);
      }
      return;
    }

    setIsPlaying(status.isPlaying);
    setPosition(status.positionMillis);
    setDuration(status.durationMillis || 0);

    // Track finished playing
    if (status.didJustFinish && !status.isLooping) {
      handleTrackFinish();
    }
  };

  const handleTrackFinish = () => {
    const { queue: currentQueue, currentIndex: index, repeatMode: repMode } = stateRef.current;
    
    if (repMode === 'one') {
      // Replay current song
      if (soundRef.current) {
        soundRef.current.replayAsync();
      }
    } else {
      // Go to next song
      triggerNextTrack();
    }
  };

  // Internal function to play a track by index
  const playTrackAtIndex = async (index: number, targetQueue: Track[]) => {
    if (index < 0 || index >= targetQueue.length) {
      setIsPlaying(false);
      return;
    }

    const track = targetQueue[index];
    setCurrentIndex(index);
    setCurrentTrack(track);

    try {
      // 1. Unload any existing sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // 2. Determine URI: use local file if available/downloaded, otherwise stream url
      let audioUri = track.audioUrl;
      const isDownloaded = await DownloadManager.isTrackDownloaded(track.id);
      
      if (isDownloaded) {
        audioUri = DownloadManager.getLocalSongUri(track.id);
        console.log(`Playing downloaded local file: ${audioUri}`);
      } else if (offlineMode) {
        console.warn('Offline mode is active but song is not downloaded. Skipping.');
        triggerNextTrack();
        return;
      } else {
        console.log(`Streaming online URL: ${audioUri}`);
      }

      // 3. Load and play sound
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );
      
      soundRef.current = sound;
      
      // Update history
      const updatedRecents = await StorageService.saveRecentlyPlayed(track);
      setRecentlyPlayed(updatedRecents);
    } catch (error) {
      console.error('Error loading audio track:', error);
      // Auto skip to next on load failure
      triggerNextTrack();
    }
  };

  // Play a track and optionally update the play queue
  const playTrack = async (track: Track, tracksQueue?: Track[]) => {
    let newQueue = queue;
    let newIndex = currentIndex;

    if (tracksQueue) {
      newQueue = tracksQueue;
      newIndex = tracksQueue.findIndex(t => t.id === track.id);
    } else {
      // Check if track is already in current queue
      const idx = queue.findIndex(t => t.id === track.id);
      if (idx !== -1) {
        newIndex = idx;
      } else {
        // Add to queue and play
        newQueue = [...queue, track];
        newIndex = newQueue.length - 1;
      }
    }

    setQueue(newQueue);
    await playTrackAtIndex(newIndex, newQueue);
  };

  // Toggle play / pause
  const togglePlay = async () => {
    if (!soundRef.current) {
      if (queue.length > 0) {
        await playTrackAtIndex(0, queue);
      }
      return;
    }

    try {
      if (isPlaying) {
        await soundRef.current.pauseAsync();
      } else {
        await soundRef.current.playAsync();
      }
    } catch (e) {
      console.error('Error toggling play/pause:', e);
    }
  };

  const triggerNextTrack = async () => {
    const { queue: q, currentIndex: idx, shuffleMode: isShuffled, repeatMode: repMode } = stateRef.current;
    if (q.length === 0) return;

    let nextIndex = idx + 1;

    if (isShuffled) {
      // Select random track in queue
      nextIndex = Math.floor(Math.random() * q.length);
    } else if (nextIndex >= q.length) {
      if (repMode === 'all') {
        nextIndex = 0; // Wrap around to beginning
      } else {
        setIsPlaying(false);
        return; // End of queue, stop playback
      }
    }

    await playTrackAtIndex(nextIndex, q);
  };

  const nextTrack = async () => {
    await triggerNextTrack();
  };

  const prevTrack = async () => {
    const { queue: q, currentIndex: idx } = stateRef.current;
    if (q.length === 0) return;

    let prevIndex = idx - 1;
    if (prevIndex < 0) {
      prevIndex = q.length - 1; // Wrap to end
    }

    await playTrackAtIndex(prevIndex, q);
  };

  const seekTo = async (positionMs: number) => {
    if (!soundRef.current) return;
    try {
      await soundRef.current.setPositionAsync(positionMs);
      setPosition(positionMs);
    } catch (e) {
      console.error('Error seeking track:', e);
    }
  };

  // Queue Operations
  const addToQueue = (track: Track) => {
    if (queue.some(t => t.id === track.id)) return; // Already in queue
    setQueue([...queue, track]);
  };

  const removeFromQueue = (trackId: string) => {
    const updated = queue.filter(t => t.id !== trackId);
    setQueue(updated);
    
    // Adjust currentIndex if necessary
    const { currentIndex: idx, currentTrack: curr } = stateRef.current;
    if (curr && curr.id === trackId) {
      nextTrack();
    } else {
      const newIdx = updated.findIndex(t => t.id === curr?.id);
      setCurrentIndex(newIdx);
    }
  };

  const clearQueue = () => {
    setQueue([]);
    setCurrentIndex(-1);
    setCurrentTrack(null);
    if (soundRef.current) {
      soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setIsPlaying(false);
    setPosition(0);
    setDuration(0);
  };

  // Favorites
  const handleToggleFavorite = async (track: Track) => {
    const isAdded = await StorageService.toggleFavorite(track);
    const updatedFavs = await StorageService.getFavorites();
    setFavorites(updatedFavs);
    
    // Sync current track metadata favorite indicator if currently playing
    if (currentTrack && currentTrack.id === track.id) {
      // Re-trigger current track update
      setCurrentTrack({ ...currentTrack });
    }
  };

  // Playlists
  const handleCreatePlaylist = async (name: string) => {
    await StorageService.createPlaylist(name);
    const pl = await StorageService.getPlaylists();
    setPlaylists(pl);
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    const updated = await StorageService.deletePlaylist(playlistId);
    setPlaylists(updated);
  };

  const handleAddTrackToPlaylist = async (playlistId: string, track: Track) => {
    const updated = await StorageService.addTrackToPlaylist(playlistId, track);
    setPlaylists(updated);
  };

  const handleRemoveTrackFromPlaylist = async (playlistId: string, trackId: string) => {
    const updated = await StorageService.removeTrackFromPlaylist(playlistId, trackId);
    setPlaylists(updated);
  };

  // Downloads
  const handleDownloadTrack = async (track: Track) => {
    // Prevent duplicate downloads
    if (downloadedTracks.some(t => t.id === track.id)) return;
    
    const result = await DownloadManager.downloadTrack(track);
    if (result) {
      const updated = await StorageService.getDownloadedTracks();
      setDownloadedTracks(updated);
    }
  };

  const handleDeleteDownload = async (trackId: string) => {
    const success = await DownloadManager.deleteTrack(trackId);
    if (success) {
      const updated = await StorageService.getDownloadedTracks();
      setDownloadedTracks(updated);
    }
  };

  const toggleShuffle = () => {
    setShuffleMode(!shuffleMode);
  };

  const toggleRepeat = () => {
    setRepeatMode(prev => {
      if (prev === 'none') return 'all';
      if (prev === 'all') return 'one';
      return 'none';
    });
  };

  return (
    <MusicContext.Provider
      value={{
        currentTrack,
        isPlaying,
        position,
        duration,
        queue,
        currentIndex,
        shuffleMode,
        repeatMode,
        offlineMode,
        playlists,
        downloadedTracks,
        recentlyPlayed,
        favorites,
        playTrack,
        togglePlay,
        nextTrack,
        prevTrack,
        seekTo,
        addToQueue,
        removeFromQueue,
        clearQueue,
        toggleFavorite: handleToggleFavorite,
        createPlaylist: handleCreatePlaylist,
        deletePlaylist: handleDeletePlaylist,
        addTrackToPlaylist: handleAddTrackToPlaylist,
        removeTrackFromPlaylist: handleRemoveTrackFromPlaylist,
        downloadTrack: handleDownloadTrack,
        deleteDownload: handleDeleteDownload,
        setOfflineMode,
        toggleShuffle,
        toggleRepeat,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};

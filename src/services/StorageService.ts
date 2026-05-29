// src/services/StorageService.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Track } from './ApiService';

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
  createdAt: number;
}

const KEYS = {
  PLAYLISTS: 'harmony_playlists_v1',
  RECENT_PLAYED: 'harmony_recent_played_v1',
  DOWNLOADS: 'harmony_downloads_v1',
  FAVORITES: 'harmony_favorites_v1',
};

// Helper helper to fetch and parse items from AsyncStorage
async function getParsedItem<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const rawData = await AsyncStorage.getItem(key);
    if (!rawData) return defaultValue;
    return JSON.parse(rawData) as T;
  } catch (error) {
    console.error(`Error loading key: ${key}`, error);
    return defaultValue;
  }
}

// Helper helper to save stringified items to AsyncStorage
async function setStringifiedItem(key: string, value: any): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving key: ${key}`, error);
  }
}

export const StorageService = {
  // ==========================================
  // PLAYLIST SERVICES
  // ==========================================
  
  async getPlaylists(): Promise<Playlist[]> {
    return getParsedItem<Playlist[]>(KEYS.PLAYLISTS, []);
  },
  
  async createPlaylist(name: string): Promise<Playlist> {
    const playlists = await this.getPlaylists();
    const newPlaylist: Playlist = {
      id: Math.random().toString(36).substring(7),
      name: name.trim(),
      tracks: [],
      createdAt: Date.now(),
    };
    
    await setStringifiedItem(KEYS.PLAYLISTS, [...playlists, newPlaylist]);
    return newPlaylist;
  },
  
  async deletePlaylist(playlistId: string): Promise<Playlist[]> {
    const playlists = await this.getPlaylists();
    const updated = playlists.filter(p => p.id !== playlistId);
    await setStringifiedItem(KEYS.PLAYLISTS, updated);
    return updated;
  },
  
  async addTrackToPlaylist(playlistId: string, track: Track): Promise<Playlist[]> {
    const playlists = await this.getPlaylists();
    const updated = playlists.map(p => {
      if (p.id === playlistId) {
        // Prevent duplicate songs in same playlist
        if (p.tracks.some(t => t.id === track.id)) {
          return p;
        }
        return {
          ...p,
          tracks: [...p.tracks, track],
        };
      }
      return p;
    });
    
    await setStringifiedItem(KEYS.PLAYLISTS, updated);
    return updated;
  },
  
  async removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<Playlist[]> {
    const playlists = await this.getPlaylists();
    const updated = playlists.map(p => {
      if (p.id === playlistId) {
        return {
          ...p,
          tracks: p.tracks.filter(t => t.id !== trackId),
        };
      }
      return p;
    });
    
    await setStringifiedItem(KEYS.PLAYLISTS, updated);
    return updated;
  },

  // ==========================================
  // RECENTLY PLAYED SERVICES
  // ==========================================
  
  async getRecentlyPlayed(): Promise<Track[]> {
    return getParsedItem<Track[]>(KEYS.RECENT_PLAYED, []);
  },
  
  async saveRecentlyPlayed(track: Track): Promise<Track[]> {
    const recents = await this.getRecentlyPlayed();
    // Remove track if it already exists to move it to the front
    const filtered = recents.filter(t => t.id !== track.id);
    const updated = [track, ...filtered].slice(0, 30); // Limit history to top 30 tracks
    
    await setStringifiedItem(KEYS.RECENT_PLAYED, updated);
    return updated;
  },
  
  async clearRecentlyPlayed(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.RECENT_PLAYED);
  },

  // ==========================================
  // FAVORITES SERVICES
  // ==========================================
  
  async getFavorites(): Promise<Track[]> {
    return getParsedItem<Track[]>(KEYS.FAVORITES, []);
  },
  
  async toggleFavorite(track: Track): Promise<boolean> {
    const favorites = await this.getFavorites();
    const isFav = favorites.some(t => t.id === track.id);
    let updated: Track[];
    
    if (isFav) {
      updated = favorites.filter(t => t.id !== track.id);
    } else {
      updated = [track, ...favorites];
    }
    
    await setStringifiedItem(KEYS.FAVORITES, updated);
    return !isFav; // Returns true if added, false if removed
  },
  
  async isFavorite(trackId: string): Promise<boolean> {
    const favorites = await this.getFavorites();
    return favorites.some(t => t.id === trackId);
  },

  // ==========================================
  // DOWNLOADED TRACKS METADATA SERVICES
  // ==========================================
  
  async getDownloadedTracks(): Promise<Track[]> {
    return getParsedItem<Track[]>(KEYS.DOWNLOADS, []);
  },
  
  async saveDownloadedTrack(track: Track): Promise<Track[]> {
    const downloads = await this.getDownloadedTracks();
    const filtered = downloads.filter(t => t.id !== track.id);
    const updated = [...filtered, track];
    
    await setStringifiedItem(KEYS.DOWNLOADS, updated);
    return updated;
  },
  
  async removeDownloadedTrack(trackId: string): Promise<Track[]> {
    const downloads = await this.getDownloadedTracks();
    const updated = downloads.filter(t => t.id !== trackId);
    await setStringifiedItem(KEYS.DOWNLOADS, updated);
    return updated;
  }
};

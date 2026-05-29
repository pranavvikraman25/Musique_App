// src/services/DownloadManager.ts

import * as FileSystem from 'expo-file-system';
import { Track } from './ApiService';
import { StorageService } from './StorageService';

const DOWNLOADS_DIR = `${FileSystem.documentDirectory}downloads/`;

// Ensure downloads directory exists
async function ensureDirectoryExists() {
  try {
    const dirInfo = await FileSystem.getInfoAsync(DOWNLOADS_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(DOWNLOADS_DIR, { intermediates: true });
    }
  } catch (error) {
    console.error('Error ensuring downloads directory exists:', error);
  }
}

export const DownloadManager = {
  /**
   * Get the local URI for a song file
   */
  getLocalSongUri(trackId: string): string {
    return `${DOWNLOADS_DIR}${trackId}.mp4`;
  },

  /**
   * Get the local URI for an image file
   */
  getLocalImageUri(trackId: string): string {
    return `${DOWNLOADS_DIR}${trackId}.jpg`;
  },

  /**
   * Check if a track is downloaded locally
   */
  async isTrackDownloaded(trackId: string): Promise<boolean> {
    try {
      await ensureDirectoryExists();
      const songPath = this.getLocalSongUri(trackId);
      const fileInfo = await FileSystem.getInfoAsync(songPath);
      return fileInfo.exists;
    } catch (e) {
      return false;
    }
  },

  /**
   * Download a track and its artwork to local storage
   */
  async downloadTrack(track: Track, onProgress?: (progress: number) => void): Promise<Track | null> {
    try {
      await ensureDirectoryExists();
      
      const localAudioUrl = this.getLocalSongUri(track.id);
      const localImageUrl = this.getLocalImageUri(track.id);
      
      // 1. Download the Audio stream
      const audioDownloader = FileSystem.createDownloadResumable(
        track.audioUrl,
        localAudioUrl,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          if (onProgress) {
            onProgress(progress);
          }
        }
      );
      
      console.log(`Starting audio download for track: ${track.title}`);
      const audioResult = await audioDownloader.downloadAsync();
      
      if (!audioResult || audioResult.status !== 200) {
        throw new Error('Failed to download audio file');
      }
      
      // 2. Download the Cover Image
      console.log(`Starting artwork download for track: ${track.title}`);
      const imageResult = await FileSystem.downloadAsync(
        track.image,
        localImageUrl
      );
      
      if (!imageResult || imageResult.status !== 200) {
        console.warn('Failed to download artwork, will fallback to original web image URL');
      }
      
      // 3. Save download metadata to AsyncStorage
      const downloadedTrack: Track = {
        ...track,
        isOffline: true,
        localAudioUrl: audioResult.uri,
        localImageUrl: imageResult ? imageResult.uri : track.image,
      };
      
      await StorageService.saveDownloadedTrack(downloadedTrack);
      console.log(`Download completed successfully: ${track.title}`);
      return downloadedTrack;
    } catch (error) {
      console.error('Error downloading track:', error);
      // Clean up incomplete files in case of failure
      try {
        const localAudioUrl = this.getLocalSongUri(track.id);
        const audioInfo = await FileSystem.getInfoAsync(localAudioUrl);
        if (audioInfo.exists) {
          await FileSystem.deleteAsync(localAudioUrl);
        }
        
        const localImageUrl = this.getLocalImageUri(track.id);
        const imageInfo = await FileSystem.getInfoAsync(localImageUrl);
        if (imageInfo.exists) {
          await FileSystem.deleteAsync(localImageUrl);
        }
      } catch (e) {
        // Ignore cleanup errors
      }
      return null;
    }
  },

  /**
   * Delete a downloaded track from local storage
   */
  async deleteTrack(trackId: string): Promise<boolean> {
    try {
      const localAudioUrl = this.getLocalSongUri(trackId);
      const localImageUrl = this.getLocalImageUri(trackId);
      
      // Delete audio file
      const audioInfo = await FileSystem.getInfoAsync(localAudioUrl);
      if (audioInfo.exists) {
        await FileSystem.deleteAsync(localAudioUrl);
      }
      
      // Delete image file
      const imageInfo = await FileSystem.getInfoAsync(localImageUrl);
      if (imageInfo.exists) {
        await FileSystem.deleteAsync(localImageUrl);
      }
      
      // Remove metadata from storage
      await StorageService.removeDownloadedTrack(trackId);
      console.log(`Successfully deleted track: ${trackId}`);
      return true;
    } catch (error) {
      console.error('Error deleting downloaded track:', error);
      return false;
    }
  }
};

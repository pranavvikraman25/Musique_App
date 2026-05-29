// src/services/ApiService.ts

import CryptoJS from 'crypto-js';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  image: string;
  audioUrl: string;
  duration: number; // in seconds
  language: string;
  isOffline?: boolean;
  localAudioUrl?: string;
  localImageUrl?: string;
}

// Key used by JioSaavn to encrypt media URLs
const DECRYPTION_KEY = '38346591';

// Helper to decrypt the encrypted_media_url from JioSaavn API
function decryptUrl(encryptedUrl: string): string {
  if (!encryptedUrl) return '';
  try {
    const key = CryptoJS.enc.Utf8.parse(DECRYPTION_KEY);
    const decrypted = CryptoJS.DES.decrypt(
      encryptedUrl.trim(),
      key,
      { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
    );
    const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);
    // Replace the default 96kbps quality with 320kbps for premium sound
    return decryptedStr.replace('_96.mp4', '_320.mp4');
  } catch (error) {
    console.error('Error decrypting JioSaavn media URL:', error);
    return '';
  }
}

// Helper to decode HTML entities from API response (like &amp; or &#039;)
function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;#039;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"');
}

export const ApiService = {
  /**
   * Search for songs by query string directly on JioSaavn API with 50 items capacity
   */
  async searchSongs(query: string): Promise<Track[]> {
    if (!query || query.trim() === '') return [];
    
    try {
      // Direct call to JioSaavn's full search API returning up to 50 results
      const url = `https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&cc=in&includeMetaTags=1&p=1&n=50&q=${encodeURIComponent(query)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`JioSaavn search returned status ${response.status}`);
      }
      
      const data = await response.json();
      const results = data.results || [];
      
      return results
        .map((item: any) => {
          // Decrypt the high-quality playable audio stream
          let audioUrl = decryptUrl(item.encrypted_media_url);
          
          // Fallback to media_preview_url conversion if decryption fails
          if (!audioUrl && item.media_preview_url) {
            audioUrl = item.media_preview_url
              .replace('preview', 'aac')
              .replace('_96_p.mp4', '_320.mp4');
          }
          
          if (!audioUrl) return null; // Filter out tracks that cannot be resolved

          // Upgrade image resolution to high-res (500x500) and ensure https
          let imageUrl = item.image || 'https://via.placeholder.com/500';
          imageUrl = imageUrl.replace('150x150', '500x500');
          if (imageUrl.startsWith('http://')) {
            imageUrl = imageUrl.replace('http://', 'https://');
          }
          
          if (audioUrl.startsWith('http://')) {
            audioUrl = audioUrl.replace('http://', 'https://');
          }

          const durationSec = parseInt(item.duration, 10) || 0;

          return {
            id: item.id || Math.random().toString(36).substring(7),
            title: decodeHtmlEntities(item.song || item.title || 'Unknown Track'),
            artist: decodeHtmlEntities(item.singers || item.primary_artists || 'Unknown Artist'),
            album: decodeHtmlEntities(item.album || 'Unknown Album'),
            image: imageUrl,
            audioUrl: audioUrl,
            duration: durationSec,
            language: item.language || 'unknown',
          };
        })
        .filter((track: any) => track !== null);
    } catch (error) {
      console.error('Error searching songs directly from JioSaavn:', error);
      return [];
    }
  },

  /**
   * Fetch recommendations/suggestions based on a track
   */
  async getSuggestions(track: Track): Promise<Track[]> {
    try {
      const primaryArtist = track.artist.split(',')[0].trim();
      const results = await this.searchSongs(primaryArtist);
      // Filter out the current playing song and take top 10 suggestions
      return results.filter(item => item.id !== track.id).slice(0, 10);
    } catch (error) {
      console.error('Error getting song suggestions:', error);
      return [];
    }
  }
};

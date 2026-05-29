// src/components/FullPlayer.tsx

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import {
  ChevronDown,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  Heart,
  Download,
  CheckCircle2,
  ListMusic,
  Trash2,
} from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import { useMusic } from '../context/MusicContext';
import { COLORS, BORDER_RADIUS, SPACING } from '../styles/theme';
import { formatDuration } from './TrackItem';

interface FullPlayerProps {
  visible: boolean;
  onClose: () => void;
}

const { width } = Dimensions.get('window');

export const FullPlayer: React.FC<FullPlayerProps> = ({ visible, onClose }) => {
  const {
    currentTrack,
    isPlaying,
    position,
    duration,
    shuffleMode,
    repeatMode,
    favorites,
    downloadedTracks,
    queue,
    currentIndex,
    togglePlay,
    nextTrack,
    prevTrack,
    seekTo,
    toggleFavorite,
    downloadTrack,
    deleteDownload,
    toggleShuffle,
    toggleRepeat,
    playTrack,
  } = useMusic();

  const [showQueue, setShowQueue] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!currentTrack) return null;

  const isFavorite = favorites.some((t) => t.id === currentTrack.id);
  const isDownloaded = downloadedTracks.some((t) => t.id === currentTrack.id);

  const handleDownload = async () => {
    if (isDownloaded) {
      // Prompt or delete directly
      setIsDownloading(true);
      await deleteDownload(currentTrack.id);
      setIsDownloading(false);
    } else {
      setIsDownloading(true);
      await downloadTrack(currentTrack);
      setIsDownloading(false);
    }
  };

  const handleSliderValueChange = () => {
    // Optional: pause updates temporarily during scrub
  };

  const handleSliderSlidingComplete = async (value: number) => {
    await seekTo(value);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.headerButton}>
            <ChevronDown size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Now Playing</Text>
          <TouchableOpacity
            onPress={() => setShowQueue(!showQueue)}
            activeOpacity={0.7}
            style={[styles.headerButton, showQueue && styles.activeHeaderButton]}
          >
            <ListMusic size={24} color={showQueue ? COLORS.primary : COLORS.text} />
          </TouchableOpacity>
        </View>

        {showQueue ? (
          /* Queue / Up Next View */
          <View style={styles.queueContainer}>
            <View style={styles.queueHeader}>
              <Text style={styles.queueHeading}>Up Next</Text>
              <Text style={styles.queueSubheading}>{queue.length - currentIndex - 1} songs in queue</Text>
            </View>
            <ScrollView contentContainerStyle={styles.queueScroll}>
              {queue.map((track, index) => {
                const isItemActive = index === currentIndex;
                const isUpcoming = index > currentIndex;
                
                return (
                  <TouchableOpacity
                    key={`${track.id}-${index}`}
                    activeOpacity={0.7}
                    onPress={() => playTrack(track, queue)}
                    style={[styles.queueItem, isItemActive && styles.queueItemActive]}
                  >
                    <Image source={{ uri: track.isOffline && track.localImageUrl ? track.localImageUrl : track.image }} style={styles.queueItemImage} />
                    <View style={styles.queueItemDetails}>
                      <Text
                        numberOfLines={1}
                        style={[styles.queueItemTitle, isItemActive && styles.queueItemTitleActive]}
                      >
                        {track.title}
                      </Text>
                      <Text numberOfLines={1} style={styles.queueItemArtist}>
                        {track.artist}
                      </Text>
                    </View>
                    {isItemActive && (
                      <Text style={styles.playingBadge}>Playing</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : (
          /* Album Player View */
          <View style={styles.playerContent}>
            {/* Album artwork */}
            <View style={styles.artworkContainer}>
              <Image
                source={{
                  uri: currentTrack.isOffline && currentTrack.localImageUrl
                    ? currentTrack.localImageUrl
                    : currentTrack.image
                }}
                style={styles.artwork}
              />
            </View>

            {/* Song Metadata Details */}
            <View style={styles.detailsContainer}>
              <View style={styles.songInfo}>
                <Text numberOfLines={1} style={styles.title}>
                  {currentTrack.title}
                </Text>
                <Text numberOfLines={1} style={styles.artist}>
                  {currentTrack.artist}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => toggleFavorite(currentTrack)}
                activeOpacity={0.7}
                style={styles.favoriteButton}
              >
                {isFavorite ? (
                  <Heart size={28} color={COLORS.primary} fill={COLORS.primary} />
                ) : (
                  <Heart size={28} color={COLORS.textSecondary} />
                )}
              </TouchableOpacity>
            </View>

            {/* Progress Slider */}
            <View style={styles.sliderContainer}>
              <Slider
                style={styles.slider}
                value={position}
                minimumValue={0}
                maximumValue={duration || 100}
                minimumTrackTintColor={COLORS.primary}
                maximumTrackTintColor="rgba(255, 255, 255, 0.15)"
                thumbTintColor={COLORS.primary}
                onValueChange={handleSliderValueChange}
                onSlidingComplete={handleSliderSlidingComplete}
              />
              <View style={styles.timerRow}>
                <Text style={styles.timerText}>{formatDuration(position / 1000)}</Text>
                <Text style={styles.timerText}>{formatDuration(duration / 1000)}</Text>
              </View>
            </View>

            {/* Control deck */}
            <View style={styles.controlsContainer}>
              {/* Shuffle toggle */}
              <TouchableOpacity onPress={toggleShuffle} activeOpacity={0.7} style={styles.utilityButton}>
                <Shuffle size={22} color={shuffleMode ? COLORS.primary : COLORS.textSecondary} />
              </TouchableOpacity>

              {/* Skip Back */}
              <TouchableOpacity onPress={prevTrack} activeOpacity={0.7} style={styles.controlButton}>
                <SkipBack size={32} color={COLORS.text} fill={COLORS.text} />
              </TouchableOpacity>

              {/* Play / Pause with Glow effect */}
              <TouchableOpacity onPress={togglePlay} activeOpacity={0.8} style={styles.playPauseButton}>
                {isPlaying ? (
                  <Pause size={30} color={COLORS.background} fill={COLORS.background} />
                ) : (
                  <Play size={30} color={COLORS.background} fill={COLORS.background} style={styles.playIconOffset} />
                )}
              </TouchableOpacity>

              {/* Skip Forward */}
              <TouchableOpacity onPress={nextTrack} activeOpacity={0.7} style={styles.controlButton}>
                <SkipForward size={32} color={COLORS.text} fill={COLORS.text} />
              </TouchableOpacity>

              {/* Repeat toggle */}
              <TouchableOpacity onPress={toggleRepeat} activeOpacity={0.7} style={styles.utilityButton}>
                <View style={styles.repeatWrapper}>
                  <Repeat size={22} color={repeatMode !== 'none' ? COLORS.secondary : COLORS.textSecondary} />
                  {repeatMode === 'one' && (
                    <Text style={styles.repeatBadge}>1</Text>
                  )}
                </View>
              </TouchableOpacity>
            </View>

            {/* Bottom Panel Controls (Downloads etc.) */}
            <View style={styles.bottomControls}>
              <TouchableOpacity
                disabled={isDownloading}
                onPress={handleDownload}
                activeOpacity={0.7}
                style={[styles.downloadActionButton, isDownloaded && styles.downloadActiveButton]}
              >
                {isDownloading ? (
                  <ActivityIndicator size="small" color={COLORS.text} />
                ) : isDownloaded ? (
                  <>
                    <Trash2 size={16} color={COLORS.error} />
                    <Text style={styles.downloadActionTextActive}>Delete Cache</Text>
                  </>
                ) : (
                  <>
                    <Download size={16} color={COLORS.text} />
                    <Text style={styles.downloadActionText}>Listen Offline</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerButton: {
    padding: SPACING.xs,
  },
  activeHeaderButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: BORDER_RADIUS.sm,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  playerContent: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  artworkContainer: {
    width: width - SPACING.xl * 2,
    height: width - SPACING.xl * 2,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    elevation: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    marginVertical: SPACING.md,
  },
  artwork: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  detailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.sm,
  },
  songInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  title: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: 'bold',
  },
  artist: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginTop: SPACING.xs,
  },
  favoriteButton: {
    padding: SPACING.xs,
  },
  sliderContainer: {
    width: '100%',
    marginTop: SPACING.md,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  timerText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: SPACING.md,
    marginVertical: SPACING.md,
  },
  playPauseButton: {
    width: 72,
    height: 72,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.text, // Solid white background
    justifyContent: 'center',
    alignItems: 'center',
    // Glow effect
    elevation: 8,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  playIconOffset: {
    marginLeft: 4, // Visual centering adjust
  },
  controlButton: {
    padding: SPACING.xs,
  },
  utilityButton: {
    padding: SPACING.sm,
  },
  repeatWrapper: {
    position: 'relative',
  },
  repeatBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: COLORS.secondary,
    color: COLORS.background,
    fontSize: 8,
    fontWeight: 'bold',
    width: 12,
    height: 12,
    borderRadius: 6,
    textAlign: 'center',
    lineHeight: 12,
  },
  bottomControls: {
    width: '100%',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  downloadActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
  },
  downloadActiveButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  downloadActionText: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 13,
    marginLeft: SPACING.sm,
  },
  downloadActionTextActive: {
    color: COLORS.error,
    fontWeight: '600',
    fontSize: 13,
    marginLeft: SPACING.sm,
  },
  // Queue Sheet styles
  queueContainer: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  queueHeader: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  queueHeading: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  queueSubheading: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  queueScroll: {
    paddingBottom: SPACING.xxl,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.02)',
  },
  queueItemActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
  },
  queueItemImage: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.md,
    backgroundColor: COLORS.surfaceLight,
  },
  queueItemDetails: {
    flex: 1,
  },
  queueItemTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  queueItemTitleActive: {
    color: COLORS.primary,
  },
  queueItemArtist: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  playingBadge: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});
export default FullPlayer;

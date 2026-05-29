// src/components/MiniPlayer.tsx

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Play, Pause, SkipForward } from 'lucide-react-native';
import { useMusic } from '../context/MusicContext';
import { COLORS, BORDER_RADIUS, SPACING } from '../styles/theme';

interface MiniPlayerProps {
  onPress: () => void;
}

const { width } = Dimensions.get('window');

export const MiniPlayer: React.FC<MiniPlayerProps> = ({ onPress }) => {
  const { currentTrack, isPlaying, position, duration, togglePlay, nextTrack } = useMusic();

  if (!currentTrack) return null;

  // Calculate progress ratio for the top indicator bar
  const progressRatio = duration > 0 ? position / duration : 0;
  const progressWidth = width * progressRatio;

  const handlePlayPause = (e: any) => {
    e.stopPropagation(); // Avoid triggering onPress that expands full player
    togglePlay();
  };

  const handleNext = (e: any) => {
    e.stopPropagation(); // Avoid triggering onPress
    nextTrack();
  };

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.container}>
      {/* Tiny top progress bar */}
      <View style={styles.progressBackground}>
        <View style={[styles.progressBar, { width: progressWidth }]} />
      </View>

      <View style={styles.content}>
        {/* Thumbnail art */}
        <Image
          source={{
            uri: currentTrack.isOffline && currentTrack.localImageUrl
              ? currentTrack.localImageUrl
              : currentTrack.image
          }}
          style={styles.image}
        />

        {/* Text Details */}
        <View style={styles.details}>
          <Text numberOfLines={1} style={styles.title}>
            {currentTrack.title}
          </Text>
          <Text numberOfLines={1} style={styles.artist}>
            {currentTrack.artist}
          </Text>
        </View>

        {/* Quick controls */}
        <View style={styles.controls}>
          <TouchableOpacity onPress={handlePlayPause} activeOpacity={0.7} style={styles.controlButton}>
            {isPlaying ? (
              <Pause size={22} color={COLORS.text} fill={COLORS.text} />
            ) : (
              <Play size={22} color={COLORS.text} fill={COLORS.text} />
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNext} activeOpacity={0.7} style={styles.controlButton}>
            <SkipForward size={22} color={COLORS.text} fill={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 56, // Sits exactly above the standard Bottom Tab bar
    left: 8,
    right: 8,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden', // Required to clip the top progress bar properly
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  progressBackground: {
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    height: 60,
  },
  image: {
    width: 42,
    height: 42,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceLight,
  },
  details: {
    flex: 1,
    marginLeft: SPACING.md,
    justifyContent: 'center',
  },
  title: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  artist: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
});
export default MiniPlayer;

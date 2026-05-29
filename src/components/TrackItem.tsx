// src/components/TrackItem.tsx

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Play, MoreVertical, CheckCircle2 } from 'lucide-react-native';
import { Track } from '../services/ApiService';
import { COLORS, BORDER_RADIUS, SPACING } from '../styles/theme';

interface TrackItemProps {
  track: Track;
  onPress: (track: Track) => void;
  onMenuPress?: (track: Track) => void;
  isActive?: boolean;
  isPlaying?: boolean;
  isDownloaded?: boolean;
}

// Utility to format seconds to MM:SS
export const formatDuration = (seconds: number): string => {
  if (isNaN(seconds) || seconds <= 0) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export const TrackItem: React.FC<TrackItemProps> = ({
  track,
  onPress,
  onMenuPress,
  isActive = false,
  isPlaying = false,
  isDownloaded = false,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(track)}
      style={[
        styles.container,
        isActive && styles.activeContainer
      ]}
    >
      {/* Album Art with Overlay Play Button when Active */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: track.isOffline && track.localImageUrl ? track.localImageUrl : track.image }}
          style={styles.image}
        />
        {isActive && (
          <View style={styles.playingOverlay}>
            <Play size={16} color={COLORS.primary} fill={COLORS.primary} />
          </View>
        )}
      </View>

      {/* Song Details */}
      <View style={styles.details}>
        <Text
          numberOfLines={1}
          style={[
            styles.title,
            isActive && styles.activeTitle
          ]}
        >
          {track.title}
        </Text>
        <Text numberOfLines={1} style={styles.artist}>
          {track.artist}
        </Text>
      </View>

      {/* Badges and Actions */}
      <View style={styles.meta}>
        {isDownloaded && (
          <CheckCircle2 size={15} color={COLORS.success} style={styles.downloadIcon} />
        )}
        <Text style={styles.duration}>
          {formatDuration(track.duration)}
        </Text>
        {onMenuPress && (
          <TouchableOpacity
            onPress={() => onMenuPress(track)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
            style={styles.menuButton}
          >
            <MoreVertical size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginVertical: 4,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'transparent',
  },
  activeContainer: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
  },
  imageContainer: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  image: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceLight,
  },
  playingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
  },
  details: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  activeTitle: {
    color: COLORS.primary,
  },
  artist: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  downloadIcon: {
    marginRight: SPACING.sm,
  },
  duration: {
    color: COLORS.textSecondary,
    fontSize: 12,
    width: 40,
    textAlign: 'right',
  },
  menuButton: {
    marginLeft: SPACING.sm,
    padding: SPACING.xs,
  },
});
export default TrackItem;

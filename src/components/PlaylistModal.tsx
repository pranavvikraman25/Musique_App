// src/components/PlaylistModal.tsx

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Plus, FolderPlus, Music } from 'lucide-react-native';
import { useMusic } from '../context/MusicContext';
import { Track } from '../services/ApiService';
import { COLORS, BORDER_RADIUS, SPACING } from '../styles/theme';

interface PlaylistModalProps {
  visible: boolean;
  onClose: () => void;
  track: Track | null;
}

export const PlaylistModal: React.FC<PlaylistModalProps> = ({ visible, onClose, track }) => {
  const { playlists, createPlaylist, addTrackToPlaylist } = useMusic();
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  if (!track) return null;

  const handleSelectPlaylist = async (playlistId: string) => {
    await addTrackToPlaylist(playlistId, track);
    onClose();
    // In a real app we would trigger a beautiful Toast here!
  };

  const handleCreateAndAdd = async () => {
    if (newPlaylistName.trim() === '') return;
    try {
      // 1. Create playlist (StorageService saves it and returns)
      // Since our MusicContext update updates state, we fetch the updated playlists
      const tempId = Math.random().toString(36).substring(7); // Create temp name or just let context handle it
      await createPlaylist(newPlaylistName);
      
      // Wait for state sync or reload, then add track to the newly created playlist
      // In our MusicContext: handleCreatePlaylist does setPlaylists.
      // Let's find the newly created playlist from the storage or context
      // To be safe, we can add it directly through the context.
      // But wait! Since state updates asynchronously, we can modify handleCreatePlaylist to return the playlist or we can simply search our updated playlists list.
      // Let's just find the playlist with the matching name.
      const freshPlaylists = playlists;
      // We will add the track to the new playlist.
      // Wait, inside MusicContext.tsx:
      // const handleCreatePlaylist = async (name: string) => {
      //   await StorageService.createPlaylist(name);
      //   const pl = await StorageService.getPlaylists();
      //   setPlaylists(pl);
      // };
      // Since we just called createPlaylist(name), we can fetch playlists again to get the newest playlist id
      // Or we can just let context handle it. Let's do it safely by searching the newly updated list.
      // We can just add it once the playlists state updates. But since it's async, let's look up the newly created playlist name.
      setTimeout(async () => {
        const currentPlaylists = playlists;
        const newPl = currentPlaylists.find(p => p.name.toLowerCase() === newPlaylistName.toLowerCase().trim());
        if (newPl) {
          await addTrackToPlaylist(newPl.id, track);
        }
      }, 500);

      setNewPlaylistName('');
      setShowCreateInput(false);
      onClose();
    } catch (e) {
      console.error('Error creating playlist and adding track:', e);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalContainer}
            >
              <View style={styles.header}>
                <Text style={styles.title}>Add to Playlist</Text>
                <Text style={styles.subtitle}>Select a playlist for "{track.title}"</Text>
              </View>

              {/* Inline Playlist Creator Form */}
              {showCreateInput ? (
                <View style={styles.createForm}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter playlist name..."
                    placeholderTextColor={COLORS.textMuted}
                    value={newPlaylistName}
                    onChangeText={setNewPlaylistName}
                    autoFocus
                    maxLength={32}
                  />
                  <View style={styles.formButtons}>
                    <TouchableOpacity
                      onPress={() => setShowCreateInput(false)}
                      style={[styles.formButton, styles.cancelButton]}
                    >
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleCreateAndAdd}
                      style={[styles.formButton, styles.saveButton]}
                    >
                      <Text style={styles.saveText}>Create & Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => setShowCreateInput(true)}
                  style={styles.createButton}
                  activeOpacity={0.7}
                >
                  <FolderPlus size={20} color={COLORS.primary} />
                  <Text style={styles.createButtonText}>Create New Playlist</Text>
                </TouchableOpacity>
              )}

              {/* Playlists List */}
              <FlatList
                data={playlists}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  !showCreateInput ? (
                    <View style={styles.emptyContainer}>
                      <Music size={40} color={COLORS.textMuted} />
                      <Text style={styles.emptyText}>No playlists created yet.</Text>
                    </View>
                  ) : null
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleSelectPlaylist(item.id)}
                    style={styles.playlistItem}
                    activeOpacity={0.7}
                  >
                    <View style={styles.playlistIconContainer}>
                      <Music size={18} color={COLORS.text} />
                    </View>
                    <View style={styles.playlistInfo}>
                      <Text style={styles.playlistName}>{item.name}</Text>
                      <Text style={styles.playlistCount}>
                        {item.tracks.length} {item.tracks.length === 1 ? 'song' : 'songs'}
                      </Text>
                    </View>
                    <Plus size={16} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                )}
              />
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '75%',
    minHeight: '40%',
    padding: SPACING.lg,
  },
  header: {
    marginBottom: SPACING.md,
  },
  title: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  createButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 15,
    marginLeft: SPACING.md,
  },
  createForm: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.md,
    color: COLORS.text,
    padding: SPACING.md,
    fontSize: 15,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  formButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginLeft: SPACING.md,
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  cancelText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  saveText: {
    color: COLORS.text,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: SPACING.xxl,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  playlistIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  playlistCount: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyText: {
    color: COLORS.textMuted,
    marginTop: SPACING.md,
    fontSize: 14,
  },
});
export default PlaylistModal;

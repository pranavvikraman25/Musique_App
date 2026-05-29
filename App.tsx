// App.tsx

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ScrollView,
  StatusBar,
  Modal,
  Image,
  Switch,
  ActivityIndicator,
  TextInput,
  TouchableWithoutFeedback,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import {
  Home as HomeIcon,
  Search as SearchIcon,
  Library as LibraryIcon,
  Play,
  Heart,
  Plus,
  Trash2,
  Download,
  CheckCircle2,
  FolderOpen,
  Music,
  Disc,
  WifiOff,
  User,
  ArrowRight,
  ArrowLeft,
  Shuffle,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { MusicProvider, useMusic } from './src/context/MusicContext';
import { ApiService, Track } from './src/services/ApiService';
import { COLORS, BORDER_RADIUS, SPACING } from './src/styles/theme';
import SearchBar from './src/components/SearchBar';
import TrackItem from './src/components/TrackItem';
import MiniPlayer from './src/components/MiniPlayer';
import FullPlayer from './src/components/FullPlayer';
import PlaylistModal from './src/components/PlaylistModal';

type TabType = 'home' | 'search' | 'library';

// Curated list of top music directors & indie artists with custom linear gradient indicators
const FEATURED_ARTISTS = [
  { name: 'A.R. Rahman', query: 'A.R. Rahman Tamil Hits', initials: 'ARR', gradient: ['#8B5CF6', '#3B82F6'] },
  { name: 'Anirudh', query: 'Anirudh Ravichander Hits', initials: 'ANI', gradient: ['#EF4444', '#F97316'] },
  { name: 'Yuvan Shankar Raja', query: 'Yuvan Shankar Raja Hits', initials: 'YSR', gradient: ['#6366F1', '#EC4899'] },
  { name: 'Harris Jayaraj', query: 'Harris Jayaraj Hits', initials: 'HJ', gradient: ['#14B8A6', '#06B6D4'] },
  { name: 'Ilaiyaraaja', query: 'Ilaiyaraaja Tamil Hits', initials: 'IR', gradient: ['#F59E0B', '#D97706'] },
  { name: 'Sid Sriram', query: 'Sid Sriram Hits', initials: 'SS', gradient: ['#10B981', '#14B8A6'] },
  { name: 'Taylor Swift', query: 'Taylor Swift Hits', initials: 'TS', gradient: ['#EC4899', '#C084FC'] },
  { name: 'The Weeknd', query: 'The Weeknd Hits', initials: 'TW', gradient: ['#EF4444', '#111827'] },
  { name: 'Coldplay', query: 'Coldplay Hits', initials: 'CP', gradient: ['#06B6D4', '#4F46E5'] }
];

// Curated list of vibe/era playlists from 1960s to 2026
const VIBE_PLAYLISTS = [
  { name: 'Trending 2026 Hits 🔥', query: 'Tamil hits 2026', subtitle: 'Hottest tracks right now', gradient: ['#EF4444', '#B91C1C'] },
  { name: '2020s Tamil Hits ⚡', query: 'Tamil hits 2024', subtitle: 'New age blockbusters', gradient: ['#3B82F6', '#1D4ED8'] },
  { name: '2010s Yuvan & Harris 🎧', query: 'Tamil hits 2010', subtitle: 'Millennial favorites', gradient: ['#8B5CF6', '#6D28D9'] },
  { name: '2000s Hits 💿', query: 'Tamil hits 2000', subtitle: 'Melody boom years', gradient: ['#10B981', '#047857'] },
  { name: '90s Tamil Romance 💖', query: 'Tamil hits 1990', subtitle: 'Golden romantic era', gradient: ['#EC4899', '#BE185D'] },
  { name: '80s Ilaiyaraaja Hits 🎸', query: 'Tamil hits 1980', subtitle: 'Nostalgic synth magic', gradient: ['#F59E0B', '#B45309'] },
  { name: '60s & 70s Classics 📻', query: 'Tamil hits 1970', subtitle: 'Vintage memories', gradient: ['#6B7280', '#374151'] },
  { name: 'English Chartbusters 🌟', query: 'English Pop Hits', subtitle: 'Global charts today', gradient: ['#06B6D4', '#0891B2'] }
];

// Main Container component that consumes context
const MainApp = () => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [isFullPlayerVisible, setIsFullPlayerVisible] = useState(false);
  
  // Track Actions Menu State
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [isActionMenuVisible, setIsActionMenuVisible] = useState(false);
  const [isPlaylistModalVisible, setIsPlaylistModalVisible] = useState(false);

  // Playlist view state (for opening a specific playlist)
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showAddPlaylistInput, setShowAddPlaylistInput] = useState(false);

  // Category/Artist View State
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [categorySongs, setCategorySongs] = useState<Track[]>([]);
  const [isLoadingCategory, setIsLoadingCategory] = useState(false);

  const {
    currentTrack,
    isPlaying,
    offlineMode,
    playlists,
    downloadedTracks,
    recentlyPlayed,
    favorites,
    playTrack,
    togglePlay,
    addToQueue,
    toggleFavorite,
    downloadTrack,
    deleteDownload,
    setOfflineMode,
    createPlaylist,
    deletePlaylist,
    removeTrackFromPlaylist,
  } = useMusic();

  // Search Submit Handler
  const handleSearchSubmit = async (queryText = searchQuery) => {
    if (queryText.trim() === '') return;
    setIsLoadingSearch(true);
    try {
      const results = await ApiService.searchSongs(queryText);
      setSearchResults(results);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingSearch(false);
    }
  };

  // Debounced search trigger (can search on submit or typing)
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      handleSearchSubmit();
    }, 600); // 600ms debounce
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Clean up category/artist views when switching tabs
  useEffect(() => {
    setActiveCategory(null);
    setCategorySongs([]);
  }, [activeTab]);

  // Open circular artist or vibe/decade playlist and fetch songs
  const handleOpenCategory = async (categoryName: string, queryText: string) => {
    setActiveCategory(categoryName);
    setIsLoadingCategory(true);
    try {
      const results = await ApiService.searchSongs(queryText);
      setCategorySongs(results);
    } catch (e) {
      console.error('Error loading category songs:', e);
    } finally {
      setIsLoadingCategory(false);
    }
  };

  // Dynamic greetings based on time
  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return 'Good Morning ☀️';
    if (hrs < 18) return 'Good Afternoon 🌤️';
    return 'Good Evening 🌙';
  };

  // Open the 3-dot action menu for a song
  const handleOpenActionMenu = (track: Track) => {
    setSelectedTrack(track);
    setIsActionMenuVisible(true);
  };

  // Play a selection and establish the context queue
  const handlePlaySong = (track: Track, customQueue?: Track[]) => {
    // If customQueue is not provided, use current search results or downloaded tracks
    const playQueue = customQueue || (searchResults.length > 0 ? searchResults : [track]);
    playTrack(track, playQueue);
  };

  // Add to Queue action
  const handleAddToQueue = () => {
    if (selectedTrack) {
      addToQueue(selectedTrack);
      setIsActionMenuVisible(false);
      setSelectedTrack(null);
    }
  };

  // Favorite toggle from action menu
  const handleToggleFavoriteAction = async () => {
    if (selectedTrack) {
      await toggleFavorite(selectedTrack);
      setIsActionMenuVisible(false);
      setSelectedTrack(null);
    }
  };

  // Download action from action menu
  const handleDownloadAction = async () => {
    if (selectedTrack) {
      setIsActionMenuVisible(false);
      const trackToDownload = selectedTrack;
      setSelectedTrack(null);
      
      const isAlreadyDownloaded = downloadedTracks.some((t) => t.id === trackToDownload.id);
      if (isAlreadyDownloaded) {
        await deleteDownload(trackToDownload.id);
      } else {
        await downloadTrack(trackToDownload);
      }
    }
  };

  // Trigger playlist modal from action menu
  const handleAddToPlaylistAction = () => {
    setIsActionMenuVisible(false);
    setIsPlaylistModalVisible(true);
  };

  // ==========================================
  // VIEW RENDERERS
  // ==========================================

  // 1. HOME VIEW
  const renderHome = () => {
    if (activeCategory) {
      return renderCategoryDetail();
    }

    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Welcome */}
        <View style={styles.welcomeRow}>
          <View>
            <Text style={styles.greetingText}>{getGreeting()}</Text>
            <Text style={styles.userNameText}>Pranav Vikraman</Text>
          </View>
          <View style={styles.avatarContainer}>
            <User size={20} color={COLORS.text} />
          </View>
        </View>

        {/* Offline Notice Banner */}
        {offlineMode && (
          <View style={styles.offlineBanner}>
            <WifiOff size={18} color={COLORS.accent} />
            <Text style={styles.offlineBannerText}>Offline Mode is active. Playing cached tracks only.</Text>
          </View>
        )}

        {/* Quick Playlists (Spotify Grid Layout) */}
        <Text style={styles.sectionTitle}>Quick Playlists</Text>
        <View style={styles.spotifyGrid}>
          {VIBE_PLAYLISTS.slice(0, 4).map((playlist) => (
            <TouchableOpacity
              key={playlist.name}
              onPress={() => handleOpenCategory(playlist.name, playlist.query)}
              activeOpacity={0.8}
              style={styles.spotifyGridCard}
            >
              <LinearGradient
                colors={playlist.gradient as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.spotifyGridImage}
              >
                <Music size={18} color={COLORS.text} />
              </LinearGradient>
              <Text numberOfLines={2} style={styles.spotifyGridTitle}>
                {playlist.name.replace(/ 🔥| ⚡| 🎧| 💿| 💖| 🎸| 📻| 🌟/, '')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recently Played */}
        {recentlyPlayed.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Recently Played</Text>
            <FlatList
              horizontal
              data={recentlyPlayed}
              keyExtractor={(item, index) => `${item.id}-recent-${index}`}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => playTrack(item, recentlyPlayed)}
                  activeOpacity={0.8}
                  style={styles.recentCard}
                >
                  <Image source={{ uri: item.image }} style={styles.recentCardImage} />
                  <Text numberOfLines={1} style={styles.recentCardTitle}>
                    {item.title}
                  </Text>
                  <Text numberOfLines={1} style={styles.recentCardArtist}>
                    {item.artist}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Circular Artists Section (Music Directors & Indie Artists) */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Music Directors & Indie Artists</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
            {FEATURED_ARTISTS.map((artist) => (
              <TouchableOpacity
                key={artist.name}
                onPress={() => handleOpenCategory(artist.name, artist.query)}
                activeOpacity={0.8}
                style={styles.artistCircleCard}
              >
                <LinearGradient
                  colors={artist.gradient as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.artistCircleAvatar}
                >
                  <Text style={styles.artistInitials}>{artist.initials}</Text>
                </LinearGradient>
                <Text numberOfLines={1} style={styles.artistCircleName}>
                  {artist.name.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Vibes & Eras Time Machine */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Time Machine & Vibes</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
            {VIBE_PLAYLISTS.map((playlist) => {
              const emojiMatch = playlist.name.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g) || 
                                 playlist.name.match(/[\u2600-\u27BF]/g);
              const emoji = emojiMatch ? emojiMatch[0] : '🎵';
              
              return (
                <TouchableOpacity
                  key={playlist.name}
                  onPress={() => handleOpenCategory(playlist.name, playlist.query)}
                  activeOpacity={0.8}
                  style={styles.vibeCard}
                >
                  <LinearGradient
                    colors={playlist.gradient as [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.vibeCardImage}
                  >
                    <Text style={styles.vibeCardIcon}>{emoji}</Text>
                  </LinearGradient>
                  <Text numberOfLines={1} style={styles.vibeCardTitle}>
                    {playlist.name}
                  </Text>
                  <Text numberOfLines={1} style={styles.vibeCardSub}>
                    {playlist.subtitle}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Playlists shortcut */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>My Playlists</Text>
            <TouchableOpacity onPress={() => setActiveTab('library')} style={styles.seeAllLink}>
              <Text style={styles.seeAllText}>See All</Text>
              <ArrowRight size={14} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          {playlists.slice(0, 3).map(p => (
            <TouchableOpacity
              key={p.id}
              onPress={() => {
                setActiveTab('library');
                setActivePlaylistId(p.id);
              }}
              style={styles.playlistRowItem}
            >
              <View style={styles.playlistRowArt}>
                <Music size={18} color={COLORS.text} />
              </View>
              <View style={styles.playlistRowInfo}>
                <Text style={styles.playlistRowName}>{p.name}</Text>
                <Text style={styles.playlistRowCount}>{p.tracks.length} songs</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  };

  // CATEGORY DETAIL SUBVIEW (ARTIST / VIBE / DECADE DETAILED SONGS LIST)
  const renderCategoryDetail = () => {
    const handlePlayAll = (shuffleMode = false) => {
      if (categorySongs.length === 0) return;
      
      let queueToPlay = [...categorySongs];
      if (shuffleMode) {
        queueToPlay = queueToPlay.sort(() => Math.random() - 0.5);
      }
      
      playTrack(queueToPlay[0], queueToPlay);
    };

    return (
      <View style={styles.viewContainer}>
        {/* Category Header */}
        <View style={styles.categoryHeader}>
          <TouchableOpacity 
            onPress={() => {
              setActiveCategory(null);
              setCategorySongs([]);
            }}
            style={styles.categoryBackButton}
          >
            <ArrowLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text numberOfLines={1} style={styles.categoryHeaderTitle}>
            {activeCategory}
          </Text>
        </View>

        {/* Loader or Tracks */}
        {isLoadingCategory ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Fetching 50+ songs from JioSaavn...</Text>
          </View>
        ) : categorySongs.length > 0 ? (
          <View style={{ flex: 1 }}>
            {/* Play Actions Bar */}
            <View style={styles.playActionsBar}>
              <View>
                <Text style={styles.categoryMetaText}>Playlist • {categorySongs.length} songs</Text>
                <Text style={styles.categorySubMetaText}>Decrypted on-device • Premium quality</Text>
              </View>
              <View style={styles.playActionsRight}>
                <TouchableOpacity 
                  onPress={() => handlePlayAll(true)}
                  style={styles.shufflePlayButton}
                  activeOpacity={0.8}
                >
                  <Shuffle size={18} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => handlePlayAll(false)}
                  style={styles.categoryPlayButton}
                  activeOpacity={0.8}
                >
                  <Play size={24} color={COLORS.background} fill={COLORS.background} />
                </TouchableOpacity>
              </View>
            </View>

            {/* List */}
            <FlatList
              data={categorySongs}
              keyExtractor={(item, index) => `${item.id}-cat-${index}`}
              contentContainerStyle={[styles.listContainerContent, { paddingBottom: 120 }]}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TrackItem
                  track={item}
                  isActive={currentTrack?.id === item.id}
                  isPlaying={isPlaying && currentTrack?.id === item.id}
                  isDownloaded={downloadedTracks.some((t: Track) => t.id === item.id)}
                  onPress={(t: Track) => handlePlaySong(t, categorySongs)}
                  onMenuPress={handleOpenActionMenu}
                />
              )}
            />
          </View>
        ) : (
          <View style={styles.centerContainer}>
            <Music size={48} color={COLORS.textMuted} style={{ marginBottom: SPACING.md }} />
            <Text style={styles.loadingText}>No tracks found. Try again later.</Text>
          </View>
        )}
      </View>
    );
  };

  // 2. SEARCH VIEW
  const renderSearch = () => {
    return (
      <View style={styles.viewContainer}>
        {/* Search header container */}
        <View style={styles.searchHeader}>
          <Text style={styles.screenTitle}>Search</Text>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            onClear={() => {
              setSearchQuery('');
              setSearchResults([]);
            }}
            onSubmit={() => handleSearchSubmit()}
          />
        </View>

        {/* Loader or Results */}
        {isLoadingSearch ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Searching the vibes...</Text>
          </View>
        ) : searchResults.length > 0 ? (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainerContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TrackItem
                track={item}
                isActive={currentTrack?.id === item.id}
                isPlaying={isPlaying && currentTrack?.id === item.id}
                isDownloaded={downloadedTracks.some((t: Track) => t.id === item.id)}
                onPress={(t: Track) => handlePlaySong(t, searchResults)}
                onMenuPress={handleOpenActionMenu}
              />
            )}
          />
        ) : (
          /* Search Placeholder Recommendations */
          <ScrollView contentContainerStyle={styles.searchPromptContainer}>
            <SearchIcon size={48} color={COLORS.textMuted} style={{ marginBottom: SPACING.md }} />
            <Text style={styles.searchPromptHeading}>Find your favorite tunes</Text>
            <Text style={styles.searchPromptSub}>Search for songs, primary artists, or album soundtracks in English & Tamil.</Text>

            <View style={styles.trendingContainer}>
              <Text style={styles.trendingTitle}>Trending Searches</Text>
              <View style={styles.trendingGrid}>
                {['Master Tamil', 'Kutti Story', 'Tamil Love Beats', 'Blinding Lights', 'English Pop Hits'].map((term) => (
                  <TouchableOpacity
                    key={term}
                    onPress={() => {
                      setSearchQuery(term);
                      handleSearchSubmit(term);
                    }}
                    style={styles.trendingTag}
                  >
                    <Text style={styles.trendingTagText}>{term}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        )}
      </View>
    );
  };

  // 3. LIBRARY VIEW
  const renderLibrary = () => {
    const handleCreatePlaylistInline = async () => {
      if (newPlaylistName.trim() === '') return;
      await createPlaylist(newPlaylistName);
      setNewPlaylistName('');
      setShowAddPlaylistInput(false);
    };

    // If viewing a specific playlist details
    if (activePlaylistId) {
      const playlist = playlists.find((p) => p.id === activePlaylistId);
      if (!playlist) {
        setActivePlaylistId(null);
        return null;
      }

      return (
        <View style={styles.viewContainer}>
          {/* Playlist Detail Header */}
          <View style={styles.playlistDetailHeader}>
            <TouchableOpacity onPress={() => setActivePlaylistId(null)} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Library</Text>
            </TouchableOpacity>
            <View style={styles.playlistDetailMeta}>
              <View style={styles.playlistBigArt}>
                <Music size={40} color={COLORS.textSecondary} />
              </View>
              <View style={styles.playlistDetailText}>
                <Text style={styles.playlistDetailName}>{playlist.name}</Text>
                <Text style={styles.playlistDetailCount}>{playlist.tracks.length} songs</Text>
              </View>
              <TouchableOpacity
                onPress={async () => {
                  await deletePlaylist(playlist.id);
                  setActivePlaylistId(null);
                }}
                style={styles.playlistDeleteButton}
              >
                <Trash2 size={20} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Playlist Tracks List */}
          <FlatList
            data={playlist.tracks}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainerContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Music size={40} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>This playlist is empty.</Text>
                <TouchableOpacity
                  onPress={() => setActiveTab('search')}
                  style={styles.emptySearchButton}
                >
                  <Text style={styles.emptySearchButtonText}>Search for Songs</Text>
                </TouchableOpacity>
              </View>
            }
            renderItem={({ item }) => (
              <TrackItem
                track={item}
                isActive={currentTrack?.id === item.id}
                isPlaying={isPlaying && currentTrack?.id === item.id}
                isDownloaded={downloadedTracks.some((t: Track) => t.id === item.id)}
                onPress={(t: Track) => handlePlaySong(t, playlist.tracks)}
                onMenuPress={(t: Track) => handleOpenActionMenu(t)}
              />
            )}
          />
        </View>
      );
    }

    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>Your Library</Text>

        {/* Offline Switch Card */}
        <View style={styles.offlineToggleCard}>
          <View style={styles.offlineToggleInfo}>
            <WifiOff size={22} color={offlineMode ? COLORS.secondary : COLORS.textSecondary} />
            <View style={styles.offlineToggleTextWrapper}>
              <Text style={styles.offlineToggleHeading}>Offline Mode Only</Text>
              <Text style={styles.offlineToggleDesc}>Play cached/downloaded songs without data.</Text>
            </View>
          </View>
          <Switch
            value={offlineMode}
            onValueChange={setOfflineMode}
            trackColor={{ false: '#2A2A3C', true: COLORS.primary }}
            thumbColor={COLORS.text}
          />
        </View>

        {/* Playlists Section */}
        <View style={styles.librarySection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Playlists</Text>
            <TouchableOpacity
              onPress={() => setShowAddPlaylistInput(!showAddPlaylistInput)}
              style={styles.addPlaylistIconBtn}
            >
              <Plus size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {/* Playlist Input Form */}
          {showAddPlaylistInput && (
            <View style={styles.inlineCreateForm}>
              <TextInput
                style={styles.inlineInput}
                placeholder="Enter playlist name..."
                placeholderTextColor={COLORS.textMuted}
                value={newPlaylistName}
                onChangeText={setNewPlaylistName}
                autoFocus
              />
              <View style={styles.inlineFormBtns}>
                <TouchableOpacity
                  onPress={() => setShowAddPlaylistInput(false)}
                  style={styles.inlineCancelBtn}
                >
                  <Text style={styles.inlineCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCreatePlaylistInline}
                  style={styles.inlineSaveBtn}
                >
                  <Text style={styles.inlineSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {playlists.length === 0 ? (
            <View style={styles.libraryEmptyState}>
              <FolderOpen size={30} color={COLORS.textMuted} />
              <Text style={styles.libraryEmptyText}>No custom playlists yet.</Text>
            </View>
          ) : (
            playlists.map((playlist) => (
              <TouchableOpacity
                key={playlist.id}
                onPress={() => setActivePlaylistId(playlist.id)}
                style={styles.playlistRowItem}
              >
                <View style={styles.playlistRowArt}>
                  <Music size={18} color={COLORS.text} />
                </View>
                <View style={styles.playlistRowInfo}>
                  <Text style={styles.playlistRowName}>{playlist.name}</Text>
                  <Text style={styles.playlistRowCount}>{playlist.tracks.length} songs</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Offline Downloads Section */}
        <View style={styles.librarySection}>
          <Text style={styles.sectionTitle}>Downloads (Offline)</Text>
          {downloadedTracks.length === 0 ? (
            <View style={styles.libraryEmptyState}>
              <Download size={30} color={COLORS.textMuted} />
              <Text style={styles.libraryEmptyText}>No downloaded songs. Search and cache to listen offline.</Text>
            </View>
          ) : (
            downloadedTracks.map((track) => (
              <TrackItem
                key={`dl-${track.id}`}
                track={track}
                isActive={currentTrack?.id === track.id}
                isPlaying={isPlaying && currentTrack?.id === track.id}
                isDownloaded={true}
                onPress={(t: Track) => handlePlaySong(t, downloadedTracks)}
                onMenuPress={handleOpenActionMenu}
              />
            ))
          )}
        </View>

        {/* Favorites Section */}
        <View style={styles.librarySection}>
          <Text style={styles.sectionTitle}>Favorites</Text>
          {favorites.length === 0 ? (
            <View style={styles.libraryEmptyState}>
              <Heart size={30} color={COLORS.textMuted} />
              <Text style={styles.libraryEmptyText}>No favorite tracks. Heart songs to see them here.</Text>
            </View>
          ) : (
            favorites.map((track) => (
              <TrackItem
                key={`fav-${track.id}`}
                track={track}
                isActive={currentTrack?.id === track.id}
                isPlaying={isPlaying && currentTrack?.id === track.id}
                isDownloaded={downloadedTracks.some((t: Track) => t.id === track.id)}
                onPress={(t: Track) => handlePlaySong(t, favorites)}
                onMenuPress={handleOpenActionMenu}
              />
            ))
          )}
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      {/* Content Render Area */}
      <View style={styles.mainContent}>
        {activeTab === 'home' && renderHome()}
        {activeTab === 'search' && renderSearch()}
        {activeTab === 'library' && renderLibrary()}
      </View>

      {/* Floating Mini Player (only when a track exists) */}
      <MiniPlayer onPress={() => setIsFullPlayerVisible(true)} />

      {/* Custom Bottom Tab Navigation Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          onPress={() => {
            setActiveTab('home');
            setActivePlaylistId(null);
          }}
          activeOpacity={0.7}
          style={styles.tabButton}
        >
          <HomeIcon size={22} color={activeTab === 'home' ? COLORS.primary : COLORS.textSecondary} />
          <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setActiveTab('search');
            setActivePlaylistId(null);
          }}
          activeOpacity={0.7}
          style={styles.tabButton}
        >
          <SearchIcon size={22} color={activeTab === 'search' ? COLORS.primary : COLORS.textSecondary} />
          <Text style={[styles.tabLabel, activeTab === 'search' && styles.tabLabelActive]}>Search</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setActiveTab('library');
            setActivePlaylistId(null);
          }}
          activeOpacity={0.7}
          style={styles.tabButton}
        >
          <LibraryIcon size={22} color={activeTab === 'library' ? COLORS.primary : COLORS.textSecondary} />
          <Text style={[styles.tabLabel, activeTab === 'library' && styles.tabLabelActive]}>Library</Text>
        </TouchableOpacity>
      </View>

      {/* 1. Full Player Modal Overlay */}
      <FullPlayer visible={isFullPlayerVisible} onClose={() => setIsFullPlayerVisible(false)} />

      {/* 2. Playlist Selection Modal Selector */}
      <PlaylistModal
        visible={isPlaylistModalVisible}
        onClose={() => {
          setIsPlaylistModalVisible(false);
          setSelectedTrack(null);
        }}
        track={selectedTrack}
      />

      {/* 3. Global Song Actions Bottom Drawer Sheet (Modal representation) */}
      {selectedTrack && (
        <Modal
          visible={isActionMenuVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsActionMenuVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setIsActionMenuVisible(false)}>
            <View style={styles.drawerOverlay}>
              <View style={styles.drawerContainer}>
                {/* Track mini details */}
                <View style={styles.drawerHeader}>
                  <Image source={{ uri: selectedTrack.image }} style={styles.drawerArt} />
                  <View style={styles.drawerDetails}>
                    <Text numberOfLines={1} style={styles.drawerTitle}>{selectedTrack.title}</Text>
                    <Text numberOfLines={1} style={styles.drawerArtist}>{selectedTrack.artist}</Text>
                  </View>
                </View>

                {/* Actions Items */}
                <View style={styles.drawerContent}>
                  <TouchableOpacity onPress={handleAddToQueue} style={styles.drawerItem}>
                    <Music size={20} color={COLORS.text} style={styles.drawerItemIcon} />
                    <Text style={styles.drawerItemText}>Add to Up Next Queue</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={handleAddToPlaylistAction} style={styles.drawerItem}>
                    <Plus size={20} color={COLORS.text} style={styles.drawerItemIcon} />
                    <Text style={styles.drawerItemText}>Add to Playlist...</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={handleToggleFavoriteAction} style={styles.drawerItem}>
                    <Heart
                      size={20}
                      color={favorites.some(t => t.id === selectedTrack.id) ? COLORS.primary : COLORS.text}
                      fill={favorites.some(t => t.id === selectedTrack.id) ? COLORS.primary : 'transparent'}
                      style={styles.drawerItemIcon}
                    />
                    <Text style={styles.drawerItemText}>
                      {favorites.some(t => t.id === selectedTrack.id) ? 'Favorited' : 'Add to Favorites'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={handleDownloadAction} style={styles.drawerItem}>
                    {downloadedTracks.some(t => t.id === selectedTrack.id) ? (
                      <>
                        <Trash2 size={20} color={COLORS.error} style={styles.drawerItemIcon} />
                        <Text style={[styles.drawerItemText, { color: COLORS.error }]}>Delete Cache</Text>
                      </>
                    ) : (
                      <>
                        <Download size={20} color={COLORS.text} style={styles.drawerItemIcon} />
                        <Text style={styles.drawerItemText}>Download Offline</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setIsActionMenuVisible(false)}
                    style={[styles.drawerItem, styles.drawerCloseItem]}
                  >
                    <Text style={styles.drawerCloseText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </SafeAreaView>
  );
};

// Top level entry point wrapping state provider
export default function App() {
  return (
    <MusicProvider>
      <MainApp />
    </MusicProvider>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  mainContent: {
    flex: 1,
    paddingBottom: 68, // Account for floating mini player height
  },
  viewContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 100, // Safe padding for bottom items
  },
  screenTitle: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: SPACING.lg,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
    marginTop: SPACING.sm,
  },
  greetingText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  userNameText: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 2,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    borderColor: 'rgba(236, 72, 153, 0.2)',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  offlineBannerText: {
    color: COLORS.text,
    fontSize: 13,
    marginLeft: SPACING.sm,
    fontWeight: '500',
  },
  sectionContainer: {
    marginVertical: SPACING.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  seeAllLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
    marginRight: 4,
  },
  shortcutGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  shortcutCard: {
    flex: 0.48,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    padding: SPACING.md,
    height: 64,
  },
  shortcutIcon: {
    marginRight: SPACING.sm,
  },
  shortcutTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  shortcutSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  horizontalList: {
    paddingRight: SPACING.lg,
  },
  recentCard: {
    width: 110,
    marginRight: SPACING.md,
  },
  recentCardImage: {
    width: 110,
    height: 110,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.sm,
  },
  recentCardTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  recentCardArtist: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  artistRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  artistChip: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.round,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    margin: 4,
  },
  artistChipText: {
    color: COLORS.text,
    fontSize: 13,
  },
  // Tab Bar Styles
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 56,
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    justifyContent: 'space-around',
    alignItems: 'center',
    elevation: 8,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xs,
    width: 60,
  },
  tabLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginTop: 4,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  // Search Styles
  searchHeader: {
    padding: SPACING.lg,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.02)',
  },
  listContainerContent: {
    paddingHorizontal: SPACING.sm,
    paddingTop: SPACING.sm,
    paddingBottom: 120, // Pad for bottom sheet
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: SPACING.md,
  },
  searchPromptContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
    paddingBottom: 150,
  },
  searchPromptHeading: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  searchPromptSub: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.xxl,
  },
  trendingContainer: {
    width: '100%',
    marginTop: SPACING.xl,
  },
  trendingTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  trendingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  trendingTag: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    margin: 4,
  },
  trendingTagText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  // Library Styles
  offlineToggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderColor: COLORS.border,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
  },
  offlineToggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.md,
  },
  offlineToggleTextWrapper: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  offlineToggleHeading: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  offlineToggleDesc: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  librarySection: {
    marginBottom: SPACING.xl,
  },
  addPlaylistIconBtn: {
    padding: SPACING.xs,
  },
  inlineCreateForm: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  inlineInput: {
    backgroundColor: COLORS.surfaceLight,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    color: COLORS.text,
    padding: SPACING.sm,
    fontSize: 14,
    marginBottom: SPACING.sm,
  },
  inlineFormBtns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  inlineCancelBtn: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    marginRight: SPACING.sm,
  },
  inlineCancelText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  inlineSaveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
  },
  inlineSaveText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  libraryEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    borderRadius: BORDER_RADIUS.md,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  libraryEmptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 18,
  },
  playlistRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.02)',
  },
  playlistRowArt: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    borderColor: COLORS.border,
    borderWidth: 1,
  },
  playlistRowInfo: {
    flex: 1,
  },
  playlistRowName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  playlistRowCount: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  // Playlist Detail Screen
  playlistDetailHeader: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    marginBottom: SPACING.md,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  playlistDetailMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playlistBigArt: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  playlistDetailText: {
    flex: 1,
  },
  playlistDetailName: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: 'bold',
  },
  playlistDetailCount: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  playlistDeleteButton: {
    padding: SPACING.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyText: {
    color: COLORS.textMuted,
    marginTop: SPACING.md,
    fontSize: 14,
  },
  emptySearchButton: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
  },
  emptySearchButtonText: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 13,
  },
  // Bottom Drawer Actions Menu
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  drawerContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  drawerArt: {
    width: 50,
    height: 50,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.md,
    backgroundColor: COLORS.surfaceLight,
  },
  drawerDetails: {
    flex: 1,
  },
  drawerTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  drawerArtist: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  drawerContent: {
    paddingBottom: SPACING.xl,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.01)',
  },
  drawerItemIcon: {
    marginRight: SPACING.lg,
  },
  drawerItemText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '500',
  },
  drawerCloseItem: {
    borderBottomWidth: 0,
    justifyContent: 'center',
    marginTop: SPACING.sm,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.md,
  },
  drawerCloseText: {
    color: COLORS.textSecondary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  spotifyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    marginTop: SPACING.xs,
  },
  spotifyGridCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48.5%',
    height: 56,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  spotifyGridImage: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spotifyGridTitle: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: 'bold',
    flex: 1,
    paddingHorizontal: SPACING.sm,
  },
  artistCircleCard: {
    alignItems: 'center',
    marginRight: SPACING.lg,
    width: 76,
  },
  artistCircleAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  artistInitials: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  artistCircleName: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  vibeCard: {
    width: 130,
    marginRight: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm,
  },
  vibeCardImage: {
    width: '100%',
    height: 100,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  vibeCardIcon: {
    fontSize: 32,
  },
  vibeCardTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  vibeCardSub: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.02)',
    backgroundColor: COLORS.background,
  },
  categoryBackButton: {
    marginRight: SPACING.md,
    padding: SPACING.xs,
  },
  categoryHeaderTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  playActionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  categoryMetaText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  categorySubMetaText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  playActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shufflePlayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryPlayButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

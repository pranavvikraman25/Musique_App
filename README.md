# 🎵 Harmony: Premium Free Music App (Expo & React Native)

Welcome to **Harmony**, a premium music streaming and downloading application built with React Native and Expo. This app is designed to deliver a completely free, ad-free music listening experience for English and Tamil songs, with offline support, queue management, and playlist curation.

This repository serves as a practical, step-by-step learning resource for mobile application development.

---

## 🚀 Key Features

*   **Free Streaming**: Stream millions of high-quality (up to 320kbps) English and Tamil songs.
*   **Offline Mode**: Download songs directly to your device and play them anytime without internet connection.
*   **Search**: Dynamic search for songs, albums, and playlists.
*   **Queue Management**: Queue up songs, re-arrange playback order, and toggle shuffle or repeat modes.
*   **Custom Playlists**: Create custom collections of your favorite songs stored locally.
*   **Premium Dark UI**: A gorgeous, fluid, modern dark-themed interface built using Expo's styling system and smooth transitions.

---

## 🏗️ Architecture & How It Works

The app operates on a decoupled services architecture:

```
                  ┌───────────────────────────┐
                  │          App.tsx          │
                  │   (Navigation & Entry)    │
                  └─────────────┬─────────────┘
                                │
                  ┌─────────────▼─────────────┐
                  │    MusicProvider (State)  │
                  └─────────────┬─────────────┘
                                │
      ┌─────────────────────────┼─────────────────────────┐
      ▼                         ▼                         ▼
┌───────────┐             ┌───────────┐             ┌───────────┐
│Search/UI  │             │   Audio   │             │Storage/FS │
│Components │             │  Service  │             │  Services │
└───────────┘             └─────┬─────┘             └─────┬─────┘
                                │                         │
                                ▼                         ▼
                          ┌───────────┐             ┌───────────┐
                          │  expo-av  │             │AsyncStor. │
                          │ (Playback)│             │& FileSys. │
                          └───────────┘             └───────────┘
```

1.  **State Manager (`MusicContext.tsx`)**: The central nervous system of our app. It maintains the current playing track, the track queue, search histories, playlist definitions, and download statuses.
2.  **API Service (`ApiService.ts`)**: Integrates with the unofficial JioSaavn API to fetch song metadata, albums, playlists, and raw audio stream links.
3.  **Audio Service (`AudioService.ts`)**: Harnesses Expo's native audio library `expo-av` to stream music. It interfaces with system volume, seek bars, and background playback triggers.
4.  **Local Storage Service (`StorageService.ts`)**: Utilizes `@react-native-async-storage/async-storage` to persist your search history, custom playlists, and favorite listings.
5.  **Download Manager (`DownloadManager.ts`)**: Uses `expo-file-system` to download track streams (`.mp4`/`.aac`) and cover art to the device filesystem. When a song is requested in offline mode, it plays the local file URI instead of streaming from the web.

---

## 📂 Project Structure Map

Here is the folder structure we are building:

```
├── App.tsx                    # Core app navigation and state provider wrapper
├── app.json                   # Expo config (App display name, bundle identifiers)
├── tsconfig.json              # TypeScript compilation rules
├── package.json               # Project dependencies and run scripts
└── src/
    ├── components/            # Reusable visual UI components
    │   ├── MiniPlayer.tsx     # Floating playback control bar at the bottom
    │   ├── FullPlayer.tsx     # Interactive full-screen player deck
    │   ├── TrackItem.tsx      # Individual song list element with action menus
    │   ├── PlaylistModal.tsx  # Modal to choose playlists for adding songs
    │   └── SearchBar.tsx      # Clean text input bar with debounce search
    ├── context/
    │   └── MusicContext.tsx   # Global player context & hook (state provider)
    ├── services/
    │   ├── ApiService.ts      # Handles network requests to JioSaavn API
    │   ├── AudioService.ts    # Plays/pauses, handles queue state
    │   ├── StorageService.ts  # Handles AsyncStorage read/writes
    │   └── DownloadManager.ts # Downloads audio files and stores locally
    └── styles/
        └── theme.ts           # Global color, layout, and font configuration
```

---

## 📚 Learning Path: Step-by-Step Breakdown

For your learning, we will build this app in logical phases:

### Phase 1: Context & Core UI Elements
We will set up our app's visual structure. We will create the global theme (`src/styles/theme.ts`) and create the primary views: **Home**, **Search**, and **Library** (where playlists and downloads live).

### Phase 2: Connecting the Music API (`ApiService.ts`)
We will connect our search input to the public API wrapper. We will write types to safely parse song objects (images, media streaming URLs, durations, and artists).

### Phase 3: The Audio Engine (`AudioService.ts` & `expo-av`)
We will configure `expo-av` to start playing direct audio stream URLs. We will link a slider component (`@react-native-community/slider`) to display the current progress of the song, allowing seeking (scrubbing).

### Phase 4: Local Playlists & Persistent Queue
We will build the logic to let users add songs to a queue and save custom playlists to AsyncStorage, making sure they persist even when the app is closed.

### Phase 5: Downloads & Offline Support (`DownloadManager.ts`)
We will implement the download button. The app will fetch the stream URL, write the binary data to the local disk using `expo-file-system`, and toggle between online stream links and local files depending on internet connectivity.

---

## 🛠️ How to Run the App (For Development)

Once we code the project, you can run it on your own device:

1.  **Install dependencies**:
    ```bash
    npm install
    ```
2.  **Start the Expo server**:
    ```bash
    npx expo start
    ```
3.  **Run on your phone**:
    *   Download the **Expo Go** app from the Google Play Store or Apple App Store.
    *   Scan the QR code printed in the terminal.

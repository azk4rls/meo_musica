import { create } from "zustand";

export type Track = {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  channelId?: string;
};

export type RepeatMode = "off" | "one" | "all";
export type ActiveTab = "upnext" | "lyrics" | "related";

type PlayerState = {
  currentTrack: Track | null;
  queue: Track[];
  history: Track[];
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  buffered: number;
  isBuffering: boolean;
  repeatMode: RepeatMode;
  shuffle: boolean;
  playbackRate: number;
  isPlayerOpen: boolean;
  activeTab: ActiveTab;
  pendingSeek: number | null;
};

type PlayerActions = {
  playTrack: (track: Track, queue?: Track[]) => void;
  skipNext: () => void;
  skipBack: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  seekTo: (time: number) => void;
  updateTime: (time: number, duration?: number, buffered?: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setBuffered: (buffered: number) => void;
  setBuffering: (isBuffering: boolean) => void;
  setMuted: (isMuted: boolean) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  setShuffle: (shuffle: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  togglePlayer: () => void;
  setQueue: (queue: Track[]) => void;
  setActiveTab: (tab: ActiveTab) => void;
};

type PlayerStore = PlayerState & PlayerActions;

const num = (v: number) => Math.max(0, Math.floor(v || 0));

const currentIndex = (state: PlayerState) =>
  state.currentTrack ? state.queue.findIndex((item) => item.id === state.currentTrack?.id) : -1;

const pickNextIndex = (state: PlayerState) => {
  if (!state.queue.length) return -1;
  const index = currentIndex(state);
  if (state.shuffle) {
    if (state.queue.length === 1) return 0;
    let random = Math.floor(Math.random() * state.queue.length);
    while (random === index) random = Math.floor(Math.random() * state.queue.length);
    return random;
  }
  if (index < 0) return 0;
  const next = index + 1;
  if (next < state.queue.length) return next;
  return state.repeatMode === "all" ? 0 : -1;
};

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentTrack: null,
  queue: [],
  history: [],
  isPlaying: false,
  isMuted: false,
  volume: 0.8,
  currentTime: 0,
  duration: 0,
  buffered: 0,
  isBuffering: false,
  repeatMode: "off",
  shuffle: false,
  playbackRate: 1,
  isPlayerOpen: false,
  activeTab: "upnext",
  pendingSeek: null,

  playTrack: (track, queue) =>
    set((state) => {
      const nextQueue = queue?.length ? queue : state.queue.length ? state.queue : [track];
      const nextTrack = nextQueue.find((item) => item.id === track.id) ?? track;
      const nextHistory =
        state.currentTrack && state.currentTrack.id !== nextTrack.id
          ? [state.currentTrack, ...state.history].slice(0, 100)
          : state.history;
      return {
        currentTrack: nextTrack,
        queue: nextQueue,
        history: nextHistory,
        isPlaying: true,
        isPlayerOpen: true,
        currentTime: 0,
        duration: 0,
        buffered: 0,
      };
    }),
  skipNext: () =>
    set((state) => {
      if (!state.currentTrack || !state.queue.length) return state;
      if (state.repeatMode === "one") return { currentTime: 0, isPlaying: true };
      let nextIdx = pickNextIndex(state);
      if (nextIdx < 0) nextIdx = 0;
      const next = state.queue[nextIdx];
      return {
        currentTrack: next,
        history: [state.currentTrack, ...state.history].slice(0, 100),
        isPlaying: true,
        currentTime: 0,
        duration: 0,
        buffered: 0,
      };
    }),
  skipBack: () =>
    set((state) => {
      if (!state.currentTrack) return state;
      if (state.currentTime > 3) return { currentTime: 0, isPlaying: true };
      if (state.history.length) {
        const [prev, ...rest] = state.history;
        return {
          currentTrack: prev,
          history: rest,
          isPlaying: true,
          currentTime: 0,
          duration: 0,
          buffered: 0,
        };
      }
      return { currentTime: 0, isPlaying: true };
    }),
  nextTrack: () => get().skipNext(),
  prevTrack: () => get().skipBack(),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setVolume: (volume) =>
    set({
      volume: Math.min(1, Math.max(0, Number.isFinite(volume) ? volume : 0.8)),
      isMuted: false,
    }),
  seekTo: (time) => set({ currentTime: num(time), pendingSeek: num(time) }),
  updateTime: (time, duration, buffered) =>
    set((state) => ({
      currentTime: num(time),
      duration: duration !== undefined ? num(duration) : state.duration,
      buffered: buffered !== undefined ? num(buffered) : state.buffered,
    })),
  setCurrentTime: (time) => set({ currentTime: num(time) }),
  setDuration: (duration) => set({ duration: num(duration) }),
  setBuffered: (buffered) => set({ buffered: num(buffered) }),
  setBuffering: (isBuffering) => set({ isBuffering }),
  setMuted: (isMuted) => set({ isMuted }),
  setRepeatMode: (repeatMode) => set({ repeatMode }),
  setShuffle: (shuffle) => set({ shuffle }),
  setPlaybackRate: (playbackRate) => set({ playbackRate }),
  togglePlayer: () => set((state) => ({ isPlayerOpen: !state.isPlayerOpen })),
  setQueue: (queue) =>
    set((state) => ({
      queue,
      currentTrack:
        state.currentTrack && queue.some((t) => t.id === state.currentTrack?.id)
          ? state.currentTrack
          : queue[0] ?? null,
    })),
  setActiveTab: (activeTab) => set({ activeTab }),
}));

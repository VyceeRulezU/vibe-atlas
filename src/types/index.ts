export type Mood = 'calm' | 'loud' | 'warm' | 'lonely' | 'bright';

export type FetchStatus = 'idle' | 'loading' | 'success' | 'error';

export interface VibeImage {
  id:          string;
  url:         string;         // full-resolution src
  thumbUrl?:   string;         // low-res placeholder
  width:       number;
  height:      number;
  photographer?: string;       // attribution (if available)
  sourceUrl?:  string;         // link back to original
}

export interface MoodConfig {
  label:      string;
  seedRange:  [number, number];
  effects:    string[];
}

export type MoodConfigMap = Record<Mood, MoodConfig>;

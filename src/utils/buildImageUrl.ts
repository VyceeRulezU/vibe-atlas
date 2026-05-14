import type { Mood, MoodConfigMap } from '../types';

export const MOOD_CONFIG: MoodConfigMap = {
  calm:   { label: 'Calm',   seedRange: [10,  50],  effects: ['grayscale', 'blur=1'] },
  loud:   { label: 'Loud',   seedRange: [200, 250], effects: [] },
  warm:   { label: 'Warm',   seedRange: [100, 140], effects: [] },
  lonely: { label: 'Lonely', seedRange: [500, 540], effects: ['grayscale'] },
  bright: { label: 'Bright', seedRange: [300, 340], effects: [] },
};

const CARD_WIDTH  = 600;
const CARD_HEIGHT = 800;

export function buildImageUrl(
  mood:    Mood,
  index:   number,   // 0–4 for the five cards
  shuffle: number = 0  // offset to generate fresh sets
): string {
  const config = MOOD_CONFIG[mood];
  const [min, max] = config.seedRange;
  const range = max - min;
  const seed  = min + ((index + shuffle * 5) % range);

  const base    = `https://picsum.photos/seed/${seed}/${CARD_WIDTH}/${CARD_HEIGHT}`;
  const effects = config.effects.length > 0
    ? `?${config.effects.join('&')}`
    : '';

  return `${base}${effects}`;
}

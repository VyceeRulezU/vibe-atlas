import { useState, useRef, useCallback, useEffect } from 'react';
import { Mood, FetchStatus, VibeImage } from '../types';
import { buildImageUrl } from '../utils/buildImageUrl';

export function useVibeImages() {
  const [status, setStatus] = useState<FetchStatus>('idle');
  const [images, setImages] = useState<VibeImage[]>([]);
  const [activeMood, setActiveMood] = useState<Mood | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [shuffleIndex, setShuffleIndex] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  const isFetchingRef = useRef<boolean>(false);
  const currentFetchRef = useRef<{ mood: Mood; shuffle: number } | null>(null);

  const fetchImages = useCallback(async (mood: Mood, shuffle: number) => {
    // Dedup: ignore if the exact same (mood, shuffle) is already in-flight
    if (
      isFetchingRef.current &&
      currentFetchRef.current &&
      mood === currentFetchRef.current.mood &&
      shuffle === currentFetchRef.current.shuffle
    ) {
      return;
    }

    // Abort previous in-flight fetch
    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;
    currentFetchRef.current = { mood, shuffle };
    isFetchingRef.current = true;
    setStatus('loading');
    setError(null);

    try {
      const fetchPromises = Array.from({ length: 5 }, (_, i) => {
        const url = buildImageUrl(mood, i, shuffle);
        return fetch(url, { signal: controller.signal });
      });

      const results = await Promise.allSettled(fetchPromises);

      // If this batch was aborted, bail silently — another fetch took over
      if (controller.signal.aborted) return;

      const successfulImages: VibeImage[] = results.map((result, i) => {
        if (result.status === 'fulfilled' && result.value.ok) {
          return {
            id: `${mood}-${shuffle}-${i}`,
            url: result.value.url,
            width: 600,
            height: 800
          };
        }
        return {
          id: `${mood}-${shuffle}-${i}-failed`,
          url: '',
          width: 600,
          height: 800
        };
      });

      // Surface a global error only when all 5 genuinely failed (not aborted)
      const allFailed = results.every(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.ok));
      if (allFailed) {
        throw new Error('All image requests failed.');
      }

      setImages(successfulImages);
      setStatus('success');
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setError(err);
      setStatus('error');
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  const setMood = useCallback((mood: Mood) => {
    if (mood === activeMood && status === 'loading') return;
    
    if (mood === activeMood) {
      setShuffleIndex(prev => prev + 1);
    } else {
      setActiveMood(mood);
      setShuffleIndex(0);
    }
  }, [activeMood, status]);

  const retry = useCallback(() => {
    if (activeMood) {
      fetchImages(activeMood, shuffleIndex);
    }
  }, [activeMood, shuffleIndex, fetchImages]);

  // Effect to trigger fetch when mood or shuffle changes
  useEffect(() => {
    if (activeMood) {
      fetchImages(activeMood, shuffleIndex);
    }
    return () => abortRef.current?.abort();
  }, [activeMood, shuffleIndex, fetchImages]);

  return {
    status,
    images,
    activeMood,
    error,
    setMood,
    retry
  };
}

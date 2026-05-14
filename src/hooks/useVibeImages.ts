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

  const fetchImages = useCallback(async (mood: Mood, shuffle: number) => {
    // Deduplication logic
    if (isFetchingRef.current && mood === activeMood && shuffle === shuffleIndex) {
      return;
    }

    // Abort previous fetch if it's a different mood or a forced retry/shuffle
    if (abortRef.current) {
      abortRef.current.abort();
    }

    abortRef.current = new AbortController();
    isFetchingRef.current = true;
    setStatus('loading');
    setError(null);

    try {
      // Create 5 fetch promises for the images
      const fetchPromises = Array.from({ length: 5 }, (_, i) => {
        const url = buildImageUrl(mood, i, shuffle);
        return fetch(url, { signal: abortRef.current?.signal });
      });

      const results = await Promise.allSettled(fetchPromises);
      
      const successfulImages: VibeImage[] = results.map((result, i) => {
        if (result.status === 'fulfilled' && result.value.ok) {
          return {
            id: `${mood}-${shuffle}-${i}`,
            url: result.value.url,
            width: 600,
            height: 800
          };
        }
        // Fallback for failed individual images is handled in ImageCard component,
        // but here we mark it as a potential error slot if needed.
        // For now, we return a shell that the component will handle.
        return {
          id: `${mood}-${shuffle}-${i}-failed`,
          url: '', // Empty URL triggers error state in ImageCard
          width: 600,
          height: 800
        };
      });

      // If all failed, we might want to surface a global error
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
  }, [activeMood, shuffleIndex]);

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

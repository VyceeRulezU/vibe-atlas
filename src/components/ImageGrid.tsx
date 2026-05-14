import { FetchStatus, VibeImage, Mood } from '../types';
import { ImageCard } from './ImageCard';
import { SkeletonCard } from './SkeletonCard';
import { ErrorState } from './ErrorState';
import '../styles/ImageGrid.css';

interface ImageGridProps {
  status: FetchStatus;
  images: VibeImage[];
  onRetry: () => void;
  activeMood: Mood | null;
  errorMessage?: string;
}

export const ImageGrid = ({ status, images, onRetry, activeMood, errorMessage }: ImageGridProps) => {
  if (status === 'idle') {
    return (
      <div className="empty-state fade-in">
        <h3 className="empty-title">SELECT A MOOD TO BEGIN</h3>
        <p className="empty-subtitle">CURATING FROM THE OPEN ARCHIVE</p>
      </div>
    );
  }

  if (status === 'error') {
    return <ErrorState onRetry={onRetry} message={errorMessage} />;
  }

  return (
    <div className="image-grid">
      {status === 'loading'
        ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={`skeleton-${i}`} />)
        : images.map((image) => (
            <ImageCard 
              key={image.id} 
              image={image} 
              mood={activeMood || 'unknown'} 
            />
          ))}
    </div>
  );
};

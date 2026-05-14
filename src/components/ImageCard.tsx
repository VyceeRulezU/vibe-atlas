import { useState } from 'react';
import { VibeImage } from '../types';
import '../styles/ImageCard.css';

interface ImageCardProps {
  image: VibeImage;
  mood: string;
}

export const ImageCard = ({ image, mood }: ImageCardProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (hasError || !image.url) {
    return (
      <div className="image-card">
        <div className="image-error">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
          </svg>
          <span>IMAGE UNAVAILABLE</span>
        </div>
      </div>
    );
  }

  return (
    <div className="image-card fade-in">
      <img
        src={image.url}
        alt={`${mood} mood aesthetic`}
        className={isLoaded ? 'loaded' : ''}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        loading="lazy"
      />
      <div className="image-overlay">
        <span>{mood.toUpperCase()} ARCHIVE</span>
        {image.photographer && (
          <a 
            href={image.sourceUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="attribution"
          >
            BY {image.photographer.toUpperCase()}
          </a>
        )}
      </div>
    </div>
  );
};

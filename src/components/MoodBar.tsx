import { Mood } from '../types';
import '../styles/MoodBar.css';

interface MoodBarProps {
  onMoodSelect: (mood: Mood) => void;
  activeMood: Mood | null;
  isLoading: boolean;
}

const MOODS: Mood[] = ['calm', 'loud', 'warm', 'lonely', 'bright'];

export const MoodBar = ({ onMoodSelect, activeMood, isLoading }: MoodBarProps) => {
  return (
    <nav className="mood-bar">
      {MOODS.map((mood) => (
        <button
          key={mood}
          className={`mood-button ${activeMood === mood ? 'active' : ''}`}
          onClick={() => onMoodSelect(mood)}
          disabled={isLoading && activeMood === mood}
          aria-pressed={activeMood === mood}
        >
          {mood}
        </button>
      ))}
    </nav>
  );
};

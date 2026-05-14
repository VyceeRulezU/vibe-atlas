import { useVibeImages } from './hooks/useVibeImages';
import { MoodBar } from './components/MoodBar';
import { ImageGrid } from './components/ImageGrid';
import './styles/global.css';

function App() {
  const { status, images, activeMood, error, setMood, retry } = useVibeImages();

  return (
    <div className="container">
      <header>
        <h1>The Vibe Atlas</h1>
      </header>
      
      <main>
        <MoodBar 
          onMoodSelect={setMood} 
          activeMood={activeMood} 
          isLoading={status === 'loading'} 
        />
        
        <ImageGrid 
          status={status} 
          images={images} 
          onRetry={retry} 
          activeMood={activeMood}
          errorMessage={error?.message}
        />
      </main>
      
      <footer style={{ marginTop: 'var(--space-2xl)', textAlign: 'center', color: 'var(--color-muted)', fontSize: '0.7rem' }}>
        <p>© 2024 VIBE ATLAS ARCHIVE — IMAGES VIA PICSUM PHOTOS</p>
      </footer>
    </div>
  );
}

export default App;

import { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import AboutPage from './pages/AboutPage';
import HomePage from './pages/HomePage';
import PredictorPage from './pages/PredictorPage';
import ReportsPage from './pages/ReportsPage';
import RiskAnalysisPage from './pages/RiskAnalysisPage';
import SymptomCheckerPage from './pages/SymptomCheckerPage';
import type { Page } from './types';

function App() {
  const [page, setPage] = useState<Page>('home');
  const [latestPredictionId, setLatestPredictionId] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  useEffect(() => {
    document.title =
      page === 'home'
        ? 'AI powered medicial diagnosis assistant | AI Healthcare Disease Prediction'
        : `AI powered medicial diagnosis assistant | ${page
            .split('-')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ')}`;
  }, [page]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar current={page} onNavigate={setPage} />
      <main className="min-h-screen pl-0 md:pl-72">
        {page === 'home' && <HomePage onNavigate={setPage} />}
        {page === 'predictor' && (
          <PredictorPage
            onNavigate={setPage}
            onPredictionSaved={id => {
              setLatestPredictionId(id);
              setPage('reports');
            }}
          />
        )}
        {page === 'symptom-checker' && <SymptomCheckerPage onNavigate={setPage} />}
        {page === 'risk-analysis' && <RiskAnalysisPage onNavigate={setPage} />}
        {page === 'reports' && (
          <ReportsPage latestPredictionId={latestPredictionId} onNavigate={setPage} />
        )}
        {page === 'about' && <AboutPage />}
      </main>
    </div>
  );
}

export default App;

import { Routes, Route } from 'react-router-dom';
import HeroPage from './pages/HeroPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SuccessPage from './pages/SuccessPage.jsx';
import RepositoriesPage from './pages/RepositoriesPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import ActivityPage from './pages/ActivityPage.jsx';
import RepoComparisonPage from './pages/RepoComparisonPage.jsx';
import DeepAnalysisPage from './pages/DeepAnalysisPage.jsx';
import ErrorTrackingPage from './pages/ErrorTrackingPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HeroPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/success" element={<SuccessPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/activity" element={<ActivityPage />} />
      <Route path="/repo-comparison" element={<RepoComparisonPage />} />
      <Route path="/analysis" element={<DeepAnalysisPage />} />
      <Route path="/errors" element={<ErrorTrackingPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/repositories" element={<RepositoriesPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;

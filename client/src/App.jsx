import { Routes, Route, Navigate } from 'react-router-dom';
import HeroPage from './pages/HeroPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SuccessPage from './pages/SuccessPage.jsx';
import RepositoriesPage from './pages/RepositoriesPage.jsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HeroPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/success" element={<SuccessPage />} />
      <Route path="/repositories" element={<RepositoriesPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

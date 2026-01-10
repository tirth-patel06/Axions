import { useEffect, useState } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { api } from '../lib/api';

export default function PrivateRoute({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const location = useLocation();

  useEffect(() => {
    async function checkIfUserIsLoggedIn() {
      try {
        const response = await api.get('/api/test/me');
        
        if (response.data && response.data.user) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        setIsLoggedIn(false);
      }
    }

    checkIfUserIsLoggedIn();
  }, []);

  if (isLoggedIn === null) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (isLoggedIn === false) {
    return <Navigate to="/login" replace />;
  }

  if (children) {
    return children;
  }

  return <Outlet />;
}

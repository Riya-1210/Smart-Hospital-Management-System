import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const handleHome = () => {
    if (!isAuthenticated) { navigate('/'); return; }
    const role = user?.role || 'admin';
    navigate(`/${role}/dashboard`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white">
      <div className="text-center max-w-md">
        <div className="text-7xl font-bold text-primary-200 mb-2">404</div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Page Not Found</h1>
        <p className="text-neutral-600 text-sm mb-8">
          The page you're looking for doesn't exist or you may not have access to it.
        </p>
        <button
          onClick={handleHome}
          className="btn-primary"
        >
          {isAuthenticated ? '← Back to Dashboard' : '← Back to Home'}
        </button>
      </div>
    </div>
  );
}

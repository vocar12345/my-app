import { useAuth } from '@/context/AuthContext';
import { Outlet, Link } from 'react-router-dom';

const RootLayout = () => {
  const { logout, user } = useAuth();
  
  return (
    <div className="w-full md:flex">
      {/* This is a placeholder for a real sidebar or topbar */}
      <header className="w-full p-4 bg-gray-800 text-white flex justify-between items-center">
        <div>
          <Link to="/" className="text-xl font-bold">PawsGram</Link>
          <Link to="/create-post" className="ml-4">Create Post</Link>
        </div>
        <div>
          <span className="mr-4">Welcome, {user?.username}!</span>
          <button onClick={logout} className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-md">
            Logout
          </button>
        </div>
      </header>

      {/* This will render the actual page content (Home, CreatePost, etc.) */}
      <main className="flex flex-1 h-full p-4">
        <Outlet />
      </main>
    </div>
  );
};

export default RootLayout;
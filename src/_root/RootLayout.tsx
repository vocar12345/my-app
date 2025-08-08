import { useAuth } from '@/context/AuthContext';
import { Outlet, Link } from 'react-router-dom';

const RootLayout = () => {
  const { logout, user } = useAuth();
  
  return (
    // The main layout is now a single column
    <div className="w-full flex flex-col">
      <header className="w-full p-4 bg-gray-800 text-white flex justify-between items-center shadow-md sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-2xl font-bold">PawsGram</Link>
          <Link to="/create-post" className="hover:underline">Create Post</Link>
          <Link to="/saved" className="hover:underline">Saved Posts</Link>
        </div>
        <div className="flex items-center gap-4">
          {/* --- NEW "MY PROFILE" LINK --- */}
          {user && (
            <Link to={`/profile/${user.username}`} className="font-semibold hover:underline">
              My Profile
            </Link>
          )}
          <span className="text-gray-500">|</span>
          <button onClick={logout} className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-semibold">
            Logout
          </button>
        </div>
      </header>

      {/* The <main> tag now centers its content horizontally */}
      <main className="flex flex-1 w-full justify-center overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default RootLayout;
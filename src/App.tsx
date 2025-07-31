import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import AuthLayout from './_auth/AuthLayout';
import SignInForm from './_auth/forms/SignInForm';
import SignUpForm from './_auth/forms/SignUpForm';

import RootLayout from './_root/RootLayout';
import { Home, CreatePost } from './_root/pages'; // Import CreatePost

const App = () => {
  const { isAuthenticated } = useAuth();

  return (
    <main className="flex h-screen">
      <Routes>
        {/* Public routes */}
        <Route element={<AuthLayout />}>
          <Route path="/sign-in" element={<SignInForm />} />
          <Route path="/sign-up" element={<SignUpForm />} />
        </Route>

        {/* Protected routes */}
        {isAuthenticated ? (
          <Route element={<RootLayout />}>
            <Route index element={<Home />} />
            <Route path="/create-post" element={<CreatePost />} /> {/* Add this new route */}
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/sign-in" replace />} />
        )}
      </Routes>
    </main>
  );
};

export default App;



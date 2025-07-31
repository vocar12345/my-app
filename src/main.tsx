import { StrictMode } from 'react'; 
import { createRoot } from 'react-dom/client'; 
import './App.css'; 
import App from './App'; 
import { BrowserRouter } from 'react-router-dom'; 
import { AuthProvider } from './context/AuthContext'; // Import the provider

const container = document.getElementById('root'); 
if (!container) throw new Error('Root container missing in index.html'); 

createRoot(container).render(
  <BrowserRouter> 
    <AuthProvider> {/* Wrap App with AuthProvider */}
      <StrictMode> 
        <App /> 
      </StrictMode>
    </AuthProvider>
  </BrowserRouter>
);

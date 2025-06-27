import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { PollPage } from './pages/PollPage';
import { CreatePollPage } from './pages/CreatePollPage';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { ProfilePage } from './pages/ProfilePage';
import { ProtectedRoute } from './components/ProtectedRoute';

// Simple test component to verify functionality
const TestComponent: React.FC = () => {
  const handleTestClick = () => {
    console.log('Test button clicked!');
    alert('Test button is working!');
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-lg font-bold mb-4">Test Component</h2>
      <button 
        onClick={handleTestClick}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Test Button
      </button>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/poll/:id" element={<PollPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/test" element={<TestComponent />} />
              <Route
                path="/create"
                element={
                  <ProtectedRoute>
                    <CreatePollPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App; 
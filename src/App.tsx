import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/components/general/ThemeProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { TourProvider } from '@/contexts/TourContext';
import { IBMQuantumProvider } from '@/contexts/IBMQuantumContext';
import ErrorBoundary from '@/components/general/ErrorBoundary';
import Landing from '@/pages/Landing';
import Workspace from '@/pages/Workspace';
import NotFound from '@/pages/NotFound';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <IBMQuantumProvider>
            <TourProvider>
              <Router>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/workspace" element={<Workspace />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Router>
            </TourProvider>
          </IBMQuantumProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';

// Import des pages (à créer)
import AccueilPage from './pages/AccueilPage';
import BibliotequePage from './pages/BibliotequePage';
import LecturesPage from './pages/LecturesPage';
import ParametresPage from './pages/ParametresPage';
import RapportsPage from './pages/RapportsPage';
import SuiviPage from './pages/SuiviPage';

import './App.css';

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Routes publiques */}
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginForm />} 
      />
      <Route 
        path="/register" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterForm />} 
      />

      {/* Routes protégées */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout>
            <AccueilPage />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/bibliotheque" element={
        <ProtectedRoute>
          <Layout>
            <BibliotequePage />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/lectures" element={
        <ProtectedRoute>
          <Layout>
            <LecturesPage />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/rapports" element={
        <ProtectedRoute>
          <Layout>
            <RapportsPage />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/parametres" element={
        <ProtectedRoute>
          <Layout>
            <ParametresPage />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/suivi" element={
        <ProtectedRoute requiredRoles={['enseignant', 'admin']}>
          <Layout>
            <SuiviPage />
          </Layout>
        </ProtectedRoute>
      } />

      {/* Route par défaut */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;

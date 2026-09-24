import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CustomerDashboard from './pages/CustomerDashboard';
import CreateTicketPage from './pages/CreateTicketPage';
import TicketDetailPage from './pages/TicketDetailPage';
import AgentDashboard from './pages/AgentDashboard';
import NotFoundPage from './pages/NotFoundPage';

// Default Index Redirector Component
const DefaultRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return user?.role === 'agent' ? <Navigate to="/agent/dashboard" replace /> : <Navigate to="/customer/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Root Navigation */}
              <Route path="/" element={<DefaultRedirect />} />

              {/* Customer Routes */}
              <Route
                path="/customer/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CustomerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/tickets/new"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CreateTicketPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tickets/new"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CreateTicketPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/tickets/:id"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <TicketDetailPage />
                  </ProtectedRoute>
                }
              />

              {/* Agent Routes */}
              <Route
                path="/agent/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['agent']}>
                    <AgentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agent/tickets"
                element={
                  <ProtectedRoute allowedRoles={['agent']}>
                    <AgentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agent/tickets/:id"
                element={
                  <ProtectedRoute allowedRoles={['agent']}>
                    <TicketDetailPage />
                  </ProtectedRoute>
                }
              />

              {/* Shared Protected Route */}
              <Route
                path="/tickets/:id"
                element={
                  <ProtectedRoute>
                    <TicketDetailPage />
                  </ProtectedRoute>
                }
              />

              {/* 404 Route */}
              <Route path="/404" element={<NotFoundPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

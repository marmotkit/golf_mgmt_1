import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Tournaments from './pages/Tournaments';
import Scores from './pages/Scores';
import Games from './pages/Games';
import Reports from './pages/Reports';
import Awards from './pages/Awards';
import { isAuthenticated } from './services/authService';

// 受保護的路由組件
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="members" element={<Members />} />
          <Route path="tournaments" element={<Tournaments />} />
          <Route path="scores" element={<Scores />} />
          <Route path="games" element={<Games />} />
          <Route path="reports" element={<Reports />} />
          <Route path="awards" element={<Awards />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

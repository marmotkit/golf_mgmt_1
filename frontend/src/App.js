import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Link } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppBar, Toolbar, Typography, Container, Box } from '@mui/material';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Tournaments from './pages/Tournaments';
import Scores from './pages/Scores';
import Reports from './pages/Reports';
import Games from './pages/Games';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#388e3c',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/members" element={<Members />} />
            <Route path="/tournaments" element={<Tournaments />} />
            <Route path="/scores" element={<Scores />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/games" element={<Games />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;

import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  Container,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  EmojiEvents as TournamentIcon,
  Score as ScoreIcon,
  Assessment as ReportIcon,
  SportsEsports as GameIcon,
  BarChart as BarChartIcon,
  EmojiEventsOutlined as AwardIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { logout } from '../services/authService';

const drawerWidth = 240;

const menuItems = [
  { text: '首頁', icon: <DashboardIcon />, path: '/' },
  { text: '會員管理', icon: <PeopleIcon />, path: '/members' },
  { text: '賽事管理', icon: <TournamentIcon />, path: '/tournaments' },
  { text: '成績管理', icon: <ScoreIcon />, path: '/scores' },
  { text: '獎項管理', icon: <AwardIcon />, path: '/awards' },
  { text: '報表分析', icon: <BarChartIcon />, path: '/reports' },
  { text: '歡樂賽場', icon: <GameIcon />, path: '/games' },
];

function Layout() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap>
          清大校友高爾夫
        </Typography>
      </Toolbar>
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => navigate(item.path)}
            selected={location.pathname === item.path}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem button onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="登出" />
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" noWrap component="div">
              {menuItems.find(item => item.path === location.pathname)?.text || '首頁'}
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ mr: 2 }}>
            {user.chinese_name || ''}
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Container maxWidth="lg">
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}

export default Layout;

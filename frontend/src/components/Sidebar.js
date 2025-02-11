import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Box, List, ListItem, ListItemIcon, ListItemText, Drawer, useTheme } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import GolfCourseIcon from '@mui/icons-material/GolfCourse';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import ScoreboardIcon from '@mui/icons-material/Scoreboard';
import BarChartIcon from '@mui/icons-material/BarChart';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

const menuItems = [
  {
    path: '/',
    icon: <DashboardIcon />,
    text: '首頁'
  },
  {
    path: '/members',
    icon: <PeopleIcon />,
    text: '會員管理'
  },
  {
    path: '/tournaments',
    icon: <GolfCourseIcon />,
    text: '賽事管理'
  },
  {
    path: '/scores',
    icon: <ScoreboardIcon />,
    text: '成績管理'
  },
  {
    path: '/awards',
    icon: <EmojiEventsIcon />,
    text: '獎項管理'
  },
  {
    path: '/reports',
    icon: <AssessmentIcon />,
    text: '報表分析'
  },
  {
    path: '/games',
    icon: <SportsEsportsIcon />,
    text: '歡樂賽場'
  }
];

// 在菜單項列表中添加獎項管理
{
  path: '/awards',
  icon: <EmojiEventsIcon />,
  text: '獎項管理'
}, 
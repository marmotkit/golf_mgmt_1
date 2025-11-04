import React, { useState, useEffect, useMemo } from 'react';
import { Container, Grid, Paper, Typography, Box, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import {
  People as PeopleIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
  GolfCourse as GolfCourseIcon,
  EmojiEvents as EmojiEventsIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  EmojiEvents as TrophyIcon
} from '@mui/icons-material';
import CheckIcon from '@mui/icons-material/Check';
import * as dashboardService from '../services/dashboardService';

const StatsCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  backgroundColor: theme.palette.background.default,
  borderRadius: '10px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
  },
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(1),
  '& .MuiSvgIcon-root': {
    fontSize: '2rem',
    marginRight: theme.spacing(1),
  },
}));

const GenderStats = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginTop: theme.spacing(1),
  '& .MuiSvgIcon-root': {
    marginRight: theme.spacing(0.5),
  },
}));

const Dashboard = () => {
  const theme = useTheme();
  const [stats, setStats] = useState({
    member_count: 0,
    male_count: 0,
    female_count: 0,
    tournament_count: 0,
    latest_tournament_name: '',
    champions: [],
  });
  const [announcements, setAnnouncements] = useState([]);
  const [version, setVersion] = useState('');
  const [versionDescription, setVersionDescription] = useState('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [announcementForm, setAnnouncementForm] = useState({
    content: '',
  });
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [tournaments, setTournaments] = useState([]);

  // 獲取所有賽事列表以提取可用年度
  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const tournamentService = await import('../services/tournamentService');
        const data = await tournamentService.getAllTournaments();
        setTournaments(data);
      } catch (error) {
        console.error('Error fetching tournaments:', error);
      }
    };
    fetchTournaments();
  }, []);

  // 獲取所有可用的年度列表
  const availableYears = useMemo(() => {
    const years = new Set();
    const currentYear = new Date().getFullYear();
    years.add(currentYear); // 確保包含當前年度
    
    tournaments.forEach(tournament => {
      if (tournament.date) {
        const year = new Date(tournament.date).getFullYear();
        years.add(year);
      }
    });
    // 也從冠軍榜中提取年度
    stats.champions.forEach(champion => {
      if (champion.year) {
        years.add(champion.year);
      }
    });
    return Array.from(years).sort((a, b) => b - a); // 降序排列（最新的在前）
  }, [tournaments, stats.champions]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          statsResponse,
          announcementsResponse,
          versionResponse,
          versionDescResponse
        ] = await Promise.all([
          dashboardService.getStats(selectedYear),
          dashboardService.getAnnouncements(),
          dashboardService.getVersion(),
          dashboardService.getVersionDescription(),
        ]);

        setStats(statsResponse);
        setAnnouncements(announcementsResponse);
        setVersion(versionResponse.version);
        setVersionDescription(versionDescResponse.description);
        setEditedDescription(versionDescResponse.description);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchData();
  }, [selectedYear]);

  // 處理年度篩選變更
  const handleYearChange = (event) => {
    setSelectedYear(event.target.value);
  };

  const handleVersionClick = async (event) => {
    event.preventDefault();
    const isLeftClick = event.button === 0;
    const currentVersion = version.replace('V', '');
    const [major, minor] = currentVersion.split('.').map(Number);

    let newMajor = major;
    let newMinor = minor;

    if (isLeftClick) {
      newMinor += 1;
      if (newMinor > 9) {
        newMajor += 1;
        newMinor = 0;
      }
    } else if (event.button === 2) {
      newMinor -= 1;
      if (newMinor < 0) {
        if (newMajor > 1) {
          newMajor -= 1;
          newMinor = 9;
        } else {
          newMinor = 0;
        }
      }
    }

    const newVersion = `V${newMajor}.${newMinor}`;
    try {
      await dashboardService.updateVersion({ version: newVersion });
      setVersion(newVersion);
    } catch (error) {
      console.error('Error updating version:', error);
    }
  };


  const handleAnnouncementDialogOpen = (announcement = null) => {
    if (announcement) {
      setEditingAnnouncement(announcement);
      setAnnouncementForm({
        content: announcement.content,
      });
    } else {
      setEditingAnnouncement(null);
      setAnnouncementForm({
        content: '',
      });
    }
    setAnnouncementDialogOpen(true);
  };

  const handleAnnouncementDialogClose = () => {
    setAnnouncementDialogOpen(false);
    setEditingAnnouncement(null);
  };

  const handleAnnouncementSubmit = async () => {
    try {
      if (editingAnnouncement) {
        await dashboardService.updateAnnouncement(editingAnnouncement.id, announcementForm);
      } else {
        await dashboardService.createAnnouncement(announcementForm);
      }
      const announcementsResponse = await dashboardService.getAnnouncements();
      setAnnouncements(announcementsResponse);
      handleAnnouncementDialogClose();
    } catch (error) {
      console.error('Error saving announcement:', error);
    }
  };

  const handleAnnouncementDelete = async (id) => {
    if (window.confirm('確定要刪除這則公告嗎？')) {
      try {
        await dashboardService.deleteAnnouncement(id);
        const announcementsResponse = await dashboardService.getAnnouncements();
        setAnnouncements(announcementsResponse);
      } catch (error) {
        console.error('Error deleting announcement:', error);
      }
    }
  };

  const handleDescriptionEdit = async () => {
    if (isEditingDescription) {
      try {
        await dashboardService.updateVersionDescription({ description: editedDescription });
        setVersionDescription(editedDescription);
      } catch (error) {
        console.error('Error updating version description:', error);
      }
    }
    setIsEditingDescription(!isEditingDescription);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* 年度篩選 */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>年度篩選</InputLabel>
          <Select
            value={selectedYear}
            label="年度篩選"
            onChange={handleYearChange}
          >
            {availableYears.map(year => (
              <MenuItem key={year} value={year}>
                {year} 年
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        {/* 會員統計卡片 */}
        <Grid item xs={12} md={6} lg={3}>
          <StatsCard>
            <IconWrapper>
              <PeopleIcon color="primary" />
              <Typography variant="h6" component="div">
                會員統計
              </Typography>
            </IconWrapper>
            <Typography variant="h4" component="div" gutterBottom>
              {stats.member_count}
            </Typography>
            <GenderStats>
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                <MaleIcon sx={{ color: theme.palette.primary.main }} />
                <Typography variant="body1">{stats.male_count}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FemaleIcon sx={{ color: theme.palette.secondary.main }} />
                <Typography variant="body1">{stats.female_count}</Typography>
              </Box>
            </GenderStats>
          </StatsCard>
        </Grid>

        {/* 賽事統計卡片 */}
        <Grid item xs={12} md={6} lg={3}>
          <StatsCard>
            <IconWrapper>
              <GolfCourseIcon color="primary" />
              <Typography variant="h6" component="div">
                {selectedYear}年度賽事
              </Typography>
            </IconWrapper>
            <Box display="flex" alignItems="center">
              <TrophyIcon sx={{ fontSize: 40, mr: 2 }} />
              <Typography variant="h3">
                {stats.tournament_count || 0}
              </Typography>
            </Box>
          </StatsCard>
        </Grid>

        {/* 年度總桿冠軍榜 */}
        <Grid item xs={12} md={6} lg={6}>
          <StatsCard>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <IconWrapper>
                <EmojiEventsIcon color="primary" />
                <Typography variant="h6" component="div">
                  {selectedYear}年度總桿冠軍榜
                </Typography>
              </IconWrapper>
            </Box>
            <Box sx={{ 
              maxHeight: 300, 
              overflowY: 'auto',
              overflowX: 'hidden',
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: '#f1f1f1',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#888',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: '#555',
              },
            }}>
              {stats.champions && stats.champions.length > 0 ? (
                stats.champions.map((champion) => (
                  <Box key={champion.id} sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1,
                    p: 1,
                    borderRadius: 1,
                    '&:hover': { bgcolor: 'action.hover' }
                  }}>
                    <Typography variant="body1">
                      {champion.year}年度: {champion.tournament_name} - {champion.member_name}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                  目前沒有總桿冠軍記錄
                </Typography>
              )}
            </Box>
          </StatsCard>
        </Grid>

        {/* 公告區塊 */}
        <Grid item xs={12}>
          <StatsCard>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">系統公告</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleAnnouncementDialogOpen()}
              >
                新增公告
              </Button>
            </Box>
            {announcements.length > 0 ? (
              announcements.map((announcement) => (
                <Box key={announcement.id} sx={{
                  mb: 2,
                  p: 2,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': { bgcolor: 'action.hover' }
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {announcement.content}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        發布時間：{new Date(announcement.created_at).toLocaleString()}
                      </Typography>
                    </Box>
                    <Box>
                      <IconButton size="small" onClick={() => handleAnnouncementDialogOpen(announcement)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleAnnouncementDelete(announcement.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                目前沒有公告
              </Typography>
            )}
          </StatsCard>
        </Grid>
      </Grid>

      {/* 版本號和功能說明 */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <StatsCard>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">版本功能說明</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    cursor: 'pointer',
                    userSelect: 'none',
                    '&:hover': {
                      color: 'primary.main',
                    }
                  }}
                  onClick={handleVersionClick}
                  onContextMenu={handleVersionClick}
                >
                  版本：{version}
                </Typography>
                <IconButton onClick={handleDescriptionEdit}>
                  {isEditingDescription ? <CheckIcon /> : <EditIcon />}
                </IconButton>
              </Box>
            </Box>
            {isEditingDescription ? (
              <TextField
                multiline
                rows={4}
                fullWidth
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                variant="outlined"
              />
            ) : (
              <Typography
                variant="body1"
                sx={{ whiteSpace: 'pre-wrap' }}
              >
                {versionDescription}
              </Typography>
            )}
          </StatsCard>
        </Grid>
      </Grid>

      {/* 版權信息 */}
      <Box
        sx={{
          mt: 4,
          py: 2,
          borderTop: 1,
          borderColor: 'divider',
          textAlign: 'center'
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Copy Right : Designed by KT. Liang
        </Typography>
      </Box>

      {/* 公告編輯對話框 */}
      <Dialog open={announcementDialogOpen} onClose={handleAnnouncementDialogClose}>
        <DialogTitle>{editingAnnouncement ? '編輯公告' : '新增公告'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            multiline
            rows={4}
            value={announcementForm.content}
            onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
            label="公告內容"
            fullWidth
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAnnouncementDialogClose}>取消</Button>
          <Button onClick={handleAnnouncementSubmit} variant="contained">
            確定
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Dashboard;

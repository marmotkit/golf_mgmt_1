import React, { useState, useEffect } from 'react';
import { Container, Grid, Paper, Typography, Box, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';
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
import axios from '../utils/axios';

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
  const [championDialogOpen, setChampionDialogOpen] = useState(false);
  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false);
  const [editingChampion, setEditingChampion] = useState(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [championForm, setChampionForm] = useState({
    year: new Date().getFullYear(),
    tournament_name: '',
    member_name: '',
    total_strokes: '',
  });
  const [announcementForm, setAnnouncementForm] = useState({
    content: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          statsResponse,
          announcementsResponse,
          versionResponse,
          versionDescResponse
        ] = await Promise.all([
          axios.get('/dashboard/stats'),
          axios.get('/dashboard/announcements'),
          axios.get('/version'),
          axios.get('/version/description'),
        ]);

        setStats(statsResponse.data);
        setAnnouncements(announcementsResponse.data);
        setVersion(versionResponse.data.version);
        setVersionDescription(versionDescResponse.data.description);
        setEditedDescription(versionDescResponse.data.description);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchData();
  }, []);

  const handleVersionClick = async (event) => {
    event.preventDefault(); // 防止預設行為
    const isLeftClick = event.button === 0;
    const currentVersion = version.replace('V', '');
    const [major, minor] = currentVersion.split('.').map(Number);

    let newMajor = major;
    let newMinor = minor;

    if (isLeftClick) {
      // 左鍵點擊，版本號增加
      newMinor += 1;
      if (newMinor > 9) {
        newMajor += 1;
        newMinor = 0;
      }
    } else if (event.button === 2) {
      // 右鍵點擊，版本號減少
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
      await axios.post('/version', { version: newVersion });
      setVersion(newVersion);
    } catch (error) {
      console.error('Error updating version:', error);
    }
  };

  const handleChampionDialogOpen = (champion = null) => {
    if (champion) {
      setEditingChampion(champion);
      setChampionForm({
        year: champion.year,
        tournament_name: champion.tournament_name,
        member_name: champion.member_name,
        total_strokes: champion.total_strokes,
      });
    } else {
      setEditingChampion(null);
      setChampionForm({
        year: new Date().getFullYear(),
        tournament_name: '',
        member_name: '',
        total_strokes: '',
      });
    }
    setChampionDialogOpen(true);
  };

  const handleChampionDialogClose = () => {
    setChampionDialogOpen(false);
    setEditingChampion(null);
  };

  const handleChampionSubmit = async () => {
    try {
      if (editingChampion) {
        await axios.put(`/dashboard/champions/${editingChampion.id}`, championForm);
      } else {
        await axios.post('/dashboard/champions', championForm);
      }
      const response = await axios.get('/dashboard/stats');
      setStats(response.data);
      handleChampionDialogClose();
    } catch (error) {
      console.error('Error saving champion:', error);
    }
  };

  const handleChampionDelete = async (id) => {
    if (window.confirm('確定要刪除這筆記錄嗎？')) {
      try {
        await axios.delete(`/dashboard/champions/${id}`);
        const response = await axios.get('/dashboard/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Error deleting champion:', error);
      }
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
        await axios.put(`/dashboard/announcements/${editingAnnouncement.id}`, announcementForm);
      } else {
        await axios.post('/dashboard/announcements', announcementForm);
      }
      const response = await axios.get('/dashboard/announcements');
      setAnnouncements(response.data);
      handleAnnouncementDialogClose();
    } catch (error) {
      console.error('Error saving announcement:', error);
    }
  };

  const handleAnnouncementDelete = async (id) => {
    if (window.confirm('確定要刪除這則公告嗎？')) {
      try {
        await axios.delete(`/dashboard/announcements/${id}`);
        const response = await axios.get('/dashboard/announcements');
        setAnnouncements(response.data);
      } catch (error) {
        console.error('Error deleting announcement:', error);
      }
    }
  };

  const handleDescriptionEdit = async () => {
    if (isEditingDescription) {
      try {
        await axios.post('/version/description', { description: editedDescription });
        setVersionDescription(editedDescription);
      } catch (error) {
        console.error('Error updating version description:', error);
      }
    }
    setIsEditingDescription(!isEditingDescription);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
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
                本年度賽事
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
                  年度總桿冠軍榜
                </Typography>
              </IconWrapper>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleChampionDialogOpen()}
              >
                新增記錄
              </Button>
            </Box>
            {stats.champions.map((champion) => (
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
                  {champion.year}年度: {champion.tournament_name} - {champion.member_name} {champion.total_strokes}桿
                </Typography>
                <Box>
                  <IconButton size="small" onClick={() => handleChampionDialogOpen(champion)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleChampionDelete(champion.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>
            ))}
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

      {/* 總桿冠軍編輯對話框 */}
      <Dialog open={championDialogOpen} onClose={handleChampionDialogClose}>
        <DialogTitle>{editingChampion ? '編輯記錄' : '新增記錄'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="年度"
              type="number"
              value={championForm.year}
              onChange={(e) => setChampionForm({ ...championForm, year: e.target.value })}
              fullWidth
            />
            <TextField
              label="賽事名稱"
              value={championForm.tournament_name}
              onChange={(e) => setChampionForm({ ...championForm, tournament_name: e.target.value })}
              fullWidth
            />
            <TextField
              label="會員姓名"
              value={championForm.member_name}
              onChange={(e) => setChampionForm({ ...championForm, member_name: e.target.value })}
              fullWidth
            />
            <TextField
              label="總桿數"
              type="number"
              value={championForm.total_strokes}
              onChange={(e) => setChampionForm({ ...championForm, total_strokes: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleChampionDialogClose}>取消</Button>
          <Button onClick={handleChampionSubmit} variant="contained">
            確定
          </Button>
        </DialogActions>
      </Dialog>

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

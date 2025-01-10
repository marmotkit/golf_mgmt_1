import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import GroupIcon from '@mui/icons-material/Group';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import axios from '../utils/axios';
import { format } from 'date-fns';

function Dashboard() {
  const [stats, setStats] = useState({
    member_count: 0,
    tournament_count: 0,
    latest_tournament_name: '',
    champions: []
  });
  const [version, setVersion] = useState({ major: 1, minor: 0 });
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingChampion, setEditingChampion] = useState(null);
  const [formData, setFormData] = useState({
    tournament_name: '',
    player_name: '',
    total_strokes: '',
    date: new Date()
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('/api/dashboard/stats');
        setStats(response.data);
        setError(null);
      } catch (err) {
        setError('載入資料時發生錯誤');
        console.error('Error fetching dashboard stats:', err);
      }
    };

    fetchStats();
  }, []);

  const handleDialogOpen = (champion = null) => {
    if (champion) {
      setEditingChampion(champion);
      setFormData({
        tournament_name: champion.tournament_name,
        player_name: champion.player_name,
        total_strokes: champion.total_strokes,
        date: new Date(champion.date)
      });
    } else {
      setEditingChampion(null);
      setFormData({
        tournament_name: '',
        player_name: '',
        total_strokes: '',
        date: new Date()
      });
    }
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingChampion(null);
    setFormData({
      tournament_name: '',
      player_name: '',
      total_strokes: '',
      date: new Date()
    });
  };

  const handleSubmit = async () => {
    try {
      const data = {
        ...formData,
        date: format(formData.date, "yyyy-MM-dd'T'HH:mm:ss")
      };

      if (editingChampion) {
        await axios.put(`/api/dashboard/champions/${editingChampion.id}`, data);
      } else {
        await axios.post('/api/dashboard/champions', data);
      }

      const response = await axios.get('/api/dashboard/stats');
      setStats(response.data);
      handleDialogClose();
    } catch (err) {
      console.error('Error saving champion:', err);
      setError('儲存資料時發生錯誤');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('確定要刪除這筆記錄嗎？')) return;

    try {
      await axios.delete(`/api/dashboard/champions/${id}`);
      const response = await axios.get('/api/dashboard/stats');
      setStats(response.data);
    } catch (err) {
      console.error('Error deleting champion:', err);
      setError('刪除資料時發生錯誤');
    }
  };

  const handleVersionClick = (event) => {
    event.preventDefault();
    const isLeftClick = event.button === 0;
    const newVersion = { ...version };

    if (isLeftClick) {
      // 版本號增加
      newVersion.minor += 1;
      if (newVersion.minor > 9) {
        newVersion.major += 1;
        newVersion.minor = 0;
      }
    } else if (event.button === 2) {
      // 版本號減少
      newVersion.minor -= 1;
      if (newVersion.minor < 0) {
        if (newVersion.major > 1) {
          newVersion.major -= 1;
          newVersion.minor = 9;
        } else {
          newVersion.minor = 0;
        }
      }
    }
    setVersion(newVersion);
  };

  return (
    <Box sx={{ p: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          歡迎使用清華大學校友高爾夫球隊管理系統
        </Typography>
        <Tooltip title="左鍵增加版本，右鍵減少版本">
          <Typography 
            variant="h6" 
            sx={{ 
              cursor: 'pointer',
              userSelect: 'none',
              color: 'primary.main',
              '&:hover': {
                color: 'primary.dark',
              }
            }}
            onMouseDown={handleVersionClick}
            onContextMenu={(e) => e.preventDefault()}
          >
            V{version.major}.{version.minor}
          </Typography>
        </Tooltip>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Typography variant="h6" color="text.secondary">
                總會員數
              </Typography>
              <Typography variant="h3">{stats.member_count}</Typography>
            </Box>
            <GroupIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Typography variant="h6" color="text.secondary">
                本年度賽事
              </Typography>
              <Typography variant="h3">{stats.tournament_count}</Typography>
              <Typography variant="body2" color="text.secondary">
                最新：{stats.latest_tournament_name}
              </Typography>
            </Box>
            <EmojiEventsIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">年度總桿冠軍榜</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleDialogOpen()}
              >
                新增記錄
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>日期</TableCell>
                    <TableCell>賽事名稱</TableCell>
                    <TableCell>選手姓名</TableCell>
                    <TableCell>總桿數</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.champions && stats.champions.map((champion) => (
                    <TableRow key={champion.id}>
                      <TableCell>{format(new Date(champion.date), 'yyyy/MM/dd')}</TableCell>
                      <TableCell>{champion.tournament_name}</TableCell>
                      <TableCell>{champion.player_name}</TableCell>
                      <TableCell>{champion.total_strokes}</TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleDialogOpen(champion)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(champion.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={dialogOpen} onClose={handleDialogClose}>
        <DialogTitle>
          {editingChampion ? '編輯記錄' : '新增記錄'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="賽事名稱"
              value={formData.tournament_name}
              onChange={(e) => setFormData({ ...formData, tournament_name: e.target.value })}
              fullWidth
            />
            <TextField
              label="選手姓名"
              value={formData.player_name}
              onChange={(e) => setFormData({ ...formData, player_name: e.target.value })}
              fullWidth
            />
            <TextField
              label="總桿數"
              type="number"
              value={formData.total_strokes}
              onChange={(e) => setFormData({ ...formData, total_strokes: e.target.value })}
              fullWidth
            />
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="日期"
                value={formData.date}
                onChange={(newValue) => setFormData({ ...formData, date: newValue })}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>取消</Button>
          <Button onClick={handleSubmit} variant="contained">
            確定
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Dashboard;

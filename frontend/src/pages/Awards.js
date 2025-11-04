import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  FileDownload as FileDownloadIcon,
} from '@mui/icons-material';
import axios from '../utils/axios';

function Awards() {
  const [tournaments, setTournaments] = useState([]);
  const [awards, setAwards] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // 獲取賽事列表
  const fetchTournaments = async () => {
    try {
      const response = await axios.get('/tournaments');
      setTournaments(response.data || []);
    } catch (error) {
      showSnackbar('獲取賽事列表失敗', 'error');
    }
  };

  // 獲取獎項列表
  const fetchAwards = async (tournamentName) => {
    if (!tournamentName) {
      setAwards([]);
      return;
    }
    
    try {
      setLoading(true);
      const response = await axios.get(`/awards?tournament_name=${encodeURIComponent(tournamentName)}`);
      setAwards(response.data || []);
    } catch (error) {
      showSnackbar('獲取獎項列表失敗', 'error');
      setAwards([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      fetchAwards(selectedTournament);
    } else {
      setAwards([]);
    }
  }, [selectedTournament]);

  // 顯示提示信息
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // 處理刪除獎項
  const handleDelete = async (id) => {
    if (!window.confirm('確定要刪除此獎項記錄嗎？')) {
      return;
    }

    try {
      await axios.delete(`/dashboard/champions/${id}`);
      showSnackbar('刪除成功');
      if (selectedTournament) {
        fetchAwards(selectedTournament);
      }
    } catch (error) {
      showSnackbar('刪除失敗', 'error');
    }
  };

  // 處理匯出資料
  const handleExport = async () => {
    if (!selectedTournament) {
      showSnackbar('請先選擇賽事', 'warning');
      return;
    }

    if (awards.length === 0) {
      showSnackbar('沒有可匯出的資料', 'warning');
      return;
    }

    try {
      const response = await axios.get(
        `/awards/export?tournament_name=${encodeURIComponent(selectedTournament)}`,
        { responseType: 'blob' }
      );

      // 建立下載連結
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // 設定檔案名稱
      const fileName = `獎項管理_${selectedTournament}_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.setAttribute('download', fileName);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      showSnackbar('匯出成功');
    } catch (error) {
      showSnackbar('匯出失敗', 'error');
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        獎項管理
      </Typography>
      
      <Typography variant="h6" component="h2" sx={{ mt: 3, mb: 2 }}>
        總桿冠軍歷月表列
      </Typography>

      {/* 賽事選擇和匯出按鈕 */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <FormControl sx={{ minWidth: 250 }}>
          <InputLabel id="tournament-select-label">選擇賽事</InputLabel>
          <Select
            labelId="tournament-select-label"
            id="tournament-select"
            value={selectedTournament}
            label="選擇賽事"
            onChange={(e) => setSelectedTournament(e.target.value)}
          >
            <MenuItem value="">
              <em>請選擇賽事</em>
            </MenuItem>
            {tournaments.map((tournament) => (
              <MenuItem key={tournament.id} value={tournament.name}>
                {tournament.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedTournament && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<FileDownloadIcon />}
            onClick={handleExport}
            disabled={loading || awards.length === 0}
          >
            匯出資料
          </Button>
        )}
      </Box>

      {/* 獎項列表 */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : awards.length > 0 ? (
        <Grid container spacing={2}>
          {awards.map((award) => (
            <Grid item xs={12} sm={6} md={4} key={award.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" component="div" gutterBottom>
                        {award.tournament_name}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {award.member_name}
                      </Typography>
                      {award.total_strokes && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          總桿數：{award.total_strokes} 桿
                        </Typography>
                      )}
                    </Box>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(award.id)}
                      sx={{ ml: 1 }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : selectedTournament ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            目前沒有此賽事的獎項記錄
          </Typography>
        </Paper>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            請選擇賽事以查看獎項記錄
          </Typography>
        </Paper>
      )}

      {/* 提示訊息 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Awards;


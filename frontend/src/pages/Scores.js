import React, { useState, useEffect } from 'react';
import {
  Box,
  Tab,
  Tabs,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Container,
  Paper,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import axios from '../utils/axios';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function Scores() {
  const [value, setValue] = useState(0);
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [scores, setScores] = useState([]);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const columns = [
    { field: 'member_number', headerName: '會員編號', width: 120 },
    { field: 'full_name', headerName: 'HOLE', width: 200 },
    { field: 'chinese_name', headerName: '姓名', width: 120 },
    { field: 'rank', headerName: '淨桿名次', width: 100, type: 'number' },
    { field: 'gross_score', headerName: '總桿數', width: 100, type: 'number' },
    { 
      field: 'previous_handicap', 
      headerName: '前次差點', 
      width: 100,
      type: 'number',
      valueFormatter: (params) => {
        if (params.value == null) return '';
        return params.value.toFixed(1);
      }
    },
    { 
      field: 'net_score', 
      headerName: '淨桿桿數', 
      width: 100,
      type: 'number',
      valueFormatter: (params) => {
        if (params.value == null) return '';
        return params.value.toFixed(1);
      }
    },
    { 
      field: 'handicap_change', 
      headerName: '差點增減', 
      width: 100,
      type: 'number',
      valueFormatter: (params) => {
        if (params.value == null) return '';
        return params.value.toFixed(2);
      }
    },
    { 
      field: 'new_handicap', 
      headerName: '新差點', 
      width: 100,
      type: 'number',
      valueFormatter: (params) => {
        if (params.value == null) return '';
        return params.value.toFixed(2);
      }
    },
    { field: 'points', headerName: '積分', width: 100, type: 'number' }
  ];

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      fetchScores(selectedTournament.id);
    }
  }, [selectedTournament]);

  const fetchTournaments = async () => {
    try {
      const response = await axios.get('/api/tournaments');
      setTournaments(response.data);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    }
  };

  const fetchScores = async (tournamentId) => {
    try {
      const response = await axios.get(`/api/scores?tournament_id=${tournamentId}`);
      const scoresWithId = response.data.map((score, index) => ({
        ...score,
        id: index,
      }));
      setScores(scoresWithId);
    } catch (error) {
      console.error('Error fetching scores:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleTournamentSelect = (tournament) => {
    setSelectedTournament(tournament);
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !selectedTournament) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('tournament_id', selectedTournament.id);

    try {
      const response = await axios.post('/api/scores/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setOpenUploadDialog(false);
      setSelectedFile(null);
      fetchScores(selectedTournament.id);
    } catch (error) {
      console.error('Error uploading scores:', error);
      if (error.response) {
        console.error('Error details:', error.response.data);
        alert(`上傳失敗: ${error.response.data.error}\n${error.response.data.details || ''}`);
      } else {
        alert('上傳失敗：請檢查文件格式是否正確');
      }
    }
  };

  const handleClearScores = async () => {
    try {
      await axios.post('/api/scores/clear');
      alert('成績資料已清除');
      if (selectedTournament) {
        fetchScores(selectedTournament.id);
      }
    } catch (error) {
      console.error('Error clearing scores:', error);
      alert('清除成績資料失敗');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value} onChange={handleTabChange}>
            <Tab label="賽事成績" />
            <Tab label="年度總成績" />
          </Tabs>
        </Box>

        <TabPanel value={value} index={0}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              選擇賽事
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {tournaments.map((tournament) => (
                <Button
                  key={tournament.id}
                  variant={selectedTournament?.id === tournament.id ? 'contained' : 'outlined'}
                  onClick={() => handleTournamentSelect(tournament)}
                >
                  {tournament.name}
                </Button>
              ))}
            </Box>
          </Box>

          {selectedTournament && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  {selectedTournament.name} 成績表
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleClearScores}
                  >
                    清除所有成績
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => setOpenUploadDialog(true)}
                  >
                    匯入成績
                  </Button>
                </Box>
              </Box>

              <Box sx={{ height: 400, width: '100%' }}>
                <DataGrid
                  rows={scores}
                  columns={columns}
                  pageSize={5}
                  rowsPerPageOptions={[5]}
                  disableSelectionOnClick
                />
              </Box>
            </>
          )}
        </TabPanel>

        <TabPanel value={value} index={1}>
          <Typography variant="h6" gutterBottom>
            年度總成績匯總表
          </Typography>
          <Typography variant="body1" color="text.secondary">
            此功能正在開發中...
          </Typography>
        </TabPanel>
      </Paper>

      <Dialog open={openUploadDialog} onClose={() => setOpenUploadDialog(false)}>
        <DialogTitle>上傳成績檔案</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setSelectedFile(e.target.files[0])}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUploadDialog(false)}>取消</Button>
          <Button onClick={handleFileUpload} variant="contained" disabled={!selectedFile}>
            上傳
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Scores;

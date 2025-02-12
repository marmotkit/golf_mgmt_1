import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Paper,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import config from '../config';

const AWARD_TYPES = {
  TECHNICAL_GENERAL: {
    title: '技術獎 - 一般組',
    awards: [
      { id: 'general_near1', name: '1近洞', multiWinner: true },
      { id: 'general_near2', name: '2近洞', multiWinner: true },
      { id: 'general_near3', name: '3近洞', multiWinner: true }
    ]
  },
  TECHNICAL_SENIOR: {
    title: '技術獎 - 長青組',
    awards: [
      { id: 'senior_near1', name: '1近洞', multiWinner: true }
    ]
  },
  OTHERS: {
    title: '其他獎項',
    awards: [
      { id: 'gross_champion', name: '總桿冠軍', multiWinner: false },
      { id: 'net_champion', name: '淨桿獎', multiWinner: false, ranks: 10 },
      { id: 'president', name: '會長獎', multiWinner: false },
      { id: 'bb', name: 'BB獎', multiWinner: false },
      { id: 'eagle', name: 'Eagle獎', multiWinner: true },
      { id: 'hio', name: 'HIO', multiWinner: false },
      { id: 'special', name: '其他特殊獎項', multiWinner: true }
    ]
  }
};

const Awards = () => {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [awards, setAwards] = useState({});
  const [loading, setLoading] = useState(false);
  const [newWinner, setNewWinner] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // 加載賽事列表
  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const response = await fetch(`${config.apiBaseUrl}/tournaments`);
        if (!response.ok) throw new Error('獲取賽事列表失敗');
        const data = await response.json();
        setTournaments(data);
      } catch (error) {
        showMessage('獲取賽事列表失敗', 'error');
      }
    };

    fetchTournaments();
  }, []);

  // 加載賽事獎項
  useEffect(() => {
    const fetchAwards = async () => {
      if (!selectedTournament) return;
      setLoading(true);
      try {
        const response = await fetch(`${config.apiBaseUrl}/awards?tournament_id=${selectedTournament}`);
        if (!response.ok) throw new Error('獲取獎項失敗');
        const data = await response.json();
        
        // 將獎項數據整理成所需格式
        const formattedAwards = {};
        data.forEach(award => {
          if (!formattedAwards[award.award_type_id]) {
            formattedAwards[award.award_type_id] = [];
          }
          formattedAwards[award.award_type_id].push(award.chinese_name);
        });
        setAwards(formattedAwards);
      } catch (error) {
        showMessage('獲取獎項失敗', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchAwards();
  }, [selectedTournament]);

  const showMessage = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleTournamentChange = (event) => {
    setSelectedTournament(event.target.value);
  };

  const handleAddWinner = async (awardId, rank = null) => {
    if (!newWinner.trim()) {
      showMessage('請輸入得獎者姓名', 'error');
      return;
    }

    try {
      const response = await fetch(`${config.apiBaseUrl}/awards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tournament_id: selectedTournament,
          award_type_id: awardId,
          chinese_name: newWinner.trim(),
          rank: rank
        })
      });

      if (!response.ok) throw new Error('新增得獎者失敗');

      // 更新本地狀態
      setAwards(prev => ({
        ...prev,
        [awardId]: [...(prev[awardId] || []), newWinner.trim()]
      }));
      setNewWinner('');
      showMessage('新增成功');
    } catch (error) {
      showMessage('新增得獎者失敗', 'error');
    }
  };

  const handleDeleteWinner = async (awardId, winnerName) => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/awards/${awardId}/${winnerName}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('刪除得獎者失敗');

      // 更新本地狀態
      setAwards(prev => ({
        ...prev,
        [awardId]: prev[awardId].filter(name => name !== winnerName)
      }));
      showMessage('刪除成功');
    } catch (error) {
      showMessage('刪除得獎者失敗', 'error');
    }
  };

  const renderAwardSection = (section) => {
    return (
      <Paper sx={{ p: 2, mb: 2 }} key={section.title}>
        <Typography variant="h6" gutterBottom>
          {section.title}
        </Typography>
        <List>
          {section.awards.map(award => (
            <React.Fragment key={award.id}>
              <ListItem>
                <ListItemText
                  primary={award.name}
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      {award.ranks ? (
                        // 淨桿獎特殊處理
                        Array.from({ length: award.ranks }, (_, i) => (
                          <Box key={i} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2" sx={{ mr: 1, minWidth: 60 }}>
                              第{i + 1}名：
                            </Typography>
                            <TextField
                              size="small"
                              value={awards[award.id]?.[i] || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                setAwards(prev => ({
                                  ...prev,
                                  [award.id]: {
                                    ...prev[award.id],
                                    [i]: value
                                  }
                                }));
                              }}
                              sx={{ mr: 1 }}
                            />
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleAddWinner(award.id, i + 1)}
                              disabled={!awards[award.id]?.[i]}
                            >
                              儲存
                            </Button>
                          </Box>
                        ))
                      ) : (
                        // 其他獎項
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <TextField
                            size="small"
                            value={newWinner}
                            onChange={(e) => setNewWinner(e.target.value)}
                            sx={{ mr: 1 }}
                          />
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleAddWinner(award.id)}
                            disabled={!newWinner.trim()}
                          >
                            新增
                          </Button>
                        </Box>
                      )}
                      {/* 顯示得獎者列表 */}
                      {awards[award.id]?.length > 0 && (
                        <List dense>
                          {awards[award.id].map((winner, index) => (
                            <ListItem key={index}>
                              <ListItemText primary={winner} />
                              <ListItemSecondaryAction>
                                <IconButton
                                  edge="end"
                                  size="small"
                                  onClick={() => handleDeleteWinner(award.id, winner)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </ListItemSecondaryAction>
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </Box>
                  }
                />
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      </Paper>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        獎項管理
      </Typography>

      <Box sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 300 }}>
          <InputLabel>選擇賽事</InputLabel>
          <Select
            value={selectedTournament}
            onChange={handleTournamentChange}
            label="選擇賽事"
          >
            {tournaments.map((tournament) => (
              <MenuItem key={tournament.id} value={tournament.id}>
                {tournament.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {selectedTournament && (
        <Box>
          {Object.values(AWARD_TYPES).map(section => renderAwardSection(section))}
        </Box>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Awards; 
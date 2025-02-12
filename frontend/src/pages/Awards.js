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

const Awards = () => {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [awardTypes, setAwardTypes] = useState([]);
  const [awards, setAwards] = useState([]);
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

  // 加載獎項類型
  useEffect(() => {
    const fetchAwardTypes = async () => {
      try {
        const response = await fetch(`${config.apiBaseUrl}/awards/types`);
        if (!response.ok) throw new Error('獲取獎項類型失敗');
        const data = await response.json();
        setAwardTypes(data);
      } catch (error) {
        showMessage('獲取獎項類型失敗', 'error');
      }
    };

    fetchAwardTypes();
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
        setAwards(data);
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

  const handleAddWinner = async (awardTypeId, rank = null) => {
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
          award_type_id: awardTypeId,
          chinese_name: newWinner.trim(),
          rank: rank
        })
      });

      if (!response.ok) throw new Error('新增得獎者失敗');
      
      // 重新載入獎項列表
      const awardsResponse = await fetch(`${config.apiBaseUrl}/awards?tournament_id=${selectedTournament}`);
      if (!awardsResponse.ok) throw new Error('重新載入獎項失敗');
      const data = await awardsResponse.json();
      setAwards(data);
      
      setNewWinner('');
      showMessage('新增成功');
    } catch (error) {
      showMessage('新增得獎者失敗', 'error');
    }
  };

  const handleDeleteWinner = async (awardId) => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/awards/${awardId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('刪除得獎者失敗');

      // 重新載入獎項列表
      const awardsResponse = await fetch(`${config.apiBaseUrl}/awards?tournament_id=${selectedTournament}`);
      if (!awardsResponse.ok) throw new Error('重新載入獎項失敗');
      const data = await awardsResponse.json();
      setAwards(data);
      
      showMessage('刪除成功');
    } catch (error) {
      showMessage('刪除得獎者失敗', 'error');
    }
  };

  const renderAwardSection = (title, types) => {
    return (
      <Paper sx={{ p: 2, mb: 2 }} key={title}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <List>
          {types.map(type => (
            <React.Fragment key={type.id}>
              <ListItem>
                <ListItemText
                  primary={type.name}
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      {type.name === '淨桿獎' ? (
                        // 淨桿獎特殊處理
                        Array.from({ length: 10 }, (_, i) => (
                          <Box key={i} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2" sx={{ mr: 1, minWidth: 60 }}>
                              第{i + 1}名：
                            </Typography>
                            <TextField
                              size="small"
                              value={newWinner}
                              onChange={(e) => setNewWinner(e.target.value)}
                              sx={{ mr: 1 }}
                            />
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleAddWinner(type.id, i + 1)}
                              disabled={!newWinner.trim()}
                            >
                              新增
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
                            onClick={() => handleAddWinner(type.id)}
                            disabled={!newWinner.trim()}
                          >
                            新增
                          </Button>
                        </Box>
                      )}
                      {/* 顯示得獎者列表 */}
                      <List dense>
                        {awards
                          .filter(award => award.award_type_id === type.id)
                          .map((award) => (
                            <ListItem key={award.id}>
                              <ListItemText 
                                primary={award.chinese_name}
                                secondary={award.rank ? `第${award.rank}名` : null}
                              />
                              <ListItemSecondaryAction>
                                <IconButton
                                  edge="end"
                                  size="small"
                                  onClick={() => handleDeleteWinner(award.id)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </ListItemSecondaryAction>
                            </ListItem>
                          ))}
                      </List>
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

  // 將獎項類型分類
  const generalTypes = awardTypes.filter(type => type.name.includes('一般組'));
  const seniorTypes = awardTypes.filter(type => type.name.includes('長青組'));
  const otherTypes = awardTypes.filter(type => 
    !type.name.includes('一般組') && !type.name.includes('長青組')
  );

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
          {renderAwardSection('技術獎 - 一般組', generalTypes)}
          {renderAwardSection('技術獎 - 長青組', seniorTypes)}
          {renderAwardSection('其他獎項', otherTypes)}
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
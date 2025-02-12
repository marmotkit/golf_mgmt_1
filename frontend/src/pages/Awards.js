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
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentAwardType, setCurrentAwardType] = useState(null);
  const [winnerInputs, setWinnerInputs] = useState({});
  const [netScoreWinners, setNetScoreWinners] = useState(Array(10).fill(''));
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
        
        // 初始化每個獎項類型的輸入狀態
        const inputs = {};
        data.forEach(type => {
          inputs[type.id] = '';
        });
        setWinnerInputs(inputs);
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

  const handleAddWinner = async (awardTypeId) => {
    const winnerName = winnerInputs[awardTypeId];
    if (!winnerName?.trim()) {
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
          chinese_name: winnerName.trim()
        })
      });

      if (!response.ok) throw new Error('新增得獎者失敗');
      
      // 重新載入獎項列表
      const awardsResponse = await fetch(`${config.apiBaseUrl}/awards?tournament_id=${selectedTournament}`);
      if (!awardsResponse.ok) throw new Error('重新載入獎項失敗');
      const data = await awardsResponse.json();
      setAwards(data);
      
      // 清空對應獎項的輸入
      setWinnerInputs(prev => ({
        ...prev,
        [awardTypeId]: ''
      }));
      showMessage('新增成功');
    } catch (error) {
      showMessage(error.message, 'error');
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

  const handleNetScoreSubmit = async () => {
    const validWinners = netScoreWinners.filter(name => name.trim());
    if (validWinners.length === 0) {
      showMessage('請至少輸入一位得獎者', 'error');
      return;
    }

    const netScoreType = awardTypes.find(type => type.name === '淨桿獎');
    if (!netScoreType) {
      showMessage('找不到淨桿獎項類型', 'error');
      return;
    }

    try {
      await Promise.all(
        validWinners.map((name, index) => 
          handleAddWinner(netScoreType.id, index + 1)
        )
      );
      setNetScoreWinners(Array(10).fill(''));
      showMessage('批量新增成功');
    } catch (error) {
      showMessage('批量新增失敗', 'error');
    }
  };

  const renderAwardSection = (title, types) => {
    return (
      <Paper sx={{ p: 2, mb: 2 }} key={title}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Grid container spacing={2}>
          {types.map(type => (
            <Grid item xs={12} key={type.id}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">{type.name}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <TextField
                    size="small"
                    placeholder="輸入得獎者姓名"
                    value={winnerInputs[type.id] || ''}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setWinnerInputs(prev => ({
                        ...prev,
                        [type.id]: newValue
                      }));
                    }}
                    sx={{ mr: 1, minWidth: '200px' }}
                  />
                  <Button
                    variant="contained"
                    onClick={() => handleAddWinner(type.id)}
                    disabled={!winnerInputs[type.id]?.trim()}
                  >
                    新增
                  </Button>
                </Box>
                <List dense>
                  {awards
                    .filter(award => award.award_type_id === type.id)
                    .map((award) => (
                      <ListItem key={award.id}>
                        <ListItemText 
                          primary={award.chinese_name}
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
              <Divider />
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  };

  const renderNetScoreSection = () => {
    const netScoreType = awardTypes.find(type => type.name === '淨桿獎');
    if (!netScoreType) return null;

    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          淨桿獎
        </Typography>
        <Grid container spacing={2}>
          {netScoreWinners.map((winner, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <TextField
                fullWidth
                size="small"
                label={`第 ${index + 1} 名`}
                value={winner}
                onChange={(e) => {
                  const newWinners = [...netScoreWinners];
                  newWinners[index] = e.target.value;
                  setNetScoreWinners(newWinners);
                }}
              />
            </Grid>
          ))}
        </Grid>
        <Button
          variant="contained"
          onClick={handleNetScoreSubmit}
          sx={{ mt: 2 }}
        >
          批量新增
        </Button>
        <List dense>
          {awards
            .filter(award => award.award_type_id === netScoreType.id)
            .sort((a, b) => (a.rank || 0) - (b.rank || 0))
            .map((award) => (
              <ListItem key={award.id}>
                <ListItemText 
                  primary={`第${award.rank}名：${award.chinese_name}`}
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
    !type.name.includes('一般組') && 
    !type.name.includes('長青組') && 
    type.name !== '淨桿獎'
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
        <>
          {renderAwardSection('技術獎 - 一般組', generalTypes)}
          {renderAwardSection('技術獎 - 長青組', seniorTypes)}
          {renderNetScoreSection()}
          {renderAwardSection('其他獎項', otherTypes)}
        </>
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
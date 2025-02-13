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
import * as awardService from '../services/awardService';
import * as tournamentService from '../services/tournamentService';

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
  const [message, setMessage] = useState({ open: false, text: '', severity: 'success' });

  // 加載賽事列表
  const fetchTournaments = async () => {
    try {
      const data = await tournamentService.getAllTournaments();
      setTournaments(data);
    } catch (error) {
      showMessage(error.message, 'error');
    }
  };

  // 加載獎項類型
  const fetchAwardTypes = async () => {
    try {
      const data = await awardService.getAwardTypes();
      setAwardTypes(data);
      
      // 初始化每個獎項類型的輸入狀態
      const initialInputs = {};
      data.forEach(type => {
        initialInputs[type.id] = '';
      });
      setWinnerInputs(initialInputs);
    } catch (error) {
      showMessage(error.message, 'error');
    }
  };

  // 加載賽事獎項
  const fetchAwards = async () => {
    if (!selectedTournament) return;
    setLoading(true);
    try {
      const data = await awardService.getTournamentAwards(selectedTournament);
      setAwards(data);
    } catch (error) {
      showMessage(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
    fetchAwardTypes();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      fetchAwards();
    }
  }, [selectedTournament]);

  const showMessage = (text, severity = 'success') => {
    setMessage({ open: true, text, severity });
  };

  const handleTournamentChange = (event) => {
    setSelectedTournament(event.target.value);
  };

  const handleWinnerInputChange = (awardTypeId) => (event) => {
    const newValue = event.target.value;
    setWinnerInputs(prev => ({
      ...prev,
      [awardTypeId]: newValue
    }));
  };

  const handleAddWinner = async (awardTypeId) => {
    if (!selectedTournament) {
      showMessage('請先選擇賽事', 'error');
      return;
    }

    const winnerName = winnerInputs[awardTypeId];
    if (!winnerName?.trim()) {
      showMessage('請輸入得獎者姓名', 'error');
      return;
    }

    try {
      await awardService.createTournamentAward({
        tournament_id: selectedTournament,
        award_type_id: awardTypeId,
        chinese_name: winnerName.trim()
      });

      // 清空該獎項的輸入框
      setWinnerInputs(prev => ({
        ...prev,
        [awardTypeId]: ''
      }));

      await fetchAwards();
      showMessage('新增得獎者成功');
    } catch (error) {
      showMessage(error.message, 'error');
    }
  };

  const handleDeleteWinner = async (awardId) => {
    try {
      await awardService.deleteTournamentAward(awardId);
      await fetchAwards();
      showMessage('刪除得獎者成功');
    } catch (error) {
      showMessage(error.message, 'error');
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
    if (!types || types.length === 0) return null;

    return (
      <Paper sx={{ p: 2, mb: 2 }} key={title}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Grid container spacing={2}>
          {types.map(type => {
            const typeAwards = awards.filter(a => a.award_type_id === type.id);
            const inputValue = winnerInputs[type.id] || '';

            return (
              <Grid item xs={12} key={type.id}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1">{type.name}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <TextField
                      size="small"
                      value={inputValue}
                      onChange={handleWinnerInputChange(type.id)}
                      placeholder="輸入得獎者姓名"
                      sx={{ minWidth: 200 }}
                    />
                    <Button
                      variant="contained"
                      onClick={() => handleAddWinner(type.id)}
                      size="small"
                    >
                      新增
                    </Button>
                  </Box>
                  {typeAwards.map(award => (
                    <Box key={award.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <Typography>{award.chinese_name}</Typography>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleDeleteWinner(award.id)}
                      >
                        刪除
                      </Button>
                    </Box>
                  ))}
                </Box>
              </Grid>
            );
          })}
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
  const generalTypes = awardTypes.filter(type => type.name.includes('技術獎-一般組'));
  const seniorTypes = awardTypes.filter(type => type.name.includes('技術獎-長青組'));
  const netScoreType = awardTypes.find(type => type.name === '淨桿獎');
  const otherTypes = awardTypes.filter(type => 
    !type.name.includes('技術獎-一般組') && 
    !type.name.includes('技術獎-長青組') && 
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
          {netScoreType && renderNetScoreSection()}
          {otherTypes.length > 0 && renderAwardSection('其他獎項', otherTypes)}
        </>
      )}

      <Snackbar
        open={message.open}
        autoHideDuration={6000}
        onClose={() => setMessage(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setMessage(prev => ({ ...prev, open: false }))}
          severity={message.severity}
        >
          {message.text}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Awards; 
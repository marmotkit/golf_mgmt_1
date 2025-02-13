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
  const [winnerName, setWinnerName] = useState('');
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

  const handleAddWinner = async (awardTypeId) => {
    if (!selectedTournament) {
      showMessage('請先選擇賽事', 'error');
      return;
    }

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

      setWinnerName('');
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

  const renderAwardItem = (type) => {
    const typeAwards = awards.filter(a => a.award_type_id === type.id);

    return (
      <Box key={type.id} sx={{ mb: 2 }}>
        <Typography variant="subtitle1">{type.name}</Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <TextField
            size="small"
            value={winnerName}
            onChange={(e) => setWinnerName(e.target.value)}
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
    );
  };

  const renderTechnicalAwards = () => {
    const generalTypes = awardTypes.filter(type => type.name.includes('技術獎-一般組'));
    const seniorTypes = awardTypes.filter(type => type.name.includes('技術獎-長青組'));

    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>技術獎</Typography>
        <Box sx={{ ml: 2 }}>
          <Typography variant="subtitle1" gutterBottom>一般組</Typography>
          <Box sx={{ ml: 2 }}>
            {generalTypes.map(renderAwardItem)}
          </Box>
          <Typography variant="subtitle1" gutterBottom>長青組</Typography>
          <Box sx={{ ml: 2 }}>
            {seniorTypes.map(renderAwardItem)}
          </Box>
        </Box>
      </Paper>
    );
  };

  const renderOtherAwards = () => {
    const otherTypes = awardTypes.filter(type => 
      !type.name.includes('技術獎') && 
      type.name !== '淨桿獎'
    );

    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>其他獎項</Typography>
        <Box sx={{ ml: 2 }}>
          {otherTypes.map(renderAwardItem)}
        </Box>
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
      <Typography variant="h4" gutterBottom>獎項管理</Typography>

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
          {renderTechnicalAwards()}
          {renderOtherAwards()}
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
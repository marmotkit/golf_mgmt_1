import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import * as awardService from '../services/awardService';
import * as tournamentService from '../services/tournamentService';

const Awards = () => {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [awards, setAwards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ open: false, text: '', severity: 'success' });
  const [winnerInputs, setWinnerInputs] = useState({});

  // 加載賽事列表
  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const data = await tournamentService.getAllTournaments();
        setTournaments(data);
      } catch (error) {
        showMessage(error.message, 'error');
      }
    };
    fetchTournaments();
  }, []);

  // 當選擇賽事時加載獎項
  useEffect(() => {
    if (selectedTournament) {
      fetchAwards();
    }
  }, [selectedTournament]);

  const fetchAwards = async () => {
    setLoading(true);
    try {
      const [awardsData, typesData] = await Promise.all([
        awardService.getTournamentAwards(selectedTournament),
        awardService.getAwardTypes()
      ]);
      setAwards(awardsData);
      
      // 初始化輸入框
      const inputs = {};
      typesData.forEach(type => {
        inputs[type.id] = '';
      });
      setWinnerInputs(inputs);
    } catch (error) {
      showMessage(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, severity = 'success') => {
    setMessage({ open: true, text, severity });
  };

  const handleTournamentChange = (event) => {
    setSelectedTournament(event.target.value);
  };

  const handleInputChange = (typeId) => (event) => {
    setWinnerInputs(prev => ({
      ...prev,
      [typeId]: event.target.value
    }));
  };

  const handleAddWinner = async (typeId) => {
    if (!selectedTournament) {
      showMessage('請先選擇賽事', 'error');
      return;
    }

    const winnerName = winnerInputs[typeId];
    if (!winnerName?.trim()) {
      showMessage('請輸入得獎者姓名', 'error');
      return;
    }

    try {
      await awardService.createTournamentAward({
        tournament_id: selectedTournament,
        award_type_id: typeId,
        chinese_name: winnerName.trim()
      });

      // 清空該獎項的輸入框
      setWinnerInputs(prev => ({
        ...prev,
        [typeId]: ''
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

  const renderAwardSection = (title, awards) => {
    if (!awards || awards.length === 0) return null;

    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <List>
          {awards.map(award => (
            <ListItem key={award.id}>
              <ListItemText primary={award.chinese_name} />
              <ListItemSecondaryAction>
                <IconButton edge="end" onClick={() => handleDeleteWinner(award.id)}>
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <TextField
            size="small"
            value={winnerInputs[award.award_type_id] || ''}
            onChange={handleInputChange(award.award_type_id)}
            placeholder="輸入得獎者姓名"
          />
          <Button
            variant="contained"
            onClick={() => handleAddWinner(award.award_type_id)}
          >
            新增
          </Button>
        </Box>
      </Box>
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

      <FormControl sx={{ mb: 4, minWidth: 300 }}>
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

      {selectedTournament && (
        <Paper sx={{ p: 3 }}>
          {/* 技術獎 - 一般組 */}
          {renderAwardSection('技術獎 - 一般組', 
            awards.filter(a => a.award_type?.name.includes('技術獎-一般組'))
          )}
          <Divider sx={{ my: 2 }} />

          {/* 技術獎 - 長青組 */}
          {renderAwardSection('技術獎 - 長青組',
            awards.filter(a => a.award_type?.name.includes('技術獎-長青組'))
          )}
          <Divider sx={{ my: 2 }} />

          {/* 總桿冠軍 */}
          {renderAwardSection('總桿冠軍',
            awards.filter(a => a.award_type?.name === '總桿冠軍')
          )}
          <Divider sx={{ my: 2 }} />

          {/* 淨桿獎 */}
          {renderAwardSection('淨桿獎',
            awards.filter(a => a.award_type?.name === '淨桿獎')
          )}
          <Divider sx={{ my: 2 }} />

          {/* 其他獎項 */}
          {renderAwardSection('其他獎項',
            awards.filter(a => 
              !a.award_type?.name.includes('技術獎') &&
              a.award_type?.name !== '總桿冠軍' &&
              a.award_type?.name !== '淨桿獎'
            )
          )}
        </Paper>
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
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
  CircularProgress,
  Grid
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
  const [awardTypes, setAwardTypes] = useState([]);

  // 加載賽事列表
  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const data = await tournamentService.getAllTournaments();
        // 按照日期升冪排序（從早到晚）
        const sortedTournaments = data.sort((a, b) => 
          new Date(a.date) - new Date(b.date)
        );
        setTournaments(sortedTournaments);
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

  // 頁面載入時獲取所有獎項數據（用於總桿冠軍歷月表列）
  useEffect(() => {
    const fetchAllAwards = async () => {
      setLoading(true);
      try {
        // 獲取所有賽事的獎項數據，以支援歷月表列功能
        const allAwards = await awardService.getAllTournamentAwards();
        setAwards(allAwards);
        
        const typesData = await awardService.getAwardTypes();
        setAwardTypes(typesData);
        
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
    
    fetchAllAwards();
  }, []);

  const fetchAwards = async () => {
    setLoading(true);
    try {
      if (!selectedTournament) return;
      
      // 獲取當前選中賽事的獎項數據
      const tournamentAwards = await awardService.getTournamentAwards(selectedTournament);
      
      // 獲取所有賽事的獎項數據（用於總桿冠軍歷月表列）
      const allAwards = await awardService.getAllTournamentAwards();
      
      // 合併數據：當前賽事的獎項 + 所有賽事的獎項（用於歷月表列）
      const combinedAwards = [...allAwards];
      
      // 更新當前賽事的獎項數據
      const currentAwards = combinedAwards.filter(a => a.tournament_id !== parseInt(selectedTournament));
      combinedAwards.splice(0, combinedAwards.length, ...currentAwards, ...tournamentAwards);
      
      setAwards(combinedAwards);
      
      const typesData = await awardService.getAwardTypes();
      setAwardTypes(typesData);
      
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

  const handleAddWinner = async (typeId, rank = null) => {
    if (!selectedTournament) {
      showMessage('請先選擇賽事', 'error');
      return;
    }

    const inputKey = rank ? `${typeId}_${rank}` : typeId;
    const winnerName = winnerInputs[inputKey];
    if (!winnerName?.trim()) {
      showMessage('請輸入得獎者姓名', 'error');
      return;
    }

    try {
      await awardService.createTournamentAward({
        tournament_id: selectedTournament,
        award_type_id: typeId,
        chinese_name: winnerName.trim(),
        rank: rank
      });

      // 清空該獎項的輸入框
      setWinnerInputs(prev => ({
        ...prev,
        [inputKey]: ''
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

  const renderAwardSection = (awardType) => {
    if (!awardType) return null;

    const typeAwards = awards.filter(a => a.award_type_id === awardType.id);

    // 特殊處理總桿冠軍 - 只顯示當前選中賽事的總桿冠軍
    if (awardType.name === '總桿冠軍') {
      // 只獲取當前選中賽事的總桿冠軍
      const currentTournamentAwards = typeAwards.filter(a => a.tournament_id === parseInt(selectedTournament));
      
      return (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>{awardType.name}</Typography>
          
          {/* 當前賽事的總桿冠軍 */}
          {currentTournamentAwards.length > 0 && (
            <Grid container spacing={2}>
              {currentTournamentAwards.map(award => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={award.id}>
                  <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography>{award.chinese_name}</Typography>
                      {award.remarks && (
                        <Typography variant="body2" color="text.secondary">
                          {award.remarks}
                        </Typography>
                      )}
                    </Box>
                    <IconButton 
                      edge="end" 
                      onClick={() => handleDeleteWinner(award.id)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
          
          {/* 新增總桿冠軍的輸入框 */}
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <TextField
              size="small"
              value={winnerInputs[awardType.id] || ''}
              onChange={handleInputChange(awardType.id)}
              placeholder="輸入得獎者姓名"
              autoComplete="off"
            />
            <Button
              variant="contained"
              onClick={() => handleAddWinner(awardType.id)}
            >
              新增
            </Button>
          </Box>
        </Box>
      );
    }

    // 特殊處理淨桿獎
    if (awardType.name === '淨桿獎') {
      return (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>{awardType.name}</Typography>
          <Grid container spacing={2}>
            {[...Array(10)].map((_, index) => {
              const award = typeAwards.find(a => a.rank === index + 1);
              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      第 {index + 1} 名
                    </Typography>
                    {award ? (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography>{award.chinese_name}</Typography>
                          {award.remarks && (
                            <Typography variant="body2" color="text.secondary">
                              {award.remarks}
                            </Typography>
                          )}
                        </Box>
                        <IconButton 
                          edge="end" 
                          onClick={() => handleDeleteWinner(award.id)}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          size="small"
                          value={winnerInputs[`${awardType.id}_${index + 1}`] || ''}
                          onChange={(e) => handleInputChange(`${awardType.id}_${index + 1}`)(e)}
                          placeholder="輸入得獎者姓名"
                          autoComplete="off"
                          fullWidth
                        />
                        <Button
                          variant="contained"
                          onClick={() => handleAddWinner(awardType.id, index + 1)}
                          size="small"
                        >
                          新增
                        </Button>
                      </Box>
                    )}
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      );
    }

    // 其他獎項的一般顯示方式
    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>{awardType.name}</Typography>
        {typeAwards.length > 0 && (
          <Grid container spacing={2}>
            {typeAwards.map(award => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={award.id}>
                <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography>{award.chinese_name}</Typography>
                    {award.remarks && (
                      <Typography variant="body2" color="text.secondary">
                        {award.remarks}
                      </Typography>
                    )}
                  </Box>
                  <IconButton 
                    edge="end" 
                    onClick={() => handleDeleteWinner(award.id)}
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <TextField
            size="small"
            value={winnerInputs[awardType.id] || ''}
            onChange={handleInputChange(awardType.id)}
            placeholder="輸入得獎者姓名"
            autoComplete="off"
          />
          <Button
            variant="contained"
            onClick={() => handleAddWinner(awardType.id)}
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

      {/* 總桿冠軍歷月表列 - 直接顯示在最上面 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>總桿冠軍歷月表列</Typography>
        <Grid container spacing={2}>
          {tournaments.map((tournament) => {
            const tournamentAwards = awards.filter(a => {
              // 找到總桿冠軍獎項類型
              const grossChampionType = awardTypes.find(type => type.name === '總桿冠軍');
              if (!grossChampionType) return false;
              
              return a.award_type_id === grossChampionType.id && 
                     a.tournament_id === tournament.id;
            });
            
            if (tournamentAwards.length === 0) return null;
            
            // 只取第一個得獎者（總桿冠軍通常只有一個）
            const firstAward = tournamentAwards[0];
            
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={tournament.id}>
                <Paper 
                  sx={{ 
                    p: 2, 
                    border: '1px solid #e0e0e0',
                    backgroundColor: '#fafafa'
                  }}
                >
                  <Typography variant="subtitle2" gutterBottom color="text.secondary">
                    {tournament.name}
                  </Typography>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      mt: 1
                    }}
                  >
                    <Typography variant="body2">
                      {firstAward.chinese_name}
                    </Typography>
                    <IconButton 
                      edge="end" 
                      onClick={() => handleDeleteWinner(firstAward.id)}
                      size="small"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

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
          {awardTypes
            .map(awardType => (
              <React.Fragment key={awardType.id}>
                {renderAwardSection(awardType)}
                <Divider sx={{ my: 2 }} />
              </React.Fragment>
            ))}
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
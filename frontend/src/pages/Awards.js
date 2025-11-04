import React, { useState, useEffect, useMemo } from 'react';
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
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import * as awardService from '../services/awardService';
import * as tournamentService from '../services/tournamentService';
import axios from '../utils/axios';

const Awards = () => {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [awards, setAwards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ open: false, text: '', severity: 'success' });
  const [winnerInputs, setWinnerInputs] = useState({});
  const [awardTypes, setAwardTypes] = useState([]);
  const [selectedYear, setSelectedYear] = useState('all');

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

  // 獲取所有可用的年度列表
  const availableYears = useMemo(() => {
    const years = new Set();
    tournaments.forEach(tournament => {
      if (tournament.date) {
        const year = new Date(tournament.date).getFullYear();
        years.add(year);
      }
    });
    return Array.from(years).sort((a, b) => b - a); // 降序排列（最新的在前）
  }, [tournaments]);

  // 根據選擇的年度篩選賽事
  const filteredTournaments = useMemo(() => {
    if (selectedYear === 'all') {
      return tournaments;
    }
    return tournaments.filter(tournament => {
      if (!tournament.date) return false;
      const year = new Date(tournament.date).getFullYear();
      return year === parseInt(selectedYear);
    });
  }, [tournaments, selectedYear]);

  // 處理年度篩選變更
  const handleYearChange = (event) => {
    setSelectedYear(event.target.value);
    // 如果當前選擇的賽事不在篩選後的列表中，清除選擇
    const newYear = event.target.value;
    if (newYear !== 'all' && selectedTournament) {
      const currentTournament = tournaments.find(t => t.id === parseInt(selectedTournament));
      if (currentTournament) {
        const year = new Date(currentTournament.date).getFullYear();
        if (year !== parseInt(newYear)) {
          setSelectedTournament('');
        }
      }
    }
  };

  // 初始化時自動設置為當前年度
  useEffect(() => {
    if (availableYears.length > 0 && selectedYear === 'all') {
      const currentYear = new Date().getFullYear();
      if (availableYears.includes(currentYear)) {
        setSelectedYear(currentYear.toString());
      } else {
        // 如果沒有當前年度，使用最新的年度
        setSelectedYear(availableYears[0].toString());
      }
    }
  }, [availableYears, selectedYear]);

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
      
      // 設置獎項數據：當前賽事的獎項用於顯示，所有獎項用於歷月表列
      setAwards(allAwards); // 保持所有獎項用於歷月表列
      
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

  // 處理匯出資料
  const handleExport = async () => {
    if (!selectedTournament) {
      showMessage('請先選擇賽事', 'warning');
      return;
    }

    try {
      // 獲取選中的賽事名稱
      const tournament = tournaments.find(t => t.id === selectedTournament);
      if (!tournament) {
        showMessage('找不到賽事資訊', 'error');
        return;
      }

      const response = await axios.get(
        `/awards/export?tournament_name=${encodeURIComponent(tournament.name)}`,
        { responseType: 'blob' }
      );

      // 建立下載連結
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // 設定檔案名稱
      const fileName = `獎項管理_${tournament.name}_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.setAttribute('download', fileName);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      showMessage('匯出成功');
    } catch (error) {
      showMessage('匯出失敗: ' + (error.message || '未知錯誤'), 'error');
    }
  };

  const renderAwardSection = (awardType) => {
    if (!awardType) return null;

    // 只獲取當前選中賽事的獎項
    const typeAwards = awards.filter(a => 
      a.award_type_id === awardType.id && 
      a.tournament_id === parseInt(selectedTournament)
    );

    // 特殊處理總桿冠軍 - 只顯示當前選中賽事的總桿冠軍
    if (awardType.name === '總桿冠軍') {
      return (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>{awardType.name}</Typography>
          
          {/* 當前賽事的總桿冠軍 */}
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">總桿冠軍歷月表列</Typography>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>年度篩選</InputLabel>
            <Select
              value={selectedYear}
              label="年度篩選"
              onChange={handleYearChange}
            >
              <MenuItem value="all">全部年度</MenuItem>
              {availableYears.map(year => (
                <MenuItem key={year} value={year.toString()}>
                  {year} 年
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Grid container spacing={2}>
          {filteredTournaments.map((tournament) => {
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

      <Box sx={{ mb: 4, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>年度篩選</InputLabel>
          <Select
            value={selectedYear}
            label="年度篩選"
            onChange={handleYearChange}
          >
            <MenuItem value="all">全部年度</MenuItem>
            {availableYears.map(year => (
              <MenuItem key={year} value={year.toString()}>
                {year} 年
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 300 }}>
          <InputLabel>選擇賽事</InputLabel>
          <Select
            value={selectedTournament}
            onChange={handleTournamentChange}
            label="選擇賽事"
          >
            {filteredTournaments.map((tournament) => (
              <MenuItem key={tournament.id} value={tournament.id}>
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
            disabled={loading}
            sx={{ minWidth: 120 }}
          >
            匯出資料
          </Button>
        )}
      </Box>

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
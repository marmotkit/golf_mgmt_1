import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Typography,
  IconButton,
  Grid,
  Divider,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import * as awardService from '../services/awardService';
import * as tournamentService from '../services/tournamentService';
import { message } from 'antd';

const Awards = () => {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [awards, setAwards] = useState([]);
  const [awardTypes, setAwardTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentEditId, setCurrentEditId] = useState(null);
  const [formData, setFormData] = useState({
    award_type: '',
    winner_name: '',
    category: '',
    score: '',
    rank: '',
    hole_number: '',
    description: ''
  });

  // 初始化數據
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [tournamentsData, typesData] = await Promise.all([
          tournamentService.getAllTournaments(),
          awardService.getAwardTypes()
        ]);
        setTournaments(tournamentsData);
        setAwardTypes(typesData);
      } catch (error) {
        console.error('初始化數據失敗：', error);
      }
    };
    fetchInitialData();
  }, []);

  // 加載賽事獎項
  useEffect(() => {
    // 獲取獎項類型
    const fetchAwardTypes = async () => {
      try {
        const response = await fetch('/api/awards/types');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setAwardTypes(data);
      } catch (error) {
        console.error('獲取獎項類型失敗:', error);
        message.error('獲取獎項類型失敗');
      }
    };

    // 獲取獎項列表
    const fetchAwards = async () => {
      if (!selectedTournament) return;
      try {
        const response = await fetch(`/api/awards?tournament_id=${selectedTournament}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setAwards(data);
      } catch (error) {
        console.error('獲取獎項列表失敗:', error);
        message.error('獲取獎項列表失敗');
      }
    };

    fetchAwardTypes();
    fetchAwards();
  }, [selectedTournament]);

  const handleTournamentChange = (event) => {
    setSelectedTournament(event.target.value);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAdd = (awardType) => {
    setModalMode('add');
    setFormData({
      award_type: awardType.id,
      winner_name: '',
      category: '',
      score: '',
      rank: '',
      hole_number: '',
      description: ''
    });
    setModalVisible(true);
  };

  const handleEdit = (award) => {
    setModalMode('edit');
    setCurrentEditId(award.id);
    setFormData({
      award_type: award.award_type,
      winner_name: award.winner_name,
      category: award.category || '',
      score: award.score || '',
      rank: award.rank || '',
      hole_number: award.hole_number || '',
      description: award.description || ''
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('確定要刪除這個獎項嗎？')) {
      try {
        await awardService.deleteTournamentAward(id);
        loadAwards();
      } catch (error) {
        console.error('刪除失敗：', error);
      }
    }
  };

  const handleSubmit = async () => {
    try {
      const awardData = {
        tournament_id: selectedTournament,
        ...formData
      };

      if (modalMode === 'add') {
        await awardService.createTournamentAward(awardData);
      } else {
        await awardService.updateTournamentAward(currentEditId, awardData);
      }

      setModalVisible(false);
      loadAwards();
    } catch (error) {
      console.error(modalMode === 'add' ? '新增失敗：' : '更新失敗：', error);
    }
  };

  // 根據獎項類型分組顯示獎項
  const groupedAwards = awards.reduce((acc, award) => {
    const type = awardTypes.find(t => t.id === award.award_type);
    if (!type) return acc;
    
    if (!acc[type.name]) {
      acc[type.name] = [];
    }
    acc[type.name].push(award);
    return acc;
  }, {});

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
        <Grid container spacing={3}>
          {awardTypes.map((type) => (
            <Grid item xs={12} key={type.id}>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">{type.name}</Typography>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => handleAdd(type)}
                  >
                    新增
                  </Button>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>得獎者</TableCell>
                        {type.has_category && <TableCell>組別</TableCell>}
                        {type.has_score && <TableCell>分數</TableCell>}
                        {type.has_rank && <TableCell>名次</TableCell>}
                        {type.has_hole_number && <TableCell>洞號</TableCell>}
                        <TableCell>備註</TableCell>
                        <TableCell>操作</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(groupedAwards[type.name] || []).map((award) => (
                        <TableRow key={award.id}>
                          <TableCell>{award.winner_name}</TableCell>
                          {type.has_category && <TableCell>{award.category}</TableCell>}
                          {type.has_score && <TableCell>{award.score}</TableCell>}
                          {type.has_rank && <TableCell>{award.rank}</TableCell>}
                          {type.has_hole_number && <TableCell>{award.hole_number}</TableCell>}
                          <TableCell>{award.description}</TableCell>
                          <TableCell>
                            <IconButton size="small" onClick={() => handleEdit(award)}>
                              <EditIcon />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDelete(award.id)}>
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={modalVisible} onClose={() => setModalVisible(false)}>
        <DialogTitle>
          {modalMode === 'add' ? '新增獎項' : '編輯獎項'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="得獎者"
              name="winner_name"
              value={formData.winner_name}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
            />

            {awardTypes.find(t => t.id === formData.award_type)?.has_category && (
              <TextField
                fullWidth
                label="組別"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                sx={{ mb: 2 }}
              />
            )}

            {awardTypes.find(t => t.id === formData.award_type)?.has_score && (
              <TextField
                fullWidth
                label="分數"
                name="score"
                type="number"
                value={formData.score}
                onChange={handleInputChange}
                sx={{ mb: 2 }}
              />
            )}

            {awardTypes.find(t => t.id === formData.award_type)?.has_rank && (
              <TextField
                fullWidth
                label="名次"
                name="rank"
                type="number"
                value={formData.rank}
                onChange={handleInputChange}
                sx={{ mb: 2 }}
              />
            )}

            {awardTypes.find(t => t.id === formData.award_type)?.has_hole_number && (
              <TextField
                fullWidth
                label="洞號"
                name="hole_number"
                type="number"
                value={formData.hole_number}
                onChange={handleInputChange}
                sx={{ mb: 2 }}
              />
            )}

            <TextField
              fullWidth
              label="備註"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              multiline
              rows={4}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalVisible(false)}>取消</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            確定
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Awards; 
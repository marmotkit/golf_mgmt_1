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
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import * as awardService from '../services/awardService';
import * as tournamentService from '../services/tournamentService';

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
    description: ''
  });

  // 表格列定義
  const columns = [
    { id: 'award_type_name', label: '獎項類型' },
    { id: 'winner_name', label: '得獎者' },
    { id: 'description', label: '備註' },
    { id: 'actions', label: '操作', width: 120 }
  ];

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
  const loadAwards = async () => {
    if (!selectedTournament) return;
    setLoading(true);
    try {
      const data = await awardService.getTournamentAwards(selectedTournament);
      const awardsWithTypes = data.map(award => ({
        ...award,
        award_type_name: awardTypes.find(t => t.id === award.award_type)?.name || '未知'
      }));
      setAwards(awardsWithTypes);
    } catch (error) {
      console.error('加載獎項失敗：', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAwards();
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

  const handleAdd = () => {
    setModalMode('add');
    setFormData({
      award_type: '',
      winner_name: '',
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
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAdd}
            >
              新增獎項
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell key={column.id} style={{ width: column.width }}>
                      {column.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {awards.map((award) => (
                  <TableRow key={award.id}>
                    <TableCell>{award.award_type_name}</TableCell>
                    <TableCell>{award.winner_name}</TableCell>
                    <TableCell>{award.description}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEdit(award)} size="small">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(award.id)} size="small" color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      <Dialog open={modalVisible} onClose={() => setModalVisible(false)}>
        <DialogTitle>
          {modalMode === 'add' ? '新增獎項' : '編輯獎項'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>獎項類型</InputLabel>
              <Select
                name="award_type"
                value={formData.award_type}
                onChange={handleInputChange}
                label="獎項類型"
              >
                {awardTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="得獎者"
              name="winner_name"
              value={formData.winner_name}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
            />

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
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import config from '../config';

const Awards = () => {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [awards, setAwards] = useState([]);
  const [awardTypes, setAwardTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAward, setEditingAward] = useState(null);
  const [formData, setFormData] = useState({
    award_type_id: '',
    chinese_name: '',
    score: '',
    rank: '',
    hole_number: '',
    remarks: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // 顯示提示信息
  const showMessage = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  // 加載賽事列表
  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const response = await fetch(`${config.apiBaseUrl}/tournaments`);
        if (!response.ok) throw new Error('獲取賽事列表失敗');
        const data = await response.json();
        setTournaments(data);
      } catch (error) {
        console.error('獲取賽事列表失敗:', error);
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
        console.error('獲取獎項類型失敗:', error);
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
        if (!response.ok) throw new Error('獲取獎項列表失敗');
        const data = await response.json();
        setAwards(data);
      } catch (error) {
        console.error('獲取獎項列表失敗:', error);
        showMessage('獲取獎項列表失敗', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchAwards();
  }, [selectedTournament]);

  const handleTournamentChange = (event) => {
    setSelectedTournament(event.target.value);
  };

  const handleAddClick = () => {
    setEditingAward(null);
    setFormData({
      award_type_id: '',
      chinese_name: '',
      score: '',
      rank: '',
      hole_number: '',
      remarks: ''
    });
    setDialogOpen(true);
  };

  const handleEditClick = (award) => {
    setEditingAward(award);
    setFormData({
      award_type_id: award.award_type_id,
      chinese_name: award.chinese_name || '',
      score: award.score || '',
      rank: award.rank || '',
      hole_number: award.hole_number || '',
      remarks: award.remarks || ''
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm('確定要刪除這個獎項嗎？')) return;
    
    try {
      const response = await fetch(`${config.apiBaseUrl}/awards/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('刪除獎項失敗');
      
      setAwards(awards.filter(award => award.id !== id));
      showMessage('刪除成功');
    } catch (error) {
      console.error('刪除獎項失敗:', error);
      showMessage('刪除獎項失敗', 'error');
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingAward(null);
    setFormData({
      award_type_id: '',
      chinese_name: '',
      score: '',
      rank: '',
      hole_number: '',
      remarks: ''
    });
  };

  const handleSubmit = async () => {
    if (!formData.award_type_id || !formData.chinese_name) {
      showMessage('請填寫必要欄位', 'error');
      return;
    }

    const submitData = {
      ...formData,
      tournament_id: selectedTournament
    };

    try {
      const url = editingAward
        ? `${config.apiBaseUrl}/awards/${editingAward.id}`
        : `${config.apiBaseUrl}/awards`;
      
      const response = await fetch(url, {
        method: editingAward ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) throw new Error(editingAward ? '更新獎項失敗' : '新增獎項失敗');

      const data = await response.json();
      
      if (editingAward) {
        setAwards(awards.map(award => 
          award.id === editingAward.id ? data : award
        ));
      } else {
        setAwards([...awards, data]);
      }

      handleDialogClose();
      showMessage(editingAward ? '更新成功' : '新增成功');
    } catch (error) {
      console.error(editingAward ? '更新獎項失敗:' : '新增獎項失敗:', error);
      showMessage(editingAward ? '更新獎項失敗' : '新增獎項失敗', 'error');
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
        <Paper sx={{ mt: 3 }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddClick}
            >
              新增獎項
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>獎項類型</TableCell>
                  <TableCell>得獎者</TableCell>
                  <TableCell>分數</TableCell>
                  <TableCell>名次</TableCell>
                  <TableCell>洞號</TableCell>
                  <TableCell>備註</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {awards.map((award) => (
                  <TableRow key={award.id}>
                    <TableCell>
                      {awardTypes.find(t => t.id === award.award_type_id)?.name || '未知'}
                    </TableCell>
                    <TableCell>{award.chinese_name}</TableCell>
                    <TableCell>{award.score}</TableCell>
                    <TableCell>{award.rank}</TableCell>
                    <TableCell>{award.hole_number}</TableCell>
                    <TableCell>{award.remarks}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleEditClick(award)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(award.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Dialog open={dialogOpen} onClose={handleDialogClose}>
        <DialogTitle>
          {editingAward ? '編輯獎項' : '新增獎項'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>獎項類型</InputLabel>
              <Select
                name="award_type_id"
                value={formData.award_type_id}
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
              name="chinese_name"
              value={formData.chinese_name}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="分數"
              name="score"
              type="number"
              value={formData.score}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="名次"
              name="rank"
              type="number"
              value={formData.rank}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="洞號"
              name="hole_number"
              type="number"
              value={formData.hole_number}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="備註"
              name="remarks"
              value={formData.remarks}
              onChange={handleInputChange}
              multiline
              rows={4}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>取消</Button>
          <Button onClick={handleSubmit} variant="contained">
            確定
          </Button>
        </DialogActions>
      </Dialog>

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
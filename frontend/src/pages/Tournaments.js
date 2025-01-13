import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
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
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import TournamentDialog from '../components/TournamentDialog';
import * as tournamentService from '../services/tournamentService';
import dayjs from 'dayjs';

function Tournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // 获取赛事列表
  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const data = await tournamentService.getAllTournaments();
      setTournaments(data);
    } catch (error) {
      showSnackbar(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  // 显示提示信息
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // 处理创建赛事
  const handleCreateClick = () => {
    setSelectedTournament(null);
    setDialogOpen(true);
  };

  // 处理编辑赛事
  const handleEditClick = (tournament) => {
    console.log('Editing tournament:', tournament);
    const formattedTournament = {
      ...tournament,
      date: dayjs(tournament.date)
    };
    console.log('Formatted tournament:', formattedTournament);
    setSelectedTournament(formattedTournament);
    setDialogOpen(true);
  };

  // 处理删除赛事
  const handleDeleteClick = (tournament) => {
    setSelectedTournament(tournament);
    setDeleteDialogOpen(true);
  };

  // 处理对话框关闭
  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedTournament(null);
  };

  // 处理表单提交
  const handleDialogSubmit = async (formData) => {
    try {
      console.log('Submitting form data:', formData);
      if (selectedTournament) {
        await tournamentService.updateTournament(selectedTournament.id, formData);
        showSnackbar('賽事更新成功');
      } else {
        await tournamentService.createTournament(formData);
        showSnackbar('賽事創建成功');
      }
      handleDialogClose();
      fetchTournaments();
    } catch (error) {
      console.error('Error submitting tournament:', error);
      showSnackbar(error.response?.data?.error || '操作失敗', 'error');
    }
  };

  // 处理删除确认
  const handleDeleteConfirm = async () => {
    try {
      await tournamentService.deleteTournament(selectedTournament.id);
      showSnackbar('賽事刪除成功');
      await fetchTournaments();
      setDeleteDialogOpen(false);
    } catch (error) {
      showSnackbar(error.message, 'error');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* 标题和新增按钮 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">賽事管理</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateClick}
        >
          新增賽事
        </Button>
      </Box>

      {/* 赛事列表 */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>賽事名稱</TableCell>
              <TableCell>球場</TableCell>
              <TableCell>日期</TableCell>
              <TableCell>備註</TableCell>
              <TableCell width="120">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tournaments.map((tournament) => (
              <TableRow key={tournament.id}>
                <TableCell>{tournament.name}</TableCell>
                <TableCell>{tournament.location}</TableCell>
                <TableCell>{tournament.date}</TableCell>
                <TableCell>{tournament.notes}</TableCell>
                <TableCell>
                  <IconButton 
                    onClick={() => handleEditClick(tournament)} 
                    color="primary"
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    onClick={() => handleDeleteClick(tournament)} 
                    color="error"
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 创建/编辑对话框 */}
      <TournamentDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSubmit={handleDialogSubmit}
        tournament={selectedTournament}
      />

      {/* 删除确认对话框 */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>確認刪除</DialogTitle>
        <DialogContent>
          確定要刪除賽事 "{selectedTournament?.name}" 嗎？此操作無法復原。
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>取消</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            刪除
          </Button>
        </DialogActions>
      </Dialog>

      {/* 提示信息 */}
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
}

export default Tournaments;

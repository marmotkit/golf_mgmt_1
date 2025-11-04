import React, { useState, useEffect, useMemo } from 'react';
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
  TableSortLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('date');
  const [selectedYear, setSelectedYear] = useState('all');

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

  // 处理排序
  const handleRequestSort = () => {
    const isAsc = orderBy === 'date' && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy('date');
  };

  // 獲取所有可用的年度列表
  const availableYears = useMemo(() => {
    const years = new Set();
    tournaments.forEach(tournament => {
      if (tournament.date) {
        const year = dayjs(tournament.date).year();
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
      const year = dayjs(tournament.date).year();
      return year === parseInt(selectedYear);
    });
  }, [tournaments, selectedYear]);

  // 排序函数
  const sortTournaments = (tournaments) => {
    return tournaments.sort((a, b) => {
      const dateA = dayjs(a.date);
      const dateB = dayjs(b.date);
      if (order === 'asc') {
        return dateA.isBefore(dateB) ? -1 : 1;
      } else {
        return dateB.isBefore(dateA) ? -1 : 1;
      }
    });
  };

  // 處理年度篩選變更
  const handleYearChange = (event) => {
    setSelectedYear(event.target.value);
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

      {/* 年度篩選 */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
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

      {/* 赛事列表 */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>賽事名稱</TableCell>
              <TableCell>球場</TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'date'}
                  direction={order}
                  onClick={handleRequestSort}
                >
                  日期
                </TableSortLabel>
              </TableCell>
              <TableCell>備註</TableCell>
              <TableCell width="120">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortTournaments([...filteredTournaments]).map((tournament) => (
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

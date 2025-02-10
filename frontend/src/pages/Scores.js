import React, { useState, useEffect } from 'react';
import {
  Box,
  Tab,
  Tabs,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Container,
  Paper,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
  IconButton,
  TableSortLabel,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import axios from '../utils/axios';
import { useSnackbar } from 'notistack';
import DownloadIcon from '@mui/icons-material/Download';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function AnnualScoreRow({ row }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{row.name}</TableCell>
        <TableCell>{row.gender === 'F' ? '女' : '男'}</TableCell>
        <TableCell>{row.full_name}</TableCell>
        <TableCell align="right">{row.avg_gross_score}</TableCell>
        <TableCell align="right">{row.participation_count}</TableCell>
        <TableCell align="right">{row.avg_handicap}</TableCell>
        <TableCell align="right">{row.total_points}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                賽事詳情
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>賽事名稱</TableCell>
                    <TableCell align="right">新差點</TableCell>
                    <TableCell align="right">總桿</TableCell>
                    <TableCell align="right">淨桿</TableCell>
                    <TableCell align="right">淨桿名次</TableCell>
                    <TableCell align="right">積分</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {row.tournaments.map((tournament, index) => (
                    <TableRow key={index}>
                      <TableCell component="th" scope="row">
                        {tournament.tournament_name}
                      </TableCell>
                      <TableCell align="right">{tournament.new_handicap?.toFixed(1) || '-'}</TableCell>
                      <TableCell align="right">{tournament.gross_score || '-'}</TableCell>
                      <TableCell align="right">{tournament.net_score?.toFixed(1) || '-'}</TableCell>
                      <TableCell align="right">{tournament.rank || '-'}</TableCell>
                      <TableCell align="right">{tournament.points || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

function Scores() {
  const [value, setValue] = useState(0);
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [scores, setScores] = useState([]);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedTournaments, setSelectedTournaments] = useState([]);
  const [annualStats, setAnnualStats] = useState([]);
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('total_points');
  const { enqueueSnackbar } = useSnackbar();

  const columns = [
    { field: 'member_number', headerName: '會員編號', width: 120 },
    { field: 'full_name', headerName: 'HOLE', width: 200 },
    { field: 'chinese_name', headerName: '姓名', width: 120 },
    { field: 'rank', headerName: '淨桿名次', width: 100, type: 'number' },
    { field: 'gross_score', headerName: '總桿數', width: 100, type: 'number' },
    { 
      field: 'previous_handicap', 
      headerName: '前次差點', 
      width: 100,
      type: 'number',
      valueFormatter: (params) => {
        if (params.value == null) return '';
        return params.value.toFixed(1);
      }
    },
    { 
      field: 'net_score', 
      headerName: '淨桿桿數', 
      width: 100,
      type: 'number',
      valueFormatter: (params) => {
        if (params.value == null) return '';
        return params.value.toFixed(1);
      }
    },
    { 
      field: 'handicap_change', 
      headerName: '差點增減', 
      width: 100,
      type: 'number',
      valueFormatter: (params) => {
        if (params.value == null) return '';
        return params.value.toFixed(2);
      }
    },
    { 
      field: 'new_handicap', 
      headerName: '新差點', 
      width: 100,
      type: 'number',
      valueFormatter: (params) => {
        if (params.value == null) return '';
        return params.value.toFixed(2);
      }
    },
    { field: 'points', headerName: '積分', width: 100, type: 'number' }
  ];

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      fetchScores(selectedTournament.id);
    }
  }, [selectedTournament]);

  const fetchTournaments = async () => {
    try {
      const response = await axios.get('/api/tournaments');
      setTournaments(response.data);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    }
  };

  const fetchScores = async (tournamentId) => {
    try {
      const response = await axios.get(`/api/scores?tournament_id=${tournamentId}`);
      const scoresWithId = response.data.map((score, index) => ({
        ...score,
        id: index,
      }));
      setScores(scoresWithId);
    } catch (error) {
      console.error('Error fetching scores:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleTournamentSelect = (tournament) => {
    setSelectedTournament(tournament);
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !selectedTournament) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('tournament_id', selectedTournament.id);

    try {
      const response = await axios.post('/api/scores/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setOpenUploadDialog(false);
      setSelectedFile(null);
      fetchScores(selectedTournament.id);
    } catch (error) {
      console.error('Error uploading scores:', error);
      if (error.response) {
        console.error('Error details:', error.response.data);
        alert(`上傳失敗: ${error.response.data.error}\n${error.response.data.details || ''}`);
      } else {
        alert('上傳失敗：請檢查文件格式是否正確');
      }
    }
  };

  const handleClearScores = async () => {
    try {
      await axios.post('/api/scores/clear');
      alert('成績資料已清除');
      if (selectedTournament) {
        fetchScores(selectedTournament.id);
      }
    } catch (error) {
      console.error('Error clearing scores:', error);
      alert('清除成績資料失敗');
    }
  };

  const handleAnnualTournamentToggle = (tournamentId) => {
    setSelectedTournaments(prev => {
      const isSelected = prev.includes(tournamentId);
      if (isSelected) {
        return prev.filter(id => id !== tournamentId);
      } else {
        return [...prev, tournamentId];
      }
    });
  };

  const calculateAnnualStats = async () => {
    try {
      const response = await axios.post('/api/scores/annual-stats', {
        tournament_ids: selectedTournaments
      });
      setAnnualStats(response.data);
    } catch (error) {
      console.error('Error calculating annual stats:', error);
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      } else {
        alert('計算年度總成績時發生錯誤');
      }
    }
  };

  useEffect(() => {
    if (selectedTournaments.length > 0) {
      calculateAnnualStats();
    } else {
      setAnnualStats([]);
    }
  }, [selectedTournaments]);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortData = (data) => {
    return data.sort((a, b) => {
      let valueA = a[orderBy];
      let valueB = b[orderBy];

      // 處理特殊欄位的排序邏輯
      if (orderBy === 'gender') {
        valueA = a[orderBy] === 'F' ? 0 : 1;
        valueB = b[orderBy] === 'F' ? 0 : 1;
      }

      if (order === 'desc') {
        return valueB < valueA ? -1 : valueB > valueA ? 1 : 0;
      } else {
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      }
    });
  };

  const renderSortLabel = (property, label, align = 'left') => (
    <TableCell align={align}>
      <TableSortLabel
        active={orderBy === property}
        direction={orderBy === property ? order : 'asc'}
        onClick={() => handleRequestSort(property)}
      >
        {label}
      </TableSortLabel>
    </TableCell>
  );

  const handleExportScores = async () => {
    try {
      const response = await axios.get(`/api/scores/export/${selectedTournament.id}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedTournament.name}_成績表.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      enqueueSnackbar('成績匯出成功', { variant: 'success' });
    } catch (error) {
      console.error('匯出成績時發生錯誤:', error);
      enqueueSnackbar('匯出成績失敗', { variant: 'error' });
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value} onChange={(e, newValue) => setValue(newValue)}>
            <Tab label="賽事成績" />
            <Tab label="年度總成績" />
          </Tabs>
        </Box>

        <TabPanel value={value} index={0}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              選擇賽事
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {tournaments.map((tournament) => (
                <Button
                  key={tournament.id}
                  variant={selectedTournament?.id === tournament.id ? 'contained' : 'outlined'}
                  onClick={() => handleTournamentSelect(tournament)}
                >
                  {tournament.name}
                </Button>
              ))}
            </Box>
          </Box>

          {selectedTournament && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  {selectedTournament.name} 成績表
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<DownloadIcon />}
                    onClick={handleExportScores}
                    disabled={scores.length === 0}
                    sx={{ mr: 2 }}
                  >
                    匯出成績
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => setOpenUploadDialog(true)}
                  >
                    匯入成績
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleClearScores}
                    sx={{ ml: 2 }}
                  >
                    清除所有成績
                  </Button>
                </Box>
              </Box>

              <Box sx={{ height: 400, width: '100%' }}>
                <DataGrid
                  rows={scores}
                  columns={columns}
                  pageSize={5}
                  rowsPerPageOptions={[5]}
                  disableSelectionOnClick
                />
              </Box>
            </>
          )}
        </TabPanel>

        <TabPanel value={value} index={1}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              選擇要統計的賽事
            </Typography>
            <FormGroup row>
              {tournaments.map((tournament) => (
                <FormControlLabel
                  key={tournament.id}
                  control={
                    <Checkbox
                      checked={selectedTournaments.includes(tournament.id)}
                      onChange={() => handleAnnualTournamentToggle(tournament.id)}
                    />
                  }
                  label={tournament.name}
                />
              ))}
            </FormGroup>
          </Box>

          {annualStats.length > 0 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell />
                    {renderSortLabel('name', '姓名')}
                    {renderSortLabel('gender', '性別')}
                    {renderSortLabel('full_name', '級別')}
                    {renderSortLabel('avg_gross_score', '總桿平均', 'right')}
                    {renderSortLabel('participation_count', '參與次數', 'right')}
                    {renderSortLabel('avg_handicap', '差點平均', 'right')}
                    {renderSortLabel('total_points', '年度積分', 'right')}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortData([...annualStats]).map((row) => (
                    <AnnualScoreRow key={row.member_number} row={row} />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
      </Paper>

      <Dialog open={openUploadDialog} onClose={() => setOpenUploadDialog(false)}>
        <DialogTitle>上傳成績檔案</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setSelectedFile(e.target.files[0])}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUploadDialog(false)}>取消</Button>
          <Button onClick={handleFileUpload} variant="contained" disabled={!selectedFile}>
            上傳
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Scores;

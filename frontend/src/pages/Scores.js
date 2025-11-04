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
  TextField,
  InputAdornment,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import axios from '../utils/axios';
import { useSnackbar } from 'notistack';
import DownloadIcon from '@mui/icons-material/Download';
import * as tournamentService from '../services/tournamentService';
import * as scoreService from '../services/scoreService';

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
  const [filteredScores, setFilteredScores] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [annualStats, setAnnualStats] = useState([]);
  const [filteredAnnualStats, setFilteredAnnualStats] = useState([]);
  const [annualSearchTerm, setAnnualSearchTerm] = useState('');
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedTournaments, setSelectedTournaments] = useState([]);
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
      const data = await tournamentService.getAllTournaments();
      // 按照日期升冪排序（從早到晚）
      const sortedTournaments = data.sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      );
      setTournaments(sortedTournaments);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    }
  };

  const fetchScores = async (tournamentId) => {
    try {
      const response = await scoreService.getScores(tournamentId);
      const scoresWithId = response.map((score, index) => ({
        ...score,
        id: index,
      }));
      setScores(scoresWithId);
      setFilteredScores(scoresWithId);
    } catch (error) {
      console.error('Error fetching scores:', error);
    }
  };

  // 搜尋功能
  const handleSearch = (event) => {
    const term = event.target.value;
    setSearchTerm(term);
    
    if (!term.trim()) {
      setFilteredScores(scores);
      return;
    }

    const filtered = scores.filter(score => 
      score.member_number?.toString().includes(term) ||
      score.full_name?.toLowerCase().includes(term.toLowerCase()) ||
      score.chinese_name?.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredScores(filtered);
  };

  // 清除搜尋
  const handleClearSearch = () => {
    setSearchTerm('');
    setFilteredScores(scores);
  };

  // 年度總成績搜尋功能
  const handleAnnualSearch = (event) => {
    const term = event.target.value;
    setAnnualSearchTerm(term);
    
    if (!term.trim()) {
      setFilteredAnnualStats(annualStats);
      return;
    }

    const filtered = annualStats.filter(stat => 
      stat.name?.toLowerCase().includes(term.toLowerCase()) ||
      stat.full_name?.toLowerCase().includes(term.toLowerCase()) ||
      stat.member_number?.toString().includes(term)
    );
    setFilteredAnnualStats(filtered);
  };

  // 清除年度總成績搜尋
  const handleClearAnnualSearch = () => {
    setAnnualSearchTerm('');
    setFilteredAnnualStats(annualStats);
  };

  const handleTabChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleTournamentSelect = (tournament) => {
    setSelectedTournament(tournament);
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !selectedTournament) {
      enqueueSnackbar('請選擇檔案和賽事', { variant: 'error' });
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('tournament_id', selectedTournament.id);

    try {
      await scoreService.uploadScores(selectedTournament.id, formData);
      enqueueSnackbar('成績上傳成功', { variant: 'success' });
      setOpenUploadDialog(false);
      setSelectedFile(null);
      fetchScores(selectedTournament.id);
    } catch (error) {
      console.error('Error uploading scores:', error);
      if (error.response?.data?.error) {
        enqueueSnackbar(`上傳失敗: ${error.response.data.error}`, { variant: 'error' });
      } else {
        enqueueSnackbar('上傳失敗：請檢查文件格式是否正確', { variant: 'error' });
      }
    }
  };

  const handleClearScores = async () => {
    try {
      await scoreService.clearScores();
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
      const response = await scoreService.calculateAnnualStats(selectedTournaments);
      setAnnualStats(response);
      setFilteredAnnualStats(response);
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
    if (!orderBy) return data;

    return [...data].sort((a, b) => {
      if (orderBy === 'rank' || orderBy === 'gross_score' || orderBy === 'net_score' || 
          orderBy === 'previous_handicap' || orderBy === 'new_handicap' || orderBy === 'handicap_change' || 
          orderBy === 'points') {
        // 數值型欄位的升冪排序
        const aValue = a[orderBy] === null ? Infinity : a[orderBy];
        const bValue = b[orderBy] === null ? Infinity : b[orderBy];
        return order === 'asc' ? aValue - bValue : bValue - aValue;
      } else {
        // 文字型欄位的升冪排序，確保轉換為字串
        const aValue = (a[orderBy] || '').toString();
        const bValue = (b[orderBy] || '').toString();
        return order === 'asc' ? 
          aValue.localeCompare(bValue, 'zh-TW') : 
          bValue.localeCompare(aValue, 'zh-TW');
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
      const response = await scoreService.exportScores(selectedTournament.id);
      const url = window.URL.createObjectURL(new Blob([response]));
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

  const handleExportAnnualStats = async () => {
    if (selectedTournaments.length === 0) {
      enqueueSnackbar('請先選擇至少一個賽事', { variant: 'warning' });
      return;
    }

    if (annualStats.length === 0) {
      enqueueSnackbar('沒有可匯出的資料', { variant: 'warning' });
      return;
    }

    try {
      const response = await axios.post(
        '/scores/annual-stats/export',
        { tournament_ids: selectedTournaments },
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // 從 Content-Disposition header 獲取檔案名稱，或使用預設名稱
      const contentDisposition = response.headers['content-disposition'];
      let filename = '年度總成績.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = decodeURIComponent(filenameMatch[1].replace(/['"]/g, ''));
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      enqueueSnackbar('年度總成績匯出成功', { variant: 'success' });
    } catch (error) {
      console.error('匯出年度總成績時發生錯誤:', error);
      const errorMessage = error.response?.data?.error || '匯出年度總成績失敗';
      enqueueSnackbar(errorMessage, { variant: 'error' });
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
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<DownloadIcon />}
                onClick={handleExportScores}
                disabled={!selectedTournament || scores.length === 0}
              >
                匯出成績表
              </Button>
              <Button
                variant="contained"
                onClick={() => setOpenUploadDialog(true)}
                disabled={!selectedTournament}
              >
                匯入成績
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={handleClearScores}
                disabled={!selectedTournament}
              >
                清除所有成績
              </Button>
            </Box>

            <Typography variant="h6" gutterBottom>
              選擇賽事
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
          </Box>

          {selectedTournament && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  {selectedTournament.name} 成績表
                </Typography>
              </Box>

              {/* 搜尋功能 */}
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="搜尋會員編號、姓名或HOLE..."
                  value={searchTerm}
                  onChange={handleSearch}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                    endAdornment: searchTerm && (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={handleClearSearch}
                          edge="end"
                        >
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ maxWidth: 400 }}
                />
                {searchTerm && (
                  <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                    找到 {filteredScores.length} 筆符合的成績記錄
                  </Typography>
                )}
              </Box>

              <Box sx={{ height: 400, width: '100%' }}>
                <DataGrid
                  rows={filteredScores}
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                選擇要統計的賽事
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<DownloadIcon />}
                onClick={handleExportAnnualStats}
                disabled={selectedTournaments.length === 0 || annualStats.length === 0}
              >
                匯出年度總成績
              </Button>
            </Box>
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
            <>
              {/* 年度總成績搜尋功能 */}
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="搜尋姓名、級別或會員編號..."
                  value={annualSearchTerm}
                  onChange={handleAnnualSearch}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                    endAdornment: annualSearchTerm && (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={handleClearAnnualSearch}
                          edge="end"
                        >
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ maxWidth: 400 }}
                />
                {annualSearchTerm && (
                  <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                    找到 {filteredAnnualStats.length} 筆符合的年度成績記錄
                  </Typography>
                )}
              </Box>

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
                    {sortData([...filteredAnnualStats]).map((row) => (
                      <AnnualScoreRow key={row.member_number} row={row} />
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </TabPanel>
      </Paper>

      <Dialog open={openUploadDialog} onClose={() => setOpenUploadDialog(false)}>
        <DialogTitle>上傳成績檔案</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  if (file.size > 10 * 1024 * 1024) {
                    enqueueSnackbar('檔案大小不能超過 10MB', { variant: 'error' });
                    return;
                  }
                  setSelectedFile(file);
                }
              }}
            />
            <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
              支援的檔案格式：Excel (.xlsx, .xls)
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenUploadDialog(false);
            setSelectedFile(null);
          }}>
            取消
          </Button>
          <Button 
            onClick={handleFileUpload} 
            variant="contained" 
            disabled={!selectedFile}
            color="primary"
          >
            上傳
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Scores;

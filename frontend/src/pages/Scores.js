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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import { UploadFile } from '@mui/icons-material';
import axios from '../utils/axios';

function Scores() {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // 表格欄位定義
  const columns = [
    { field: 'member_number', headerName: '會員編號', width: 100 },
    { field: 'full_name', headerName: 'HOLE', width: 200 },
    { field: 'chinese_name', headerName: '姓名', width: 120 },
    { field: 'net_rank', headerName: '淨桿名次', width: 100, type: 'number' },
    { field: 'gross_score', headerName: '總桿數', width: 100, type: 'number' },
    { field: 'previous_handicap', headerName: '前次差點', width: 100, type: 'number',
      valueFormatter: (params) => params.value ? params.value.toFixed(2) : '' },
    { field: 'net_score', headerName: '淨桿桿數', width: 100, type: 'number',
      valueFormatter: (params) => params.value ? params.value.toFixed(2) : '' },
    { field: 'handicap_change', headerName: '差點增減', width: 100, type: 'number',
      valueFormatter: (params) => params.value ? params.value.toFixed(2) : '' },
    { field: 'new_handicap', headerName: '新差點', width: 100, type: 'number',
      valueFormatter: (params) => params.value ? params.value.toFixed(2) : '' },
    { field: 'points', headerName: '積分', width: 80, type: 'number' },
  ];

  // 載入賽事列表
  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const response = await axios.get('/api/tournaments');
        setTournaments(response.data);
      } catch (err) {
        setError('載入賽事列表失敗');
        console.error('Error fetching tournaments:', err);
      }
    };
    fetchTournaments();
  }, []);

  // 載入選定賽事的成績
  useEffect(() => {
    const fetchScores = async () => {
      if (!selectedTournament) return;
      
      setLoading(true);
      try {
        const response = await axios.get(`/api/scores?tournament_id=${selectedTournament}`);
        setScores(response.data);
        setError(null);
      } catch (err) {
        setError('載入成績失敗');
        console.error('Error fetching scores:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchScores();
  }, [selectedTournament]);

  // 處理檔案上傳
  const handleFileUpload = async (event) => {
    if (!selectedTournament) {
      setError('請先選擇賽事');
      return;
    }

    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    try {
      const response = await axios.post(
        `/api/scores/import/${selectedTournament}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      // 處理警告信息
      if (response.data.warnings && response.data.warnings.length > 0) {
        const warningMessages = response.data.warnings
          .map(w => `第 ${w.row} 行: ${w.error}`)
          .join('\n');
        setError(`匯入完成，但有以下警告：\n${warningMessages}`);
      } else {
        setSuccess(response.data.message || '成績匯入成功');
        setError(null);
      }
      
      // 重新載入成績
      const scoresResponse = await axios.get(`/api/scores?tournament_id=${selectedTournament}`);
      setScores(scoresResponse.data);
    } catch (err) {
      console.error('Error details:', err.response?.data);
      setError(err.response?.data?.error || err.response?.data?.details || err.message || '匯入成績失敗');
    } finally {
      setLoading(false);
      // 清除檔案選擇
      event.target.value = '';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>成績管理</Typography>
      
      {/* 賽事選擇 */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>選擇賽事</InputLabel>
          <Select
            value={selectedTournament}
            label="選擇賽事"
            onChange={(e) => setSelectedTournament(e.target.value)}
          >
            {tournaments.map((tournament) => (
              <MenuItem key={tournament.id} value={tournament.id}>
                {tournament.name} ({tournament.date})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* 檔案上傳 */}
        <Button
          variant="contained"
          component="label"
          startIcon={<UploadFile />}
          disabled={!selectedTournament || loading}
        >
          匯入成績
          <input
            type="file"
            hidden
            onChange={handleFileUpload}
          />
        </Button>
      </Box>

      {/* 錯誤訊息 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* 成功訊息 */}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* 載入中指示器 */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress />
        </Box>
      )}

      {/* 成績表格 */}
      {selectedTournament && scores.length > 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell key={column.field}>{column.headerName}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {scores.map((score) => (
                <TableRow key={score.id}>
                  {columns.map((column) => (
                    <TableCell key={column.field} align={column.align}>
                      {column.valueFormatter ? column.valueFormatter({ value: score[column.field] }) : score[column.field]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 無資料提示 */}
      {selectedTournament && !loading && scores.length === 0 && (
        <Typography variant="body1" sx={{ textAlign: 'center', my: 3 }}>
          尚無成績資料
        </Typography>
      )}
    </Box>
  );
}

export default Scores;

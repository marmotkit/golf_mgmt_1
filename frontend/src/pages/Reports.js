import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Alert,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList
} from 'recharts';
import * as reportService from '../services/reportService';

const Reports = () => {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournaments, setSelectedTournaments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [topPointsCount, setTopPointsCount] = useState(10);
  const [topScoresCount, setTopScoresCount] = useState(10);
  const [topImprovementsCount, setTopImprovementsCount] = useState(5);

  // 獲取賽事列表
  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const data = await reportService.getTournaments();
        setTournaments(data);
      } catch (err) {
        setError('獲取賽事列表失敗');
        console.error('Error fetching tournaments:', err);
      }
    };
    fetchTournaments();
  }, []);

  // 當選擇的賽事改變時，獲取統計數據
  useEffect(() => {
    const fetchStats = async () => {
      if (selectedTournaments.length === 0) {
        setStats(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await reportService.getStats(selectedTournaments);
        setStats(data);
      } catch (err) {
        setError('獲取統計數據失敗');
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [selectedTournaments]);

  const handleTournamentChange = (event, newTournaments) => {
    setSelectedTournaments(newTournaments);
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        賽事報表分析
      </Typography>

      {/* 賽事選擇區域 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            選擇賽事
          </Typography>
          <ToggleButtonGroup
            value={selectedTournaments}
            onChange={handleTournamentChange}
            multiple
          >
            {tournaments.map((tournament) => (
              <ToggleButton
                key={tournament.id}
                value={tournament.id}
                aria-label={tournament.name}
              >
                {tournament.name}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </CardContent>
      </Card>

      {/* 載入中和錯誤提示 */}
      {loading && (
        <Box display="flex" justifyContent="center" my={3}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 統計數據顯示區域 */}
      {stats && (
        <Grid container spacing={3}>
          {/* 團隊平均差點圖表 */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  團隊平均差點
                </Typography>
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart width={600} height={300} data={Object.entries(stats.avg_team_handicaps).map(([team, handicap]) => ({
                      team,
                      handicap
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="team" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="handicap" fill="#8884d8" name="平均差點">
                        <LabelList 
                          dataKey="handicap" 
                          position="center" 
                          fill="#ffffff" 
                          formatter={(value) => value.toFixed(2)} 
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* 團隊平均總桿數圖表 */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  團隊平均總桿數
                </Typography>
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart width={600} height={300} data={Object.entries(stats.avg_team_scores).map(([team, score]) => ({
                      team,
                      score
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="team" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="score" fill="#82ca9d" name="平均總桿">
                        <LabelList 
                          dataKey="score" 
                          position="center" 
                          fill="#ffffff" 
                          formatter={(value) => value.toFixed(2)} 
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* 前N名總積分表格 */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    前{topPointsCount}名總積分 (加總)
                  </Typography>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>顯示前幾名</InputLabel>
                    <Select
                      value={topPointsCount}
                      label="顯示前幾名"
                      onChange={(e) => setTopPointsCount(e.target.value)}
                    >
                      <MenuItem value={5}>前5名</MenuItem>
                      <MenuItem value={10}>前10名</MenuItem>
                      <MenuItem value={15}>前15名</MenuItem>
                      <MenuItem value={20}>前20名</MenuItem>
                      <MenuItem value={30}>前30名</MenuItem>
                      <MenuItem value={50}>前50名</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>名次</TableCell>
                        <TableCell>會員姓名</TableCell>
                        <TableCell align="right">積分</TableCell>
                        <TableCell align="right">參與次數</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.top_points.slice(0, topPointsCount).map((score, index) => (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{score.member_name}</TableCell>
                          <TableCell align="right">{score.points}</TableCell>
                          <TableCell align="right">{score.participation_count || 0}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* 前N名總桿數表格 */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    前{topScoresCount}名總桿數 (平均)
                  </Typography>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>顯示前幾名</InputLabel>
                    <Select
                      value={topScoresCount}
                      label="顯示前幾名"
                      onChange={(e) => setTopScoresCount(e.target.value)}
                    >
                      <MenuItem value={5}>前5名</MenuItem>
                      <MenuItem value={10}>前10名</MenuItem>
                      <MenuItem value={15}>前15名</MenuItem>
                      <MenuItem value={20}>前20名</MenuItem>
                      <MenuItem value={30}>前30名</MenuItem>
                      <MenuItem value={50}>前50名</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>名次</TableCell>
                        <TableCell>會員姓名</TableCell>
                        <TableCell align="right">總桿數</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.top_scores.slice(0, topScoresCount).map((score, index) => (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{score.member_name}</TableCell>
                          <TableCell align="right">{score.gross_score}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* 前N名最佳進步獎表格 */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    前{topImprovementsCount}名最佳進步獎
                  </Typography>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>顯示前幾名</InputLabel>
                    <Select
                      value={topImprovementsCount}
                      label="顯示前幾名"
                      onChange={(e) => setTopImprovementsCount(e.target.value)}
                    >
                      <MenuItem value={5}>前5名</MenuItem>
                      <MenuItem value={10}>前10名</MenuItem>
                      <MenuItem value={15}>前15名</MenuItem>
                      <MenuItem value={20}>前20名</MenuItem>
                      <MenuItem value={30}>前30名</MenuItem>
                      <MenuItem value={50}>前50名</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <TableContainer component={Paper} sx={{ height: 300 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>名次</TableCell>
                        <TableCell>會員姓名</TableCell>
                        <TableCell align="right">初始差點</TableCell>
                        <TableCell align="right">最終差點</TableCell>
                        <TableCell align="right">進步幅度</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.top_improvements.slice(0, topImprovementsCount).map((improvement, index) => (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{improvement.member_name}</TableCell>
                          <TableCell align="right">{improvement.initial_handicap}</TableCell>
                          <TableCell align="right">{improvement.final_handicap}</TableCell>
                          <TableCell align="right">{improvement.improvement}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* 全勤獎表格 */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  全勤獎
                </Typography>
                <TableContainer component={Paper} sx={{ height: 300 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>會員姓名</TableCell>
                        <TableCell align="right">參與次數</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.perfect_attendance.map((member, index) => (
                        <TableRow key={index}>
                          <TableCell>{member.member_name}</TableCell>
                          <TableCell align="right">{member.participation_count || 0}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Reports;

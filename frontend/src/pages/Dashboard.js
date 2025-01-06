import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
} from '@mui/material';
import {
  People as PeopleIcon,
  EmojiEvents as TournamentsIcon,
  Score as ScoreIcon,
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function Dashboard() {
  const [memberCount, setMemberCount] = useState(0);
  const [tournamentCount, setTournamentCount] = useState(15);
  const [averageHandicap, setAverageHandicap] = useState(18.5);

  useEffect(() => {
    const fetchMemberCount = async () => {
      try {
        const response = await axios.get(`${API_URL}/members/count`);
        setMemberCount(response.data.count);
      } catch (error) {
        console.error('Error fetching member count:', error);
      }
    };

    fetchMemberCount();
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        歡迎使用清華大學校友高爾夫球隊管理系統
      </Typography>

      <Grid container spacing={3}>
        {/* 統計卡片 */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
            <PeopleIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
            <div>
              <Typography variant="h6">總會員數</Typography>
              <Typography variant="h4">{memberCount}</Typography>
            </div>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
            <TournamentsIcon sx={{ fontSize: 40, mr: 2, color: 'secondary.main' }} />
            <div>
              <Typography variant="h6">本年度賽事</Typography>
              <Typography variant="h4">{tournamentCount}</Typography>
            </div>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
            <ScoreIcon sx={{ fontSize: 40, mr: 2, color: 'success.main' }} />
            <div>
              <Typography variant="h6">平均差點</Typography>
              <Typography variant="h4">{averageHandicap}</Typography>
            </div>
          </Paper>
        </Grid>

        {/* 最近賽事 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="最近賽事" />
            <CardContent>
              <Typography variant="body1" paragraph>
                2025年1月份月例賽
              </Typography>
              <Typography variant="body2" color="text.secondary">
                日期：2025/01/15
              </Typography>
              <Typography variant="body2" color="text.secondary">
                地點：台北高爾夫球場
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* 公告欄 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="最新公告" />
            <CardContent>
              <Typography variant="body1" gutterBottom>
                2025年度會費繳交通知
              </Typography>
              <Typography variant="body2" color="text.secondary">
                請各位會員於2025年1月31日前完成會費繳交。
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;

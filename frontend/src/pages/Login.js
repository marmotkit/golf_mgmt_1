import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import * as authService from '../services/authService';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    account: '',
    member_number: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(formData);
      // 保存 token 和用戶信息
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));
      // 導航到首頁
      navigate('/');
    } catch (error) {
      setError(error.message || '登入失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h5" gutterBottom>
            清大校友高爾夫球隊
          </Typography>
          <Typography component="h2" variant="h6" gutterBottom>
            賽事管理系統
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="account"
              label="帳號"
              name="account"
              autoComplete="off"
              autoFocus
              value={formData.account}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="member_number"
              label="會員編號"
              id="member_number"
              autoComplete="off"
              value={formData.member_number}
              onChange={handleChange}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : '登入'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 
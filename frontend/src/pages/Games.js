import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Snackbar,
  Alert,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import axios from '../utils/axios';
import config from '../config';
import WheelGame from '../components/WheelGame';

const GAME_TYPES = [
  { value: 'default', label: '一般遊戲' },
  { value: 'wheel', label: '轉盤遊戲' },
];

function Games() {
  const [games, setGames] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [gameForm, setGameForm] = useState({
    name: '',
    description: '',
    rules: '',
    type: 'default',
    prize_count: 6,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const response = await axios.get('/games');
      console.log('Fetched games:', response.data);
      setGames(response.data);
    } catch (error) {
      console.error('Error fetching games:', error);
      setSnackbar({
        open: true,
        message: '載入遊戲列表失敗',
        severity: 'error',
      });
    }
  };

  const handleDialogOpen = (game = null) => {
    if (game) {
      setEditingGame(game);
      setGameForm({
        name: game.name,
        description: game.description || '',
        rules: game.rules || '',
        type: game.type || 'default',
        prize_count: game.prize_count || 6,
      });
    } else {
      setEditingGame(null);
      setGameForm({
        name: '',
        description: '',
        rules: '',
        type: 'default',
        prize_count: 6,
      });
    }
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setEditingGame(null);
    setGameForm({
      name: '',
      description: '',
      rules: '',
      type: 'default',
      prize_count: 6,
    });
  };

  const handleSubmit = async () => {
    try {
      let response;
      if (editingGame) {
        response = await axios.put(`/games/${editingGame.id}`, gameForm);
      } else {
        response = await axios.post('/games', gameForm);
      }
      console.log('Game saved:', response.data);
      fetchGames();
      handleDialogClose();
      setSnackbar({
        open: true,
        message: `遊戲${editingGame ? '更新' : '新增'}成功`,
        severity: 'success',
      });
    } catch (error) {
      console.error('Error saving game:', error);
      setSnackbar({
        open: true,
        message: `遊戲${editingGame ? '更新' : '新增'}失敗`,
        severity: 'error',
      });
    }
  };

  const handleDelete = async (gameId) => {
    if (!window.confirm('確定要刪除此遊戲嗎？')) return;

    try {
      await axios.delete(`/games/${gameId}`);
      fetchGames();
      setSnackbar({
        open: true,
        message: '遊戲刪除成功',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error deleting game:', error);
      setSnackbar({
        open: true,
        message: '遊戲刪除失敗',
        severity: 'error',
      });
    }
  };

  const handlePrizeUpdate = async (game, prize) => {
    try {
      await axios.put(`/games/${game.id}/prizes/${prize.position}`, prize);
      fetchGames();
      setSnackbar({
        open: true,
        message: '獎項更新成功',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error updating prize:', error);
      setSnackbar({
        open: true,
        message: '獎項更新失敗',
        severity: 'error',
      });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">歡樂賽場</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleDialogOpen()}
        >
          新增遊戲
        </Button>
      </Box>

      <Grid container spacing={3}>
        {games.map((game) => (
          <Grid item xs={12} md={6} key={game.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {game.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {game.description}
                    </Typography>
                    {game.rules && (
                      <>
                        <Typography variant="subtitle2" gutterBottom>
                          遊戲規則：
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {game.rules}
                        </Typography>
                      </>
                    )}
                  </Box>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => handleDialogOpen(game)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(game.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>

                {game.type === 'wheel' && (
                  <Box sx={{ mt: 3 }}>
                    <WheelGame
                      game={game}
                      onPrizeUpdate={(prize) => handlePrizeUpdate(game, prize)}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingGame ? '編輯遊戲' : '新增遊戲'}</DialogTitle>
        <DialogContent>
          <TextField
            select
            margin="dense"
            label="遊戲類型"
            fullWidth
            value={gameForm.type}
            onChange={(e) => setGameForm({ ...gameForm, type: e.target.value })}
          >
            {GAME_TYPES.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          {gameForm.type === 'wheel' && (
            <TextField
              type="number"
              margin="dense"
              label="獎項數量"
              fullWidth
              value={gameForm.prize_count}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (value > 0 && value <= 24) {
                  setGameForm({ ...gameForm, prize_count: value });
                }
              }}
              inputProps={{ min: 1, max: 24 }}
              helperText="請輸入1-24之間的數字"
            />
          )}
          <TextField
            autoFocus
            margin="dense"
            label="遊戲名稱"
            fullWidth
            value={gameForm.name}
            onChange={(e) => setGameForm({ ...gameForm, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="遊戲說明"
            fullWidth
            multiline
            rows={2}
            value={gameForm.description}
            onChange={(e) => setGameForm({ ...gameForm, description: e.target.value })}
          />
          <TextField
            margin="dense"
            label="遊戲規則"
            fullWidth
            multiline
            rows={4}
            value={gameForm.rules}
            onChange={(e) => setGameForm({ ...gameForm, rules: e.target.value })}
          />
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
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Games;
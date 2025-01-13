import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Typography,
} from '@mui/material';
import { Edit as EditIcon, Fullscreen as FullscreenIcon, FullscreenExit as FullscreenExitIcon } from '@mui/icons-material';

const WHEEL_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB',
  '#FF9F43', '#1ABC9C', '#4834D4', '#6AB04C'
];

const WheelGame = ({ game, onPrizeUpdate }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedPrize, setSelectedPrize] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPrize, setEditingPrize] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const spinTimeoutRef = useRef(null);
  const canvasRef = useRef(null);
  const expandedCanvasRef = useRef(null);
  const dialogContentRef = useRef(null);

  const drawWheel = (canvas, size) => {
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 計算實際繪製區域，確保轉盤足夠大
    const drawSize = Math.min(canvas.width, canvas.height) * 0.9;
    
    // 計算中心點，確保轉盤在畫布中央
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = drawSize / 2;

    // 保存當前狀態
    ctx.save();
    ctx.translate(centerX, centerY);
    
    // 繪製轉盤
    game.prizes.forEach((prize, i) => {
      const prizeCount = game.prizes.length;
      const sliceAngle = (Math.PI * 2) / prizeCount;
      const startAngle = i * sliceAngle + (rotation * Math.PI / 180);
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();

      ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 繪製獎項文字
      ctx.save();
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      const fontSize = Math.floor(radius * (prizeCount > 12 ? 0.08 : 0.1));
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.fillText(prize.name, radius * 0.85, 0);
      ctx.restore();
    });

    // 繪製中心點
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.05, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 繪製指針，調整位置到轉盤邊緣
    const pointerSize = radius * 0.2;
    ctx.beginPath();
    ctx.moveTo(radius * 0.95, 0); // 從轉盤邊緣開始
    ctx.lineTo(radius * 1.15, -pointerSize * 0.3);
    ctx.lineTo(radius * 1.15, pointerSize * 0.3);
    ctx.closePath();
    ctx.fillStyle = '#e74c3c';
    ctx.fill();

    ctx.restore();
  };

  // 繪製小轉盤
  useEffect(() => {
    if (canvasRef.current) {
      drawWheel(canvasRef.current, 400);
    }
  }, [game.prizes, rotation]);

  // 繪製大轉盤
  useEffect(() => {
    if (isExpanded && expandedCanvasRef.current) {
      drawWheel(expandedCanvasRef.current, 600);
    }
  }, [isExpanded, game.prizes, rotation]);

  const handleExpand = () => {
    setIsExpanded(true);
    // 確保在下一幀立即繪製大轉盤，並保持當前旋轉角度和中獎結果
    requestAnimationFrame(() => {
      if (expandedCanvasRef.current) {
        const size = Math.min(window.innerWidth * 0.7, window.innerHeight * 0.7);
        expandedCanvasRef.current.width = size;
        expandedCanvasRef.current.height = size;
        drawWheel(expandedCanvasRef.current, size);
      }
    });
  };

  // 當對話框關閉時重置轉盤狀態
  const handleDialogClose = () => {
    setIsExpanded(false);
    setIsFullscreen(false);
    // 確保小轉盤顯示相同的狀態
    requestAnimationFrame(() => {
      if (canvasRef.current) {
        drawWheel(canvasRef.current, 400);
      }
    });
  };

  const spinWheel = () => {
    if (isSpinning) {
      // 停止轉動
      if (spinTimeoutRef.current) {
        clearTimeout(spinTimeoutRef.current);
      }
      const finalRotation = rotation + Math.random() * 360 + 720; // 至少再轉2圈
      const duration = 3000; // 3秒
      const startRotation = rotation;
      const startTime = Date.now();

      const animate = () => {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // 使用緩動函數使轉動逐漸減速
        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        const currentRotation = startRotation + (finalRotation - startRotation) * easeOut(progress);

        setRotation(currentRotation % 360);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsSpinning(false);
          // 計算最終指向的獎項
          const prizeCount = game.prizes.length;
          const degreesPerPrize = 360 / prizeCount;
          const prizeIndex = Math.floor(((360 - (currentRotation % 360)) / degreesPerPrize) % prizeCount);
          setSelectedPrize(game.prizes[prizeIndex]);
        }
      };

      requestAnimationFrame(animate);
    } else {
      // 開始轉動
      setIsSpinning(true);
      setSelectedPrize(null);
      const spinSpeed = 10;
      
      const spin = () => {
        setRotation(prev => (prev + spinSpeed) % 360);
        spinTimeoutRef.current = setTimeout(spin, 50);
      };
      
      spin();
    }
  };

  const handlePrizeEdit = (prize) => {
    setEditingPrize(prize);
    setEditDialogOpen(true);
  };

  const handlePrizeUpdate = async () => {
    if (editingPrize) {
      await onPrizeUpdate(editingPrize);
      setEditDialogOpen(false);
      setEditingPrize(null);
    }
  };

  const handleFullscreenChange = () => {
    if (!document.fullscreenElement) {
      setIsFullscreen(false);
      setIsExpanded(false); // 當退出全螢幕時，同時關閉放大視窗
    }
  };

  useEffect(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    if (!isFullscreen) {
      try {
        if (dialogContentRef.current) {
          await dialogContentRef.current.requestFullscreen();
          setIsFullscreen(true);
          requestAnimationFrame(() => {
            if (expandedCanvasRef.current) {
              const canvas = expandedCanvasRef.current;
              const minSize = Math.min(window.innerWidth, window.innerHeight);
              canvas.width = minSize;
              canvas.height = minSize;
              drawWheel(canvas, minSize);
            }
          });
        }
      } catch (err) {
        console.error('Error attempting to enable fullscreen:', err);
      }
    } else {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    }
  };

  // 監聽視窗大小變化
  useEffect(() => {
    const handleResize = () => {
      if (expandedCanvasRef.current) {
        const canvas = expandedCanvasRef.current;
        if (isFullscreen) {
          // 全螢幕模式下，使用視窗大小的85%
          const size = Math.min(window.innerWidth, window.innerHeight) * 0.85;
          canvas.width = size;
          canvas.height = size;
          drawWheel(canvas, size);
        } else if (isExpanded) {
          // 放大模式下，使用視窗大小的70%
          const size = Math.min(window.innerWidth * 0.7, window.innerHeight * 0.7);
          canvas.width = size;
          canvas.height = size;
          drawWheel(canvas, size);
        }
      }
    };

    handleResize(); // 立即執行一次
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isFullscreen, isExpanded, game.prizes, rotation]);

  return (
    <Box sx={{ textAlign: 'center', p: 3 }}>
      <Dialog
        open={isExpanded}
        onClose={handleDialogClose}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            height: isFullscreen ? '100vh' : '90vh',
            maxWidth: isFullscreen ? '100vw' : '95vw',
            margin: isFullscreen ? 0 : 2,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: isFullscreen ? '#000' : 'background.paper'
          }
        }}
      >
        <DialogContent 
          ref={dialogContentRef}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: isFullscreen ? '20px' : '40px',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ 
            position: 'relative',
            width: '100%',
            height: '85%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '& canvas': {
              width: 'auto !important',
              height: 'auto !important'
            }
          }}>
            <canvas
              ref={expandedCanvasRef}
              style={{
                maxWidth: '100%',
                maxHeight: '100%'
              }}
            />
            <IconButton
              onClick={toggleFullscreen}
              sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                bgcolor: 'rgba(255, 255, 255, 0.8)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                },
                zIndex: 1
              }}
            >
              {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
          </Box>
          <Box sx={{ 
            mt: 2, 
            textAlign: 'center',
            position: 'relative',
            zIndex: 1,
            width: '100%'
          }}>
            <Button
              variant="contained"
              color="primary"
              onClick={spinWheel}
              sx={{ mb: 2 }}
            >
              {isSpinning ? '停止' : '開始'}
            </Button>
            {selectedPrize && !isSpinning && (
              <Box>
                <Typography variant="h5" sx={{ mt: 2, color: isFullscreen ? '#fff' : 'primary.main' }}>
                  恭喜獲得：{selectedPrize.name}
                </Typography>
                {selectedPrize.description && (
                  <Typography variant="body1" sx={{ mt: 1, color: isFullscreen ? '#fff' : 'text.secondary' }}>
                    {selectedPrize.description}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
      </Dialog>

      <Box 
        sx={{ 
          position: 'relative', 
          width: 400, 
          height: 400, 
          margin: '0 auto',
          cursor: 'pointer',
          '&:hover': {
            opacity: 0.9,
          }
        }}
        onClick={handleExpand}
      >
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          style={{ position: 'absolute', top: 0, left: 0 }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: 1,
            opacity: 0,
            transition: 'opacity 0.2s',
            '&:hover': {
              opacity: 1,
            }
          }}
        >
          點擊放大
        </Box>
      </Box>

      <Button
        variant="contained"
        color="primary"
        onClick={spinWheel}
        sx={{ mt: 2 }}
      >
        {isSpinning ? '停止' : '開始'}
      </Button>

      {selectedPrize && !isSpinning && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6">
            恭喜獲得：{selectedPrize.name}
          </Typography>
          {selectedPrize.description && (
            <Typography variant="body2" color="text.secondary">
              {selectedPrize.description}
            </Typography>
          )}
        </Box>
      )}

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          獎項設定
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2 }}>
          {game.prizes.map((prize) => (
            <Box
              key={prize.position}
              sx={{
                p: 2,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Box>
                <Typography variant="subtitle2">
                  位置 {prize.position + 1}
                </Typography>
                <Typography variant="body2">
                  {prize.name}
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={() => handlePrizeEdit(prize)}
              >
                <EditIcon />
              </IconButton>
            </Box>
          ))}
        </Box>
      </Box>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>編輯獎項</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="獎項名稱"
            fullWidth
            value={editingPrize?.name || ''}
            onChange={(e) => setEditingPrize({ ...editingPrize, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="獎項說明"
            fullWidth
            multiline
            rows={2}
            value={editingPrize?.description || ''}
            onChange={(e) => setEditingPrize({ ...editingPrize, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>取消</Button>
          <Button onClick={handlePrizeUpdate} variant="contained">
            確定
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WheelGame; 
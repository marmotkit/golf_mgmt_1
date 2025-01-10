import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

function TournamentDialog({ open, onClose, onSubmit, tournament = null }) {
  const [formData, setFormData] = React.useState({
    name: '',
    location: '',
    date: dayjs(),
    notes: '',
  });

  // 當對話框打開或 tournament 改變時，更新表單數據
  React.useEffect(() => {
    if (tournament) {
      console.log('Setting form data from tournament:', tournament);
      setFormData({
        name: tournament.name || '',
        location: tournament.location || '',
        date: tournament.date ? dayjs(tournament.date) : dayjs(),
        notes: tournament.notes || '',
      });
    } else {
      setFormData({
        name: '',
        location: '',
        date: dayjs(),
        notes: '',
      });
    }
  }, [tournament, open]);

  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
  };

  const handleDateChange = (newDate) => {
    console.log('Date changed to:', newDate);
    setFormData({
      ...formData,
      date: newDate,
    });
  };

  const handleSubmit = () => {
    if (!formData.date || !formData.date.isValid()) {
      console.error('Invalid date:', formData.date);
      return;
    }

    const submitData = {
      name: formData.name,
      location: formData.location,
      date: formData.date.format('YYYY-MM-DD'),
      notes: formData.notes || ''
    };
    
    console.log('Submitting data:', submitData);
    onSubmit(submitData);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{tournament ? '編輯賽事' : '新增賽事'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField
            label="賽事名稱"
            value={formData.name}
            onChange={handleChange('name')}
            fullWidth
            required
          />
          <TextField
            label="球場"
            value={formData.location}
            onChange={handleChange('location')}
            fullWidth
            required
          />
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="比賽日期"
              value={formData.date}
              onChange={handleDateChange}
              format="YYYY/MM/DD"
              slotProps={{
                textField: { fullWidth: true, required: true }
              }}
            />
          </LocalizationProvider>
          <TextField
            label="備註"
            value={formData.notes}
            onChange={handleChange('notes')}
            fullWidth
            multiline
            rows={4}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          {tournament ? '更新' : '創建'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default TournamentDialog;

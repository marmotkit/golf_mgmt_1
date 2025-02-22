import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper, 
  Select,
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  TextField, 
  Typography,
  Stack,
  IconButton,
  Switch,
  Tooltip,
  Checkbox,
  Snackbar,
  Alert,
  FormControlLabel,
  CircularProgress,
  ArrowUpDownIcon,
  TableSortLabel
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import UploadIcon from '@mui/icons-material/Upload';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import axios from '../utils/axios';

const Members = () => {
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [loading, setLoading] = useState(true);
  const [currentVersion, setCurrentVersion] = useState(null);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [compareVersions, setCompareVersions] = useState({ from: '', to: '' });
  const [versionList, setVersionList] = useState([]);
  const [compareResults, setCompareResults] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [versionToDelete, setVersionToDelete] = useState(null);

  useEffect(() => {
    fetchMembers();
    fetchVersions();
  }, [refreshKey]);

  const fetchVersions = async () => {
    try {
      const response = await axios.get('/members/versions');
      setVersionList(response.data);
      if (response.data.length > 0) {
        setCurrentVersion(response.data[0]); // 最新的版本
      }
    } catch (error) {
      console.error('Error fetching versions:', error);
      setSnackbar({ open: true, message: '載入版本資訊失敗', severity: 'error' });
    }
  };

  const fetchMembers = async () => {
    try {
      setLoading(true);
      // 使用當前版本號獲取會員資料
      const version = currentVersion?.version;
      const response = await axios.get(`/members${version ? `?version=${version}` : ''}`);
      // 排序會員：先按會員編號，再按會員身份（來賓排後面）
      const sortedMembers = response.data.sort((a, b) => {
        if (a.is_guest !== b.is_guest) {
          return a.is_guest ? 1 : -1;
        }
        return (a.member_number || '').localeCompare(b.member_number || '');
      });
      setMembers(sortedMembers);
    } catch (error) {
      console.error('Error fetching members:', error);
      setSnackbar({ open: true, message: '載入失敗', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCompareVersions = async () => {
    if (!compareVersions.from || !compareVersions.to) {
      setSnackbar({ open: true, message: '請選擇要比較的版本', severity: 'warning' });
      return;
    }
    try {
      const response = await axios.post('/members/compare', compareVersions);
      setCompareResults(response.data);
    } catch (error) {
      console.error('Error comparing versions:', error);
      setSnackbar({ open: true, message: '版本比較失敗', severity: 'error' });
    }
  };

  const handleDeleteVersion = async (version) => {
    try {
      // 確保版本號是字串格式
      const versionStr = String(version).trim();
      
      // 顯示刪除確認對話框
      setVersionToDelete(version);
      setDeleteDialogOpen(true);
    } catch (error) {
      console.error('刪除版本失敗:', error.response?.data);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || '刪除版本失敗',
        severity: 'error'
      });
    }
  };

  const handleConfirmDelete = async () => {
    try {
      console.log('開始刪除版本操作:', versionToDelete);
      
      const response = await axios.delete(`/members/versions/${versionToDelete}`);
      console.log('刪除請求響應:', response.data);
      
      // 重新載入版本列表
      fetchVersions();
      
      // 顯示成功訊息
      setSnackbar({
        open: true,
        message: response.data.message || `成功刪除版本 ${versionToDelete}`,
        severity: 'success'
      });
    } catch (error) {
      console.error('刪除版本失敗 - 完整錯誤:', error);
      console.error('錯誤響應數據:', error.response?.data);
      console.error('錯誤狀態碼:', error.response?.status);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || '刪除版本失敗',
        severity: 'error'
      });
    } finally {
      setDeleteDialogOpen(false);
      setVersionToDelete(null);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      const response = await axios.post('/members/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSnackbar({
        open: true,
        message: `成功上傳 ${response.data.success_count} 筆資料${response.data.error_messages.length > 0 ? '，但有部分資料有誤' : ''}`,
        severity: response.data.success_count > 0 ? 'success' : 'error',
      });

      if (response.data.error_messages.length > 0) {
        console.log('Errors:', response.data.error_messages);
      }

      // 重新獲取版本列表並更新當前版本
      const versionsResponse = await axios.get('/members/versions');
      if (versionsResponse.data.length > 0) {
        const latestVersion = versionsResponse.data[0];
        setVersionList(versionsResponse.data);
        setCurrentVersion(latestVersion);
        
        // 使用最新版本重新獲取會員資料
        const membersResponse = await axios.get(`/members?version=${latestVersion.version}`);
        const sortedMembers = membersResponse.data.sort((a, b) => {
          if (a.is_guest !== b.is_guest) {
            return a.is_guest ? 1 : -1;
          }
          return (a.member_number || '').localeCompare(b.member_number || '');
        });
        setMembers(sortedMembers);
      }
      
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.error || '上傳失敗',
        severity: 'error',
      });
    } finally {
      setLoading(false);
      setUploadOpen(false);
      event.target.value = '';  // 清除檔案選擇
    }
  };

  const handleVersionChange = async (newVersion) => {
    try {
      setLoading(true);
      setCurrentVersion(newVersion);
      
      // 使用新版本獲取會員資料
      const response = await axios.get(`/members?version=${newVersion.version}`);
      const sortedMembers = response.data.sort((a, b) => {
        if (a.is_guest !== b.is_guest) {
          return a.is_guest ? 1 : -1;
        }
        return (a.member_number || '').localeCompare(b.member_number || '');
      });
      setMembers(sortedMembers);
      
    } catch (error) {
      console.error('Error fetching members:', error);
      setSnackbar({ open: true, message: '載入失敗', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const VersionSelector = ({ currentVersion, versionList, onVersionChange }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
      <FormControl sx={{ minWidth: 200 }}>
        <InputLabel id="version-select-label">目前版本</InputLabel>
        <Select
          labelId="version-select-label"
          value={currentVersion?.version || ''}
          label="目前版本"
          onChange={(e) => {
            const selectedVersion = versionList.find(v => v.version === e.target.value);
            onVersionChange(selectedVersion);
          }}
        >
          {versionList.map((version) => (
            <MenuItem key={version.version} value={version.version}>
              {version.version} ({new Date(version.created_at).toLocaleString()})
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );

  const CompareVersionsDialog = () => (
    <Dialog open={compareDialogOpen} onClose={() => setCompareDialogOpen(false)} maxWidth="md" fullWidth>
      <DialogTitle>版本比較</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2, mb: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              select
              label="從版本"
              value={compareVersions.from}
              onChange={(e) => setCompareVersions(prev => ({ ...prev, from: e.target.value }))}
              fullWidth
              SelectProps={{ native: true }}
            >
              <option value="">請選擇版本</option>
              {versionList.map(v => (
                <option key={v.version} value={v.version}>{v.version}</option>
              ))}
            </TextField>
            <TextField
              select
              label="至版本"
              value={compareVersions.to}
              onChange={(e) => setCompareVersions(prev => ({ ...prev, to: e.target.value }))}
              fullWidth
              SelectProps={{ native: true }}
            >
              <option value="">請選擇版本</option>
              {versionList.map(v => (
                <option key={v.version} value={v.version}>{v.version}</option>
              ))}
            </TextField>
            <Button variant="contained" onClick={handleCompareVersions}>
              比較
            </Button>
          </Stack>
        </Box>

        {/* 版本列表 */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            版本歷史
          </Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>版本號</TableCell>
                  <TableCell>建立時間</TableCell>
                  <TableCell align="right">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {versionList.map((version) => (
                  <TableRow key={version.version}>
                    <TableCell>{version.version}</TableCell>
                    <TableCell>
                      {new Date(version.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      {version.version !== versionList[0].version && (  // 不是最新版本才顯示刪除按鈕
                        <Tooltip title="刪除此版本">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteVersion(version.version)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* 比較結果 */}
        {compareResults && compareResults.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              差異項目
            </Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>會員編號</TableCell>
                    <TableCell>姓名</TableCell>
                    <TableCell>變更欄位</TableCell>
                    <TableCell>舊值</TableCell>
                    <TableCell>新值</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {compareResults.map((diff, index) => (
                    <TableRow key={index}>
                      <TableCell>{diff.member_number}</TableCell>
                      <TableCell>{diff.name}</TableCell>
                      <TableCell>{diff.field}</TableCell>
                      <TableCell>{diff.old_value}</TableCell>
                      <TableCell>{diff.new_value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setCompareDialogOpen(false)}>關閉</Button>
      </DialogActions>
    </Dialog>
  );

  const handleUploadOpen = () => setUploadOpen(true);
  const handleUploadClose = () => setUploadOpen(false);

  const handleEditClick = (member) => {
    setEditMember({...member});
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setEditMember(null);
  };

  const handleEditSave = async () => {
    try {
      // 準備要更新的資料
      const updateData = {
        member_number: editMember.member_number?.toString(),
        account: editMember.account?.toString(),
        chinese_name: editMember.chinese_name?.toString(),
        english_name: editMember.english_name?.toString(),
        department_class: editMember.department_class?.toString(),
        is_guest: Boolean(editMember.is_guest),
        is_admin: Boolean(editMember.is_admin)
      };

      // 特別處理差點欄位
      if ('handicap' in editMember) {
        if (editMember.handicap === '' || editMember.handicap === null) {
          updateData.handicap = null;
        } else {
          const handicapValue = parseFloat(editMember.handicap);
          if (!isNaN(handicapValue)) {
            updateData.handicap = handicapValue;
          }
        }
      }
      
      // 移除所有 undefined 值
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });
      
      console.log('=== Update Member Debug Info ===');
      console.log('Member ID:', editMember.id);
      console.log('Raw Edit Member Data:', editMember);
      console.log('Raw Edit Member Data (stringified):', JSON.stringify(editMember, null, 2));
      console.log('Processed Update Data:', updateData);
      console.log('Processed Update Data (stringified):', JSON.stringify(updateData, null, 2));
      console.log('Update URL:', `/members/${editMember.id}`);
      
      const response = await axios.patch(
        `/members/${editMember.id}`,
        updateData,
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      console.log('Update Response:', response.data);
      fetchMembers();
      setEditDialogOpen(false);
      setSnackbar({ open: true, message: '更新成功', severity: 'success' });
    } catch (error) {
      console.error('Error updating member:', error);
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.error || '更新失敗', 
        severity: 'error' 
      });
    }
  };

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    let newValue = value;
    
    // 處理不同類型的輸入
    if (type === 'checkbox') {
      newValue = checked;
    } else if (name === 'handicap') {
      // 特別處理差點欄位
      if (value === '') {
        newValue = null;
      } else {
        // 只允許數字和小數點
        const numericValue = value.replace(/[^\d.]/g, '');
        // 確保只有一個小數點
        const parts = numericValue.split('.');
        if (parts.length > 2) {
          newValue = parts[0] + '.' + parts.slice(1).join('');
        } else {
          newValue = numericValue;
        }
        // 如果是有效數字，則轉換
        if (newValue !== '' && !isNaN(parseFloat(newValue))) {
          newValue = parseFloat(newValue);  
        }
      }
    }
    
    console.log('=== Input Change Debug Info ===');
    console.log('Field:', name);
    console.log('Input Details:', {
      type,
      rawValue: value,
      checked,
      processedValue: newValue,
      valueType: typeof newValue,
      isNull: newValue === null,
      isUndefined: newValue === undefined,
      isNaN: typeof newValue === 'number' && isNaN(newValue)
    });
    
    setEditMember(prev => {
      const updated = {
        ...prev,
        [name]: newValue
      };
      console.log('Updated Member State:', JSON.stringify(updated, null, 2));
      return updated;
    });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleDelete = async (memberId) => {
    if (!window.confirm('確定要刪除此會員嗎？')) return;
    
    try {
      await axios.delete(`/members/${memberId}`);
      fetchMembers();
      setSnackbar({ open: true, message: '刪除成功', severity: 'success' });
    } catch (error) {
      console.error('Error deleting member:', error);
      setSnackbar({ open: true, message: error.response?.data?.error || '刪除失敗', severity: 'error' });
    }
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });

    const sortedMembers = [...members].sort((a, b) => {
      if (a[key] < b[key]) return direction === 'ascending' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'ascending' ? 1 : -1;
      return 0;
    });

    setMembers(sortedMembers);
  };

  const getSortIcon = (columnName) => {
    return (
      <TableSortLabel
        active={sortConfig.key === columnName}
        direction={sortConfig.key === columnName ? sortConfig.direction : 'asc'}
        onClick={() => handleSort(columnName)}
      />
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const filteredMembers = members.filter(member => {
    const searchFields = [
      member.member_number,
      member.chinese_name,
      member.english_name,
      member.department_class
    ].filter(Boolean).join(' ').toLowerCase();
    
    return searchFields.includes(searchTerm.toLowerCase());
  });

  const renderMemberRow = (member) => (
    <TableRow key={member.id}>
      <TableCell padding="checkbox">
        <Checkbox />
      </TableCell>
      <TableCell>{member.member_number}</TableCell>
      <TableCell>{member.account}</TableCell>
      <TableCell>{member.chinese_name}</TableCell>
      <TableCell>{member.english_name}</TableCell>
      <TableCell>{member.department_class}</TableCell>
      <TableCell>{member.is_guest ? '來賓' : '會員'}</TableCell>
      <TableCell>{member.is_admin ? '是' : '否'}</TableCell>
      <TableCell>{member.handicap}</TableCell>
      <TableCell>
        <IconButton onClick={() => handleEditClick(member)}>
          <EditIcon />
        </IconButton>
        <IconButton color="error" onClick={() => handleDelete(member.id)}>
          <DeleteIcon />
        </IconButton>
      </TableCell>
    </TableRow>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        會員管理
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <VersionSelector
          currentVersion={currentVersion}
          versionList={versionList}
          onVersionChange={handleVersionChange}
        />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={handleUploadOpen}
          >
            上傳 EXCEL
          </Button>
          <Button
            variant="outlined"
            startIcon={<CompareArrowsIcon />}
            onClick={() => setCompareDialogOpen(true)}
          >
            版本比較
          </Button>
        </Box>
      </Box>

      <TextField
        fullWidth
        variant="outlined"
        placeholder="搜尋會員..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 2 }}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox />
              </TableCell>
              <TableCell onClick={() => handleSort('member_number')}>
                會員編號 {getSortIcon('member_number')}
              </TableCell>
              <TableCell onClick={() => handleSort('account')}>
                帳號 {getSortIcon('account')}
              </TableCell>
              <TableCell onClick={() => handleSort('chinese_name')}>
                中文姓名 {getSortIcon('chinese_name')}
              </TableCell>
              <TableCell onClick={() => handleSort('english_name')}>
                英文姓名 {getSortIcon('english_name')}
              </TableCell>
              <TableCell onClick={() => handleSort('department_class')}>
                系級 {getSortIcon('department_class')}
              </TableCell>
              <TableCell onClick={() => handleSort('is_guest')}>
                會員類型 {getSortIcon('is_guest')}
              </TableCell>
              <TableCell onClick={() => handleSort('is_admin')}>
                管理權限 {getSortIcon('is_admin')}
              </TableCell>
              <TableCell onClick={() => handleSort('handicap')}>
                差點 {getSortIcon('handicap')}
              </TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredMembers.map((member) => renderMemberRow(member))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={uploadOpen} onClose={handleUploadClose}>
        <DialogTitle>上傳會員資料</DialogTitle>
        <DialogContent>
          <input
            type="file"
            accept=".xlsx"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            id="excel-upload"
          />
          <label htmlFor="excel-upload">
            <Button variant="contained" component="span">
              選擇 EXCEL 檔案
            </Button>
          </label>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUploadClose}>關閉</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editDialogOpen} onClose={handleEditClose}>
        <DialogTitle>編輯會員資料</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            name="member_number"
            label="會員編號"
            fullWidth
            value={editMember?.member_number || ''}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="account"
            label="帳號"
            fullWidth
            value={editMember?.account || ''}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="chinese_name"
            label="中文姓名"
            fullWidth
            value={editMember?.chinese_name || ''}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="english_name"
            label="英文姓名"
            fullWidth
            value={editMember?.english_name || ''}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="department_class"
            label="系級"
            fullWidth
            value={editMember?.department_class || ''}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="handicap"
            label="差點"
            type="number"
            fullWidth
            value={editMember?.handicap || ''}
            onChange={handleInputChange}
            inputProps={{ step: "0.1" }}
          />
          <FormControlLabel
            control={
              <Checkbox
                name="is_guest"
                checked={editMember?.is_guest || false}
                onChange={handleInputChange}
              />
            }
            label="來賓"
          />
          <FormControlLabel
            control={
              <Checkbox
                name="is_admin"
                checked={editMember?.is_admin || false}
                onChange={handleInputChange}
              />
            }
            label="管理員"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>取消</Button>
          <Button onClick={handleEditSave} variant="contained">儲存</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>新增會員</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="帳號"
            fullWidth
          />
          <TextField
            margin="dense"
            label="中文姓名"
            fullWidth
          />
          <TextField
            margin="dense"
            label="英文姓名"
            fullWidth
          />
          <TextField
            margin="dense"
            label="系級"
            fullWidth
          />
          <TextField
            margin="dense"
            label="會員編號"
            fullWidth
          />
          <FormControlLabel
            control={<Switch />}
            label="來賓"
          />
          <FormControlLabel
            control={<Switch />}
            label="管理員"
          />
          <TextField
            margin="dense"
            label="差點"
            type="number"
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>取消</Button>
          <Button variant="contained">確認</Button>
        </DialogActions>
      </Dialog>

      {/* 版本比較對話框 */}
      <Dialog open={compareDialogOpen} onClose={() => setCompareDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>版本比較</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, mb: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                select
                label="從版本"
                value={compareVersions.from}
                onChange={(e) => setCompareVersions(prev => ({ ...prev, from: e.target.value }))}
                fullWidth
                SelectProps={{ native: true }}
              >
                <option value="">請選擇版本</option>
                {versionList.map(v => (
                  <option key={v.version} value={v.version}>{v.version}</option>
                ))}
              </TextField>
              <TextField
                select
                label="至版本"
                value={compareVersions.to}
                onChange={(e) => setCompareVersions(prev => ({ ...prev, to: e.target.value }))}
                fullWidth
                SelectProps={{ native: true }}
              >
                <option value="">請選擇版本</option>
                {versionList.map(v => (
                  <option key={v.version} value={v.version}>{v.version}</option>
                ))}
              </TextField>
              <Button variant="contained" onClick={handleCompareVersions}>
                比較
              </Button>
            </Stack>
          </Box>

          {/* 版本列表 */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              版本歷史
            </Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>版本號</TableCell>
                    <TableCell>建立時間</TableCell>
                    <TableCell align="right">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {versionList.map((version) => (
                    <TableRow key={version.version}>
                      <TableCell>{version.version}</TableCell>
                      <TableCell>
                        {new Date(version.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        {version.version !== versionList[0].version && (  // 不是最新版本才顯示刪除按鈕
                          <Tooltip title="刪除此版本">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteVersion(version.version)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* 比較結果 */}
          {compareResults && compareResults.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                差異項目
              </Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>會員編號</TableCell>
                      <TableCell>姓名</TableCell>
                      <TableCell>變更欄位</TableCell>
                      <TableCell>舊值</TableCell>
                      <TableCell>新值</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {compareResults.map((diff, index) => (
                      <TableRow key={index}>
                        <TableCell>{diff.member_number}</TableCell>
                        <TableCell>{diff.name}</TableCell>
                        <TableCell>{diff.field}</TableCell>
                        <TableCell>{diff.old_value}</TableCell>
                        <TableCell>{diff.new_value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompareDialogOpen(false)}>關閉</Button>
        </DialogActions>
      </Dialog>

      {/* 刪除確認對話框 */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>刪除確認</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            確定要刪除版本 {versionToDelete} 嗎？
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>取消</Button>
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>
            刪除
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
};

export default Members;

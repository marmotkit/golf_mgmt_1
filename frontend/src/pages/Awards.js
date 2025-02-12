import React, { useState, useEffect } from 'react';
import {
  Select,
  Button,
  Table,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Space,
  Typography
} from '@mui/material';
import * as awardService from '../services/awardService';
import * as tournamentService from '../services/tournamentService';

const Awards = () => {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [awards, setAwards] = useState([]);
  const [awardTypes, setAwardTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentEditId, setCurrentEditId] = useState(null);
  const [form] = Form.useForm();

  // 表格列定義
  const columns = [
    {
      title: '獎項類型',
      dataIndex: 'award_type_name',
      key: 'award_type_name',
    },
    {
      title: '組別',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: '得獎者',
      dataIndex: 'winner_name',
      key: 'winner_name',
    },
    {
      title: '成績',
      dataIndex: 'score',
      key: 'score',
    },
    {
      title: '名次',
      dataIndex: 'rank',
      key: 'rank',
    },
    {
      title: '洞號',
      dataIndex: 'hole_number',
      key: 'hole_number',
    },
    {
      title: '備註',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button variant="text" onClick={() => handleEdit(record)}>
            編輯
          </Button>
          <Popconfirm
            title="確定要刪除這個獎項嗎？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button variant="text" color="error">
              刪除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 初始化數據
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [tournamentsData, typesData] = await Promise.all([
          tournamentService.getAllTournaments(),
          awardService.getAwardTypes()
        ]);
        setTournaments(tournamentsData);
        setAwardTypes(typesData);
      } catch (error) {
        message.error('初始化數據失敗：' + error.message);
      }
    };
    fetchInitialData();
  }, []);

  // 加載賽事獎項
  const loadAwards = async () => {
    if (!selectedTournament) return;
    setLoading(true);
    try {
      const data = await awardService.getTournamentAwards(selectedTournament);
      const awardsWithTypes = data.map(award => ({
        ...award,
        award_type_name: awardTypes.find(t => t.id === award.award_type)?.name || '未知'
      }));
      setAwards(awardsWithTypes);
    } catch (error) {
      message.error('加載獎項失敗：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 處理賽事選擇變更
  const handleTournamentChange = (value) => {
    setSelectedTournament(value);
    loadAwards();
  };

  // 顯示新增獎項對話框
  const showAddModal = () => {
    setModalMode('add');
    form.resetFields();
    setModalVisible(true);
  };

  // 處理編輯
  const handleEdit = (record) => {
    setModalMode('edit');
    setCurrentEditId(record.id);
    form.setFieldsValue({
      award_type: record.award_type,
      category: record.category,
      winner_name: record.winner_name,
      score: record.score,
      rank: record.rank,
      hole_number: record.hole_number,
      description: record.description
    });
    setModalVisible(true);
  };

  // 處理刪除
  const handleDelete = async (id) => {
    try {
      await awardService.deleteTournamentAward(id);
      message.success('刪除成功');
      loadAwards();
    } catch (error) {
      message.error('刪除失敗：' + error.message);
    }
  };

  // 處理表單提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const awardData = {
        tournament_id: selectedTournament,
        ...values
      };

      if (modalMode === 'add') {
        await awardService.createTournamentAward(awardData);
        message.success('新增成功');
      } else {
        await awardService.updateTournamentAward(currentEditId, awardData);
        message.success('更新成功');
      }

      setModalVisible(false);
      loadAwards();
    } catch (error) {
      message.error(modalMode === 'add' ? '新增失敗：' : '更新失敗：' + error.message);
    }
  };

  // 渲染表單項
  const renderFormItems = (awardType) => {
    const items = [
      <Form.Item
        key="award_type"
        name="award_type"
        label="獎項類型"
        rules={[{ required: true, message: '請選擇獎項類型' }]}
      >
        <Select placeholder="請選擇獎項類型">
          {awardTypes.map(type => (
            <Select.Option key={type.id} value={type.id}>
              {type.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
    ];

    if (awardType?.has_category) {
      items.push(
        <Form.Item key="category" name="category" label="組別">
          <Input placeholder="請輸入組別" />
        </Form.Item>
      );
    }

    items.push(
      <Form.Item
        key="winner_name"
        name="winner_name"
        label="得獎者"
        rules={[{ required: true, message: '請輸入得獎者姓名' }]}
      >
        <Input placeholder="請輸入得獎者姓名" />
      </Form.Item>
    );

    if (awardType?.has_score) {
      items.push(
        <Form.Item key="score" name="score" label="成績">
          <Input type="number" placeholder="請輸入成績" />
        </Form.Item>
      );
    }

    if (awardType?.has_rank) {
      items.push(
        <Form.Item key="rank" name="rank" label="名次">
          <Input type="number" placeholder="請輸入名次" />
        </Form.Item>
      );
    }

    if (awardType?.has_hole_number) {
      items.push(
        <Form.Item key="hole_number" name="hole_number" label="洞號">
          <Input type="number" placeholder="請輸入洞號" />
        </Form.Item>
      );
    }

    items.push(
      <Form.Item key="description" name="description" label="備註">
        <Input.TextArea placeholder="請輸入備註（選填）" />
      </Form.Item>
    );

    return items;
  };

  return (
    <div style={{ padding: '24px' }}>
      <Typography variant="h4" gutterBottom>
        獎項管理
      </Typography>
      
      <div style={{ marginBottom: '16px' }}>
        <Select
          value={selectedTournament}
          style={{ width: 300 }}
          placeholder="請選擇賽事"
          onChange={handleTournamentChange}
        >
          {tournaments.map(tournament => (
            <Select.Option key={tournament.id} value={tournament.id}>
              {tournament.name}
            </Select.Option>
          ))}
        </Select>
      </div>

      {selectedTournament && (
        <div>
          <div style={{ marginBottom: '16px', textAlign: 'right' }}>
            <Button variant="contained" color="primary" onClick={showAddModal}>
              新增獎項
            </Button>
          </div>

          <Table
            dataSource={awards}
            columns={columns}
            loading={loading}
            rowKey="id"
            pagination={false}
          />
        </div>
      )}

      <Modal
        open={modalVisible}
        title={modalMode === 'add' ? '新增獎項' : '編輯獎項'}
        onOk={handleSubmit}
        onClose={() => setModalVisible(false)}
      >
        <Form
          form={form}
          layout="vertical"
        >
          {renderFormItems(awardTypes.find(t => t.id === form.getFieldValue('award_type')))}
        </Form>
      </Modal>
    </div>
  );
};

export default Awards; 
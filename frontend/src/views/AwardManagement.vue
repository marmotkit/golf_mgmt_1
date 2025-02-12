<template>
  <div class="award-management">
    <h2>獎項管理</h2>
    
    <!-- 賽事選擇 -->
    <div class="tournament-select mb-4">
      <a-select
        v-model:value="selectedTournament"
        style="width: 300px"
        placeholder="請選擇賽事"
        @change="handleTournamentChange"
      >
        <a-select-option v-for="tournament in tournaments" :key="tournament.id" :value="tournament.id">
          {{ tournament.name }}
        </a-select-option>
      </a-select>
    </div>

    <!-- 獎項列表 -->
    <div v-if="selectedTournament" class="awards-table">
      <div class="table-operations mb-4">
        <a-button type="primary" @click="showAddAwardModal">
          新增獎項
        </a-button>
      </div>

      <a-table
        :dataSource="awards"
        :columns="columns"
        :loading="loading"
        rowKey="id"
        :pagination="false"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" @click="handleEdit(record)">編輯</a-button>
              <a-popconfirm
                title="確定要刪除這個獎項嗎？"
                ok-text="確定"
                cancel-text="取消"
                @confirm="handleDelete(record.id)"
              >
                <a-button type="link" danger>刪除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 新增/編輯獎項對話框 -->
    <a-modal
      v-model:visible="modalVisible"
      :title="modalMode === 'add' ? '新增獎項' : '編輯獎項'"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
      :confirmLoading="modalLoading"
    >
      <a-form
        ref="awardForm"
        :model="awardForm"
        :rules="rules"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
      >
        <a-form-item label="獎項類型" name="award_type_id">
          <a-select
            v-model:value="awardForm.award_type_id"
            placeholder="請選擇獎項類型"
          >
            <a-select-option v-for="type in awardTypes" :key="type.id" :value="type.id">
              {{ type.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="獲獎者" name="chinese_name">
          <a-input v-model:value="awardForm.chinese_name" placeholder="請輸入獲獎者姓名" />
        </a-form-item>
        <a-form-item label="備註" name="remarks">
          <a-textarea v-model:value="awardForm.remarks" placeholder="請輸入備註（選填）" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, reactive } from 'vue';
import { message } from 'ant-design-vue';
import {
  getTournamentAwards,
  createTournamentAward,
  updateTournamentAward,
  deleteTournamentAward,
  getAwardTypes
} from '../services/awardService';
import { getTournaments } from '../services/tournamentService';

export default defineComponent({
  name: 'AwardManagement',
  setup() {
    const tournaments = ref([]);
    const selectedTournament = ref(null);
    const awards = ref([]);
    const awardTypes = ref([]);
    const loading = ref(false);
    const modalVisible = ref(false);
    const modalMode = ref('add');
    const modalLoading = ref(false);
    const awardForm = reactive({
      award_type_id: undefined,
      chinese_name: '',
      remarks: ''
    });
    const currentEditId = ref(null);

    const columns = [
      {
        title: '獎項類型',
        dataIndex: ['award_type', 'name'],
        key: 'award_type_name',
      },
      {
        title: '獲獎者',
        dataIndex: 'chinese_name',
        key: 'chinese_name',
      },
      {
        title: '備註',
        dataIndex: 'remarks',
        key: 'remarks',
      },
      {
        title: '操作',
        key: 'action',
        width: 150,
      },
    ];

    const rules = {
      award_type_id: [{ required: true, message: '請選擇獎項類型' }],
      chinese_name: [{ required: true, message: '請輸入獲獎者姓名' }],
    };

    // 初始化數據
    const initData = async () => {
      try {
        const [tournamentsData, typesData] = await Promise.all([
          getTournaments(),
          getAwardTypes()
        ]);
        tournaments.value = tournamentsData;
        awardTypes.value = typesData;
      } catch (error) {
        message.error('初始化數據失敗：' + error.message);
      }
    };

    // 加載賽事獎項
    const loadAwards = async () => {
      if (!selectedTournament.value) return;
      loading.value = true;
      try {
        const data = await getTournamentAwards(selectedTournament.value);
        awards.value = data.map(award => ({
          ...award,
          award_type_name: awardTypes.value.find(t => t.id === award.award_type_id)?.name || '未知'
        }));
      } catch (error) {
        message.error('加載獎項失敗：' + error.message);
      } finally {
        loading.value = false;
      }
    };

    // 處理賽事變更
    const handleTournamentChange = () => {
      loadAwards();
    };

    // 顯示新增獎項對話框
    const showAddAwardModal = () => {
      modalMode.value = 'add';
      Object.assign(awardForm, {
        award_type_id: undefined,
        chinese_name: '',
        remarks: ''
      });
      modalVisible.value = true;
    };

    // 處理編輯
    const handleEdit = (record) => {
      modalMode.value = 'edit';
      currentEditId.value = record.id;
      Object.assign(awardForm, {
        award_type_id: record.award_type_id,
        chinese_name: record.chinese_name,
        remarks: record.remarks || ''
      });
      modalVisible.value = true;
    };

    // 處理刪除
    const handleDelete = async (id) => {
      try {
        await deleteTournamentAward(id);
        message.success('刪除成功');
        loadAwards();
      } catch (error) {
        message.error('刪除失敗：' + error.message);
      }
    };

    // 處理對話框確認
    const handleModalOk = async () => {
      modalLoading.value = true;
      try {
        const awardData = {
          tournament_id: selectedTournament.value,
          award_type_id: awardForm.award_type_id,
          chinese_name: awardForm.chinese_name,
          remarks: awardForm.remarks
        };

        if (modalMode.value === 'add') {
          await createTournamentAward(awardData);
          message.success('新增成功');
        } else {
          await updateTournamentAward(currentEditId.value, awardData);
          message.success('更新成功');
        }

        modalVisible.value = false;
        loadAwards();
      } catch (error) {
        message.error(modalMode.value === 'add' ? '新增失敗：' : '更新失敗：' + error.message);
      } finally {
        modalLoading.value = false;
      }
    };

    // 處理對話框取消
    const handleModalCancel = () => {
      modalVisible.value = false;
    };

    onMounted(() => {
      initData();
    });

    return {
      tournaments,
      selectedTournament,
      awards,
      awardTypes,
      loading,
      columns,
      modalVisible,
      modalMode,
      modalLoading,
      awardForm,
      rules,
      handleTournamentChange,
      showAddAwardModal,
      handleEdit,
      handleDelete,
      handleModalOk,
      handleModalCancel
    };
  }
});
</script>

<style scoped>
.award-management {
  padding: 24px;
}

.mb-4 {
  margin-bottom: 16px;
}

.table-operations {
  display: flex;
  justify-content: flex-end;
}
</style> 
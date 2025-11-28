<template>
  <div class="query-registration">
    <van-nav-bar title="查询报名记录" left-arrow @click-left="goBack" fixed />

    <div class="content">
      <div class="search-box">
        <van-cell-group inset>
          <van-field v-model="form.studentName" label="姓名" placeholder="请输入姓名" clearable />
          <van-field v-model="form.studentPhone" label="手机号" placeholder="请输入手机号" type="tel" clearable />
        </van-cell-group>
        <div class="search-btn">
          <van-button type="primary" block round @click="handleSearch" :loading="loading">查询</van-button>
        </div>
      </div>

      <div class="result-list" v-if="hasSearched">
        <van-empty v-if="registrations.length === 0" description="未查询到报名记录" />
        
        <div v-for="reg in registrations" :key="reg.id" class="reg-card">
          <div class="card-header">
            <h3>{{ reg.activityName }}</h3>
            <van-tag v-if="reg.checkInStatus === 1" type="success">已签到</van-tag>
            <van-tag v-else type="warning">未签到</van-tag>
          </div>

          <van-cell-group inset>
            <van-cell title="报名时间" :value="formatTime(reg.createTime)" icon="clock-o" />
            <van-cell title="活动地点" :value="reg.location || '加载中...'" icon="location-o" />
            <van-cell title="活动时间" :value="formatTime(reg.startTime) || '加载中...'" icon="underway-o" />
            <van-cell v-if="reg.checkInTime" title="签到时间" :value="formatTime(reg.checkInTime)" icon="success" />
          </van-cell-group>

          <div class="card-footer">
            <van-button 
              v-if="reg.checkInStatus === 0 && canCheckIn(reg)" 
              type="primary" 
              size="small"
              @click="goToCheckIn(reg)"
            >
              前往签到
            </van-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { NavBar, CellGroup, Field, Button, Empty, Tag, Cell, showToast } from 'vant'
import { getStudentRegistrationRecords, getActivityDetail } from '@/api/student'

const router = useRouter()

const form = ref({
  studentName: '',
  studentPhone: ''
})

const loading = ref(false)
const hasSearched = ref(false)
const registrations = ref([])

const handleSearch = async () => {
  if (!form.value.studentName || !form.value.studentPhone) {
    showToast('请输入姓名和手机号')
    return
  }

  loading.value = true
  hasSearched.value = true
  registrations.value = []

  try {
    const res = await getStudentRegistrationRecords(form.value)
    
    if (res.code === 200) {
      const list = res.data || []
      
      // 先显示基本信息
      registrations.value = list

      // 并发获取活动详情以补充地点和时间信息
      const detailPromises = list.map(async (item, index) => {
        try {
          const detailRes = await getActivityDetail(item.activityId)
          if (detailRes.code === 200) {
            // 更新列表中的数据
            registrations.value[index] = {
              ...item,
              location: detailRes.data.location,
              startTime: detailRes.data.startTime,
              endTime: detailRes.data.endTime
            }
          }
        } catch (e) {
          console.error(`加载活动${item.activityId}详情失败`)
        }
      })
      
      await Promise.all(detailPromises)
    }
  } catch (error) {
    showToast('查询失败')
  } finally {
    loading.value = false
  }
}

const canCheckIn = (reg) => {
  if (!reg.startTime || !reg.endTime) return false
  const now = new Date()
  const startTime = new Date(reg.startTime)
  const endTime = new Date(reg.endTime)
  return now >= startTime && now <= endTime
}

const goToCheckIn = (reg) => {
  router.push({
    path: '/checkin',
    query: { activityId: reg.activityId }
  })
}

const goBack = () => {
  router.back()
}

const formatTime = (time) => {
  if (!time) return ''
  return time.replace('T', ' ').substring(0, 16)
}
</script>

<style scoped>
.query-registration {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.content {
  padding-top: 46px;
  padding-bottom: 20px;
}

.search-box {
  background: white;
  padding: 16px;
  margin-bottom: 12px;
}

.search-btn {
  margin-top: 16px;
  padding: 0 16px;
}

.reg-card {
  margin: 12px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.card-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  flex: 1;
  margin-right: 12px;
}

.card-footer {
  padding: 12px 16px;
  text-align: right;
}
</style>

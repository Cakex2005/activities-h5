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
        
        <div class="grid-container">
          <div v-for="reg in registrations" :key="reg.id" class="reg-card">
            <div class="card-content">
              <div class="card-header-row">
                <h3 class="title" :class="{ 'deleted-text': reg.isDeleted }">{{ reg.activityName }}</h3>
              </div>
              
              <div class="status-row">
                <van-tag v-if="reg.checkInStatus === 1" type="success">已签到</van-tag>
                <van-tag v-else type="warning">未签到</van-tag>
              </div>

              <div class="info-row">
                <van-icon name="clock-o" />
                <span>{{ formatTime(reg.createTime) }}</span>
              </div>
              <div class="info-row">
                <van-icon name="location-o" />
                <span>{{ reg.location || '加载中...' }}</span>
              </div>
              <div class="info-row">
                <van-icon name="underway-o" />
                <span>{{ formatTime(reg.startTime) || '加载中...' }}</span>
              </div>
              <div class="info-row" v-if="reg.checkInTime">
                <van-icon name="success" />
                <span>{{ formatTime(reg.checkInTime) }}</span>
              </div>

              <div class="footer" v-if="reg.checkInStatus === 0 && canCheckIn(reg)">
                <van-button 
                  type="primary" 
                  size="small"
                  block
                  @click="goToCheckIn(reg)"
                >
                  前往签到
                </van-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { NavBar, CellGroup, Field, Button, Empty, Tag, Cell, showToast, Icon } from 'vant'
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
          // 获取详情失败，可能是活动已删除
          registrations.value[index] = {
            ...item,
            activityName: `${item.activityName || '未知活动'} (活动已删除)`,
            location: '活动已删除',
            startTime: '活动已删除',
            isDeleted: true
          }
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
  if (!reg.startTime || !reg.endTime || reg.isDeleted) return false
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
  if (typeof time === 'string' && time.includes('已删除')) return time
  return time.replace('T', ' ').substring(0, 16)
}
</script>

<style scoped>
.query-registration {
  height: 100vh; /* 使用100vh确保填满视口 */
  width: 100vw; /* 确保宽度填满 */
  background-color: #f7f8fa;
  position: fixed; /* 使用fixed定位防止滚动时背景露底 */
  top: 0;
  left: 0;
  overflow-y: auto; /* 允许内部滚动 */
  -webkit-overflow-scrolling: touch; /* 优化iOS滚动体验 */
}

.content {
  padding-top: 46px;
  padding-bottom: 20px;
}

.search-box {
  background: white;
  padding: 16px;
  margin: 12px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.search-btn {
  margin-top: 16px;
}

/* 网格布局容器 */
.grid-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* 双列布局 */
  gap: 12px;
  padding: 0 12px 12px 12px; /* 左右下padding */
}

.reg-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
}

.card-content {
  padding: 10px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-header-row {
  margin-bottom: 8px;
}

.title {
  font-size: 15px;
  font-weight: 600;
  color: #323233;
  margin: 0;
  /* 限制标题行数 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
  height: 42px;
}

.status-row {
  margin-bottom: 8px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 6px;
  font-size: 12px;
  color: #666;
}

.info-row span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.footer {
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px solid #f5f5f5;
}

.deleted-text {
  color: #999 !important;
}
</style>

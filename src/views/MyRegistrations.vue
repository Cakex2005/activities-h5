<template>
  <div class="my-registrations">
    <van-nav-bar title="我的报名" left-arrow @click-left="goBack" fixed>
      <template #right>
        <span style="color: #1989fa; font-size: 14px;" @click="handleLogout">退出</span>
      </template>
    </van-nav-bar>

    <div class="content">
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <van-empty v-if="!loading && registrations.length === 0" description="暂无报名记录" />
        
        <div v-for="reg in registrations" :key="reg.id" class="reg-card">
          <div class="card-header">
            <h3>{{ reg.activityName }}</h3>
            <van-tag v-if="reg.checkInStatus === 1" type="success">已签到</van-tag>
            <van-tag v-else type="warning">未签到</van-tag>
          </div>

          <van-cell-group inset>
            <van-cell title="报名时间" :value="formatTime(reg.createTime)" icon="clock-o" />
            <van-cell title="活动地点" :value="reg.location" icon="location-o" />
            <van-cell title="活动时间" :value="formatTime(reg.startTime)" icon="underway-o" />
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
      </van-pull-refresh>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NavBar, PullRefresh, Empty, Tag, CellGroup, Cell, Button, showToast, Dialog } from 'vant'
import { getMyRegistrations, getActivityDetail } from '@/api/student'

const router = useRouter()

const registrations = ref([])
const loading = ref(false)
const refreshing = ref(false)

onMounted(() => {
  loadData()
})

const loadData = async () => {
  const studentInfoStr = localStorage.getItem('studentInfo')
  if (!studentInfoStr) {
    showToast('请先登录')
    router.replace('/')
    return
  }
  
  const studentInfo = JSON.parse(studentInfoStr)
  
  loading.value = true
  try {
    const res = await getMyRegistrations({
      pageNum: 1,
      pageSize: 100,
      studentPhone: studentInfo.phone // 使用手机号筛选
    })
    
    if (res.code === 200) {
      const list = res.data.list || []
      
      // 并发获取活动详情以补充地点和时间信息
      // 注意：这会产生多次请求，但由于不能修改后端，这是前端唯一的补救办法
      const detailPromises = list.map(async (item) => {
        try {
          const detailRes = await getActivityDetail(item.activityId)
          if (detailRes.code === 200) {
            return {
              ...item,
              location: detailRes.data.location,
              startTime: detailRes.data.startTime,
              endTime: detailRes.data.endTime
            }
          }
        } catch (e) {
          console.error(`加载活动${item.activityId}详情失败`)
        }
        return item
      })
      
      registrations.value = await Promise.all(detailPromises)
    }
  } catch (error) {
    showToast('加载失败')
  } finally {
    loading.value = false
  }
}

const onRefresh = async () => {
  await loadData()
  refreshing.value = false
}

const handleLogout = () => {
  Dialog.confirm({
    title: '提示',
    message: '确定要退出登录吗？'
  }).then(() => {
    localStorage.removeItem('studentInfo')
    showToast('已退出登录')
    router.replace('/')
  }).catch(() => {})
}

const canCheckIn = (reg) => {
  if (!reg.startTime || !reg.endTime) return false
  // 检查是否在活动时间内
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
  if (!time) return '-'
  return time.replace('T', ' ').substring(0, 16)
}
</script>

<style scoped>
.my-registrations {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.content {
  padding-top: 46px;
  padding-bottom: 20px;
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

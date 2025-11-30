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
            <!-- 点击卡片跳转到活动详情 -->
            <div @click="goToDetail(reg)">
              <van-image
                v-if="reg.posterUrl"
                :src="reg.posterUrl"
                fit="cover"
                class="poster"
              >
                <template #error>
                  <div class="image-placeholder">
                    <van-icon name="photo-o" size="40" />
                  </div>
                </template>
              </van-image>
              <div v-else class="image-placeholder">
                <van-icon name="photo-o" size="40" />
              </div>
            
              <div class="card-content">
                <div class="card-header-row">
                  <h3 class="title" :class="{ 'deleted-text': reg.isDeleted }">{{ reg.activityName }}</h3>
                </div>
                
                <div class="status-row">
                  <van-tag v-if="reg.registrationStatus === 2" type="default">已取消</van-tag>
                  <van-tag v-else-if="reg.checkInStatus === 1" type="success">已签到</van-tag>
                  <van-tag v-else type="warning">未签到</van-tag>
                </div>

                <div class="info-row">
                  <van-icon name="location-o" />
                  <span>{{ reg.location || '加载中...' }}</span>
                </div>
                <div class="info-row">
                  <van-icon name="clock-o" />
                  <span>{{ formatTime(reg.startTime) || '加载中...' }}</span>
                </div>
              </div>
            </div>

            <!-- 操作按钮区域 -->
            <div class="footer">
              <!-- 签到提示按钮 -->
              <van-button 
                v-if="reg.registrationStatus === 1 && reg.checkInStatus === 0 && canCheckIn(reg)"
                type="primary" 
                size="small"
                block
                disabled
                class="scan-hint-btn"
              >
                请扫描二维码签到
              </van-button>
              
              <!-- 取消报名按钮 -->
              <van-button 
                v-if="reg.registrationStatus === 1 && canCancel(reg)"
                type="warning" 
                size="small"
                block
                @click.stop="handleCancel(reg)"
              >
                取消报名
              </van-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { NavBar, CellGroup, Field, Button, Empty, Tag, Icon, Image as VanImage, showToast, showSuccessToast, showConfirmDialog } from 'vant'
import { getStudentRegistrationRecords, getActivityDetail, cancelRegistration } from '@/api/student'

defineOptions({
  name: 'QueryRegistration'
})

const router = useRouter()

const form = ref({
  studentName: '',
  studentPhone: ''
})

const loading = ref(false)
const hasSearched = ref(false)
const registrations = ref([])

// 当页面从缓存激活时，如果之前查询过，自动刷新数据
onActivated(() => {
  if (hasSearched.value && form.value.studentName && form.value.studentPhone) {
    handleSearch()
  }
})

const handleSearch = async () => {
  if (!form.value.studentName || !form.value.studentPhone) {
    showToast('请输入姓名和手机号')
    return
  }

  const phoneRegex = /^1[3-9]\d{9}$/
  if (!phoneRegex.test(form.value.studentPhone)) {
    showToast('请输入正确的手机号格式')
    return
  }

  loading.value = true
  hasSearched.value = true
  registrations.value = []

  try {
    const res = await getStudentRegistrationRecords(form.value)
    
    if (res.code === 200) {
      const list = res.data || []
      registrations.value = list

      // 并发获取活动详情
      const detailPromises = list.map(async (item, index) => {
        try {
          const detailRes = await getActivityDetail(item.activityId)
          if (detailRes.code === 200) {
            registrations.value[index] = {
              ...item,
              // 补充活动名称，因为报名记录中可能没有
              activityName: detailRes.data.activityName,
              location: detailRes.data.location,
              startTime: detailRes.data.startTime,
              endTime: detailRes.data.endTime,
              posterUrl: detailRes.data.posterUrl
            }
          }
        } catch (e) {
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

// 判断是否可以签到
const canCheckIn = (reg) => {
  if (!reg.startTime || !reg.endTime || reg.isDeleted) return false
  const now = new Date()
  const startTime = new Date(reg.startTime)
  const endTime = new Date(reg.endTime)
  
  // 签到时间范围：活动开始前半小时 ~ 活动结束一小时
  const checkInStart = new Date(startTime.getTime() - 30 * 60 * 1000)
  const checkInEnd = new Date(endTime.getTime() + 60 * 60 * 1000)
  
  return now >= checkInStart && now <= checkInEnd
}

// 判断是否可以取消报名
const canCancel = (reg) => {
  if (reg.isDeleted) return false
  if (!reg.startTime) return false
  const now = new Date()
  const startTime = new Date(reg.startTime)
  return now < startTime
}

// 取消报名
const handleCancel = async (reg) => {
  try {
    await showConfirmDialog({
      title: '确认取消',
      message: `确定要取消报名"${reg.activityName}"吗？`
    })
    
    const res = await cancelRegistration(reg.id)
    if (res.code === 200) {
      showSuccessToast('取消成功')
      // 重新查询
      await handleSearch()
    } else {
      // 显示后端返回的具体错误信息
      showToast(res.message || '取消失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('取消报名失败:', error)
      // 尝试获取响应中的错误信息
      const errorMsg = error.response?.data?.message || error.message || '取消失败'
      showToast(errorMsg)
    }
  }
}

// 跳转到活动详情
const goToDetail = (reg) => {
  if (reg.isDeleted) {
    showToast('活动已删除')
    return
  }
  // 传递registrationId, registrationStatus和checkInStatus
  router.push({
    path: `/activity/${reg.activityId}`,
    query: { 
      registrationId: reg.id,
      registrationStatus: reg.registrationStatus,
      checkInStatus: reg.checkInStatus
    }
  })
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
  height: 100vh;
  width: 100vw;
  background-color: #f7f8fa;
  position: fixed;
  top: 0;
  left: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
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

.grid-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 0 12px 12px 12px;
}

.reg-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
}

.poster {
  width: 100%;
  height: 120px;
}

.image-placeholder {
  width: 100%;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  color: #aaa;
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
  padding: 8px 10px;
  border-top: 1px solid #f5f5f5;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.deleted-text {
  color: #999 !important;
}

.scan-hint-btn {
  opacity: 1 !important;
  background-color: #e8f3ff !important;
  border-color: #e8f3ff !important;
  color: #1989fa !important;
}
</style>

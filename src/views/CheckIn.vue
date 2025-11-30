<template>
  <div class="checkin">
    <van-nav-bar title="活动签到" left-arrow @click-left="goBack" fixed />

    <div class="content">
      <div class="checkin-card">
        <!-- 扫码成功显示活动信息 -->
        <div v-if="activityInfo" class="activity-info">
          <van-icon name="success" size="60" color="#07c160" />
          <h3>{{ activityInfo.activityName }}</h3>
          <p class="info-text">
            <van-icon name="clock-o" /> {{ formatTime(activityInfo.startTime) }}
          </p>
          <p class="info-text">
            <van-icon name="location-o" /> {{ activityInfo.location }}
          </p>
          <van-divider />
        </div>
        
        <div v-else>
          <van-icon name="scan" size="60" color="#1989fa" />
          <h2>活动签到</h2>
          <p>请输入活动ID和手机号进行签到</p>
          <van-divider />
        </div>

        <van-form @submit="handleCheckIn">
          <!-- 扫码模式下隐藏活动ID输入框 -->
          <van-field
            v-if="!isScanMode"
            v-model="checkInForm.activityId"
            label="活动ID"
            placeholder="请输入活动ID"
            type="number"
            required
            :disabled="isActivityIdFixed"
          />
          
          <van-field
            v-model="checkInForm.studentPhone"
            label="手机号"
            placeholder="请输入报名手机号"
            type="tel"
            required
          />
          
          <div style="margin: 16px;">
            <van-button 
              round 
              block 
              type="primary" 
              native-type="submit"
              :loading="loading"
            >
              立即签到
            </van-button>
          </div>
        </van-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NavBar, Icon, Divider, Form, Field, Button, showSuccessToast, showToast, showLoadingToast, closeToast } from 'vant'
import { checkIn, validateCheckInToken, checkInByToken, getActivityDetail } from '@/api/student'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const activityInfo = ref(null)
const isScanMode = ref(false)

const checkInForm = ref({
  activityId: '',
  studentPhone: '',
  checkInToken: ''
})

const isActivityIdFixed = computed(() => isScanMode.value || !!route.query.activityId)

onMounted(async () => {
  const token = route.query.token
  const qActivityId = route.query.activityId
  
  console.log('[签到页面] 访问来源:', window.location.href)
  console.log('[签到页面] hostname:', window.location.hostname)
  console.log('[签到页面] token:', token)
  console.log('[签到页面] activityId:', qActivityId)
  
  if (token) {
    // 扫码模式
    isScanMode.value = true
    checkInForm.value.checkInToken = token
    await validateToken(token)
  } else if (qActivityId) {
    // 普通链接带参数模式
    checkInForm.value.activityId = qActivityId
    await loadActivityInfo(qActivityId)
  }
})

const validateToken = async (token) => {
  showLoadingToast({ message: '验证中...', forbidClick: true })
  try {
    console.log('[验证Token] 开始验证...')
    const res = await validateCheckInToken(token)
    console.log('[验证Token] 响应:', res)
    
    if (res.code === 200) {
      const activityId = res.data.activityId
      checkInForm.value.activityId = activityId
      // 获取活动详情用于展示
      await loadActivityInfo(activityId)
      closeToast()
    } else {
      showToast(res.message || '二维码无效')
    }
  } catch (error) {
    console.error('[验证Token] 失败:', error)
    showToast('验证失败')
  }
}

const loadActivityInfo = async (id) => {
  try {
    const res = await getActivityDetail(id)
    if (res.code === 200) {
      activityInfo.value = res.data
      checkCheckInTime()
    }
  } catch (error) {
    console.error('加载活动信息失败', error)
  }
}

const checkCheckInTime = () => {
  if (!activityInfo.value) return
  
  const now = new Date()
  const startTime = new Date(activityInfo.value.startTime)
  const endTime = new Date(activityInfo.value.endTime)
  
  // 签到时间范围：活动开始前半小时 ~ 活动结束一小时
  const checkInStart = new Date(startTime.getTime() - 30 * 60 * 1000)
  const checkInEnd = new Date(endTime.getTime() + 60 * 60 * 1000)
  
  if (now < checkInStart) {
    showToast(`签到尚未开始。签到时间：${formatTime(checkInStart.toISOString())} - ${formatTime(checkInEnd.toISOString())}`)
  } else if (now > checkInEnd) {
    showToast(`签到已结束。签到时间：${formatTime(checkInStart.toISOString())} - ${formatTime(checkInEnd.toISOString())}`)
  }
}

const handleCheckIn = async () => {
  if (!checkInForm.value.studentPhone) {
    showToast('请输入手机号')
    return
  }

  loading.value = true
  try {
    let res
    console.log('[签到] 模式:', isScanMode.value ? '扫码签到' : '普通签到')
    console.log('[签到] 表单数据:', checkInForm.value)
    
    if (isScanMode.value && checkInForm.value.checkInToken) {
      // 扫码签到
      res = await checkInByToken({
        checkInToken: checkInForm.value.checkInToken,
        studentPhone: checkInForm.value.studentPhone
      })
    } else {
      // 普通签到
      res = await checkIn({
        activityId: checkInForm.value.activityId,
        studentPhone: checkInForm.value.studentPhone
      })
    }

    console.log('[签到] 响应:', res)

    if (res.code === 200) {
      showSuccessToast('签到成功')
      setTimeout(() => {
        // 跳转到我的报名列表查看状态
        router.push('/activities')
      }, 1500)
    } else {
      showToast(res.message || '签到失败')
    }
  } catch (error) {
    console.error('[签到] 失败:', error)
    showToast('签到失败: ' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.back()
}

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  return timeStr.replace('T', ' ').substring(0, 16)
}
</script>

<style scoped>
.checkin {
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
  padding: 66px 16px 20px;
}

.checkin-card {
  background: white;
  border-radius: 16px;
  padding: 40px 20px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.checkin-card h2 {
  margin: 16px 0 8px;
  font-size: 20px;
  color: #323233;
}

.checkin-card h3 {
  margin: 10px 0;
  font-size: 18px;
  color: #323233;
}

.checkin-card p {
  color: #969799;
  font-size: 14px;
  margin-bottom: 20px;
}

.info-text {
  margin: 5px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}
</style>

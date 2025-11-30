<template>
  <div class="validate-checkin">
    <van-nav-bar title="扫码签到" fixed />

    <div class="content">
      <div v-if="loading" class="loading-container">
        <van-loading size="48" text-size="14px">验证中...</van-loading>
      </div>

      <div v-else-if="validationError" class="error-container">
        <van-empty
          image="error"
          :description="validationError"
        >
          <van-button type="primary" @click="goHome">返回首页</van-button>
        </van-empty>
      </div>

      <div v-else-if="activityInfo" class="checkin-card">
        <!-- 活动信息 -->
        <div class="activity-section">
          <van-icon name="success" size="60" color="#07c160" />
          <h2>验证成功</h2>
          <div class="activity-info">
            <p class="activity-name">{{ activityInfo.activityName }}</p>
            <p class="activity-meta">
              <van-icon name="clock-o" /> {{ formatTime(activityInfo.startTime) }}
            </p>
            <p class="activity-meta">
              <van-icon name="location-o" /> {{ activityInfo.location }}
            </p>
          </div>
        </div>

        <van-divider />

        <!-- 签到表单 -->
        <div class="form-section">
          <h3>请填写手机号完成签到</h3>
          <van-form @submit="handleCheckIn">
            <van-field
              v-model="studentPhone"
              label="手机号"
              placeholder="请输入报名手机号"
              type="tel"
              required
              :rules="[{ required: true, pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }]"
            />
            
            <div style="margin: 16px;">
              <van-button 
                round 
                block 
                type="primary" 
                native-type="submit"
                :loading="submitting"
              >
                立即签到
              </van-button>
            </div>
          </van-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NavBar, Icon, Divider, Form, Field, Button, Empty, Loading, showSuccessToast, showToast } from 'vant'
import { validateCheckInToken, checkInByToken, getActivityDetail } from '@/api/student'

const router = useRouter()
const route = useRoute()

const loading = ref(true)
const submitting = ref(false)
const validationError = ref('')
const activityInfo = ref(null)
const studentPhone = ref('')
const checkInToken = ref('')

onMounted(async () => {
  const token = route.query.token
  
  if (!token) {
    validationError.value = '无效的签到二维码，缺少必要参数'
    loading.value = false
    return
  }

  checkInToken.value = token
  await validateToken(token)
})

const validateToken = async (token) => {
  try {
    const res = await validateCheckInToken(token)
    
    if (res.code === 200) {
      const activityId = res.data.activityId
      await loadActivityInfo(activityId)
      loading.value = false
    } else {
      validationError.value = res.message || '二维码已失效或无效'
      loading.value = false
    }
  } catch (error) {
    validationError.value = '验证失败，请重新扫码'
    loading.value = false
  }
}

const loadActivityInfo = async (activityId) => {
  try {
    const res = await getActivityDetail(activityId)
    if (res.code === 200) {
      activityInfo.value = res.data
    }
  } catch (error) {
    console.error('加载活动信息失败', error)
  }
}

const handleCheckIn = async () => {
  if (!studentPhone.value) {
    showToast('请输入手机号')
    return
  }

  submitting.value = true
  try {
    const res = await checkInByToken({
      checkInToken: checkInToken.value,
      studentPhone: studentPhone.value
    })

    if (res.code === 200) {
      showSuccessToast('签到成功')
      setTimeout(() => {
        router.push('/my-registrations')
      }, 1500)
    } else {
      // 针对不同错误码显示不同提示
      let errorMsg = res.message || '签到失败'
      
      // 判断是否为未报名的情况
      if (errorMsg.includes('报名') || errorMsg.includes('不存在') || res.code === 404) {
        errorMsg = '签到失败，未报名该活动'
      }
      
      showToast(errorMsg)
    }
  } catch (error) {
    let errorMsg = '签到失败'
    
    // 从错误对象中提取消息
    if (error.response && error.response.data && error.response.data.message) {
      errorMsg = error.response.data.message
      
      // 判断是否为未报名的情况
      if (errorMsg.includes('报名') || errorMsg.includes('不存在')) {
        errorMsg = '签到失败，未报名该活动'
      }
    } else if (error.message) {
      errorMsg = '签到失败: ' + error.message
    }
    
    showToast(errorMsg)
  } finally {
    submitting.value = false
  }
}

const goHome = () => {
  router.push('/activities')
}

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  return timeStr.replace('T', ' ').substring(0, 16)
}
</script>

<style scoped>
.validate-checkin {
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
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-container, .error-container {
  text-align: center;
  width: 100%;
}

.checkin-card {
  background: white;
  border-radius: 16px;
  padding: 40px 20px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.activity-section {
  text-align: center;
}

.activity-section h2 {
  margin: 16px 0 8px;
  font-size: 20px;
  color: #323233;
}

.activity-info {
  margin-top: 20px;
  text-align: left;
  background: #f7f8fa;
  padding: 16px;
  border-radius: 8px;
}

.activity-name {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin: 0 0 12px 0;
}

.activity-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #969799;
  font-size: 14px;
  margin: 8px 0;
}

.form-section {
  margin-top: 20px;
}

.form-section h3 {
  font-size: 16px;
  color: #323233;
  margin: 0 0 16px 0;
  text-align: center;
}
</style>

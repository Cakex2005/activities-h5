<template>
  <div class="activity-register">
    <van-nav-bar title="活动报名" left-arrow @click-left="goBack" fixed />

    <div class="content" v-if="activity">
      <!-- 活动海报 -->
      <van-image
        v-if="activity.posterUrl"
        :src="formatImageUrl(activity.posterUrl)"
        fit="cover"
        class="poster"
      />

      <!-- 活动信息卡片 -->
      <div class="info-card">
        <h1 class="activity-title">{{ activity.activityName }}</h1>
        
        <van-cell-group>
          <van-cell title="活动时间" :value="formatTimeRange(activity.startTime, activity.endTime)" icon="clock-o" />
          <van-cell title="活动地点" :value="activity.location" icon="location-o" />
          <van-cell title="报名人数" :value="`${activity.currentRegistrationCount || 0} / ${activity.maxParticipants || '不限'}`" icon="friends-o" />
        </van-cell-group>
      </div>

      <!-- 报名表单 -->
      <div class="register-form-card" v-if="canRegister">
        <h3 class="form-title">报名信息</h3>
        <van-form @submit="handleRegister">
          <van-cell-group>
            <van-field
              v-model="registerForm.studentName"
              name="studentName"
              label="姓名"
              placeholder="请输入您的姓名"
              required
              :rules="[{ required: true, message: '请输入姓名' }]"
            />
            <van-field
              v-model="registerForm.studentPhone"
              name="studentPhone"
              label="手机号"
              placeholder="请输入您的手机号"
              type="tel"
              required
              :rules="[
                { required: true, message: '请输入手机号' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
              ]"
            />
            <van-field
              v-model="registerForm.studentCollege"
              name="studentCollege"
              label="学院"
              placeholder="请输入您的学院"
              required
              :rules="[{ required: true, message: '请输入学院' }]"
            />
          </van-cell-group>

          <div class="submit-section">
            <van-button
              round
              block
              type="primary"
              native-type="submit"
              :loading="submitting"
            >
              {{ submitting ? '提交中...' : '确认报名' }}
            </van-button>
          </div>
        </van-form>
      </div>

      <!-- 不可报名提示 -->
      <div class="register-unavailable-card" v-else>
        <van-empty
          :image="getEmptyImage()"
          :description="getButtonText"
        />
      </div>
    </div>

    <van-loading v-else class="loading" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NavBar, Image as VanImage, CellGroup, Cell, Button, Form, Field, Loading, Empty, showToast, showSuccessToast } from 'vant'
import { getActivityDetail, registerActivity } from '@/api/student'
import { formatImageUrl } from '@/utils/format'

const router = useRouter()
const route = useRoute()

const activity = ref(null)
const submitting = ref(false)
const registerForm = ref({
  studentName: '',
  studentPhone: '',
  studentCollege: ''
})

onMounted(() => {
  loadDetail()
})

// 判断是否可以报名
const canRegister = computed(() => {
  if (!activity.value) return false
  
  // 首先判断活动状态必须是"报名中"
  if (activity.value.activityStatus !== 1) return false
  
  // 然后判断当前时间是否在报名时间范围内
  const now = new Date()
  const regStart = new Date(activity.value.registrationStartTime)
  const regEnd = new Date(activity.value.registrationEndTime)
  
  return now >= regStart && now <= regEnd
})

// 按钮文字
const getButtonText = computed(() => {
  if (!activity.value) return '加载中...'
  
  // 判断活动状态
  if (activity.value.activityStatus !== 1) {
    return getStatusText(activity.value.activityStatus)
  }
  
  // 活动状态是"报名中"，但需要检查时间
  const now = new Date()
  const regStart = new Date(activity.value.registrationStartTime)
  const regEnd = new Date(activity.value.registrationEndTime)
  
  if (now < regStart) {
    return '未到报名时间'
  } else if (now > regEnd) {
    return '报名已结束'
  }
  
  return '确认报名'
})

const loadDetail = async () => {
  try {
    const res = await getActivityDetail(route.params.id)
    if (res.code === 200) {
      activity.value = res.data
    }
  } catch (error) {
    showToast('加载失败')
    setTimeout(() => router.back(), 1500)
  }
}

const handleRegister = async () => {
  if (!registerForm.value.studentName || !registerForm.value.studentPhone || !registerForm.value.studentCollege) {
    showToast('请填写完整信息')
    return
  }

  if (!canRegister.value) {
    showToast(getButtonText.value)
    return
  }

  try {
    submitting.value = true
    const res = await registerActivity({
      activityId: activity.value.id,
      ...registerForm.value
    })
    
    if (res.code === 200) {
      showSuccessToast('报名成功!')
      
      // 显示成功提示后跳转回活动详情页
      setTimeout(() => {
        router.push(`/activity/${activity.value.id}`)
      }, 1500)
    }
  } catch (error) {
    // 错误已在拦截器中处理
  } finally {
    submitting.value = false
  }
}

const goBack = () => {
  router.back()
}

const formatTimeRange = (start, end) => {
  if (!start) return '-'
  const s = start.replace('T', ' ').substring(0, 16)
  if (!end) return s
  const e = end.replace('T', ' ').substring(0, 16)
  return `${s} ~ ${e}`
}

const getStatusText = (status) => {
  const map = {
    0: '未发布',
    2: '报名已结束',
    3: '活动进行中',
    4: '活动已结束',
    5: '活动已取消'
  }
  return map[status] || '不可报名'
}

const getEmptyImage = () => {
  // 返回空状态图标类型
  return 'error'
}
</script>

<style scoped>
.activity-register {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 20px;
}

.content {
  padding-top: 46px;
}

.loading {
  margin-top: 100px;
  text-align: center;
}

.poster {
  width: 100%;
  height: 250px;
}

.info-card {
  padding: 16px 0;
  background: white;
  margin-bottom: 12px;
}

.activity-title {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #323233;
  padding: 0 16px;
  text-align: center;
}

.register-form-card {
  padding: 16px 0;
  background: white;
}

.form-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #323233;
  padding: 0 16px;
  text-align: center;
}

.submit-section {
  margin-top: 24px;
  padding: 0 16px;
}

.register-hint {
  margin-top: 12px;
  text-align: center;
  font-size: 13px;
  color: #969799;
}

.register-unavailable-card {
  padding: 40px 16px;
  text-align: center;
  background: white;
  margin: 16px;
  border-radius: 8px;
}
</style>

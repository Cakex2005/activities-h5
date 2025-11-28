<template>
  <div class="checkin">
    <van-nav-bar title="活动签到" left-arrow @click-left="goBack" fixed />

    <div class="content">
      <div class="checkin-card">
        <van-icon name="success" size="60" color="#07c160" />
        <h2>扫码签到</h2>
        <p>请使用相机扫描签到二维码</p>

        <van-divider>或</van-divider>

        <van-form @submit="handleCheckIn">
          <van-field
            v-model="checkInForm.activityId"
            label="活动ID"
            placeholder="请输入活动ID"
            type="number"
            required
          />
          <van-field
            v-model="checkInForm.studentPhone"
            label="手机号"
            placeholder="请输入报名手机号"
            type="tel"
            required
          />
          
          <div style="margin: 16px;">
            <van-button round block type="primary" native-type="submit">
              立即签到
            </van-button>
          </div>
        </van-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NavBar, Icon, Divider, Form, Field, Button, showSuccessToast, showToast } from 'vant'
import { checkIn } from '@/api/student'

const router = useRouter()
const route = useRoute()

const checkInForm = ref({
  activityId: route.query.activityId || '',
  studentPhone: ''
})

const handleCheckIn = async () => {
  try {
    const res = await checkIn(checkInForm.value)
    
    if (res.code === 200) {
      showSuccessToast('签到成功!')
      setTimeout(() => router.push('/my'), 1500)
    }
  } catch (error) {
    // 错误已在拦截器中处理
  }
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.checkin {
  min-height: 100vh;
  background-color: #f7f8fa;
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

.checkin-card p {
  color: #969799;
  font-size: 14px;
  margin-bottom: 20px;
}
</style>

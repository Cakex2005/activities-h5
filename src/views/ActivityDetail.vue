<template>
  <div class="activity-detail">
    <van-nav-bar title="活动详情" left-arrow @click-left="goBack" fixed />

    <div class="content" v-if="activity">
      <van-image
        v-if="activity.posterUrl"
        :src="activity.posterUrl"
        fit="cover"
        class="poster"
      />

      <div class="info-card">
        <h1 class="title">{{ activity.activityName }}</h1>

        <van-cell-group inset>
          <van-cell title="活动地点" :value="activity.location" icon="location-o" />
          <van-cell title="活动时间" :value="formatTimeRange(activity.startTime, activity.endTime)" icon="clock-o" />
          <van-cell title="报名时间" :value="formatTimeRange(activity.registrationStartTime, activity.registrationEndTime)" icon="underway-o" />
          <van-cell title="报名人数" :value="`${activity.currentRegistrationCount || 0} / ${activity.maxParticipants || '不限'}`" icon="friends-o" />
        </van-cell-group>

        <div class="description">
          <h3>活动简介</h3>
          <p>{{ activity.description || '暂无简介' }}</p>
        </div>
      </div>
    </div>

    <van-loading v-else class="loading" />

    <div class="footer-bar" v-if="activity">
      <!-- 如果从查询报名记录进入且已签到，显示已签到状态 -->
      <van-button 
        v-if="hasRegistered && checkInStatus === 1"
        type="success" 
        block 
        round
        disabled
        class="registered-btn"
      >
        ✓ 已成功签到
      </van-button>

      <!-- 如果从查询报名记录进入且报名成功（未签到），显示已报名状态 -->
      <van-button 
        v-else-if="hasRegistered && registrationStatus === 1"
        type="success" 
        block 
        round
        disabled
        class="registered-btn"
      >
        ✓ 已成功报名
      </van-button>
      
      <!-- 如果已取消报名，显示提示和再次报名按钮 -->
      <template v-else-if="hasRegistered && registrationStatus === 2">
        <div class="cancelled-hint">
          <van-tag type="default">已取消报名</van-tag>
        </div>
        <van-button 
          v-if="canRegister"
          type="primary" 
          block 
          round
          @click="showRegisterDialog"
        >
          再次报名
        </van-button>
        <van-button 
          v-else
          type="default" 
          block 
          round
          disabled
          class="disabled-btn"
        >
          {{ getButtonText }}
        </van-button>
      </template>
      
      <!-- 正常报名流程 -->
      <van-button 
        v-else-if="canRegister" 
        type="primary" 
        block 
        round
        @click="showRegisterDialog"
      >
        立即报名
      </van-button>
      
      <van-button 
        v-else 
        type="default" 
        block 
        round 
        disabled
        class="disabled-btn"
      >
        {{ getButtonText }}
      </van-button>
    </div>

    <!-- 报名弹窗 -->
    <van-dialog v-model:show="registerVisible" title="填写报名信息" show-cancel-button @confirm="handleRegister">
      <van-cell-group inset>
        <van-field v-model="registerForm.studentName" label="姓名" placeholder="请输入姓名" required />
        <van-field v-model="registerForm.studentPhone" label="手机号" placeholder="请输入手机号" required />
        <van-field v-model="registerForm.studentCollege" label="学院" placeholder="请输入学院" required />
      </van-cell-group>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NavBar, Image as VanImage, CellGroup, Cell, Button, Dialog, Field, Loading, showToast, showSuccessToast, Tag } from 'vant'
import { getActivityDetail, registerActivity } from '@/api/student'

const router = useRouter()
const route = useRoute()

const activity = ref(null)
const registerVisible = ref(false)
const registerForm = ref({
  studentName: '',
  studentPhone: '',
  studentCollege: ''
})

// 检查是否从查询报名记录进入（通过URL参数判断）
const hasRegistered = computed(() => {
  return route.query.registrationId !== undefined
})

const registrationStatus = computed(() => {
  const status = route.query.registrationStatus
  return status !== undefined && status !== null ? Number(status) : null
})

const checkInStatus = computed(() => {
  const status = route.query.checkInStatus
  return status !== undefined && status !== null ? Number(status) : null
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
  
  return '立即报名'
})

const loadDetail = async () => {
  try {
    const res = await getActivityDetail(route.params.id)
    if (res.code === 200) {
      activity.value = res.data
    }
  } catch (error) {
    showToast('加载失败')
  }
}

const showRegisterDialog = () => {
  registerVisible.value = true
}

const handleRegister = async () => {
  if (!registerForm.value.studentName || !registerForm.value.studentPhone || !registerForm.value.studentCollege) {
    showToast('请填写必填信息')
    return
  }

  try {
    const res = await registerActivity({
      activityId: activity.value.id,
      ...registerForm.value
    })
    
    if (res.code === 200) {
      showSuccessToast('报名成功!')
      registerVisible.value = false
      
      // 如果是从查询报名记录进入的，更新当前URL参数状态为已报名
      if (hasRegistered.value) {
        router.replace({
          query: {
            ...route.query,
            registrationStatus: 1
          }
        })
      } else {
        // 否则跳转回活动列表
        setTimeout(() => router.push('/activities'), 1500)
      }
    }
  } catch (error) {
    // 错误已在拦截器中处理
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
</script>

<style scoped>
.activity-detail {
  height: 100vh;
  width: 100vw;
  background-color: #f7f8fa;
  padding-bottom: 70px;
  position: fixed;
  top: 0;
  left: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.content {
  padding-top: 46px;
}

.poster {
  width: 100%;
  height: 250px;
}

.loading {
  margin-top: 100px;
  text-align: center;
}

.info-card {
  padding: 16px;
}

.title {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #323233;
}

.description {
  margin-top: 16px;
  padding: 16px;
  background: white;
  border-radius: 8px;
}

.description h3 {
  font-size: 16px;
  margin-bottom: 12px;
  color: #323233;
}

.description p {
  font-size: 14px;
  line-height: 1.6;
  color: #646566;
  white-space: pre-wrap;
}

.footer-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 12px 16px;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.08);
}

.cancelled-hint {
  text-align: center;
  margin-bottom: 8px;
  color: #999;
  font-size: 14px;
}

.disabled-btn {
  background-color: #f7f8fa !important;
  color: #c8c9cc !important;
  cursor: not-allowed !important;
}

.registered-btn {
  background-color: #e8f4e8 !important;
  color: #07c160 !important;
  cursor: not-allowed !important;
  border: 1px solid #07c160 !important;
}

</style>

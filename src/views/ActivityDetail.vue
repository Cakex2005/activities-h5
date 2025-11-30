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
          <p>{{ activity.activityDescription || '暂无简介' }}</p>
        </div>

        <!-- 报名二维码 -->
        <div class="qrcode-section">
          <h3>扫码报名</h3>
          <div class="qrcode-container">
            <qrcode-vue 
              :value="registrationUrl" 
              :size="200" 
              level="H"
              render-as="canvas"
            />
          </div>
          <p class="qrcode-hint">使用微信扫描上方二维码进行活动报名</p>
        </div>
      </div>
    </div>

    <van-loading v-else class="loading" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NavBar, Image as VanImage, CellGroup, Cell, Loading, showToast } from 'vant'
import QrcodeVue from 'qrcode-vue3'
import { getActivityDetail } from '@/api/student'

const router = useRouter()
const route = useRoute()

const activity = ref(null)

// 生成报名页面的二维码URL
const registrationUrl = computed(() => {
  if (!activity.value) return ''
  const origin = window.location.origin
  return `${origin}/activity/${activity.value.id}/register`
})

onMounted(() => {
  loadDetail()
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
</script>

<style scoped>
.activity-detail {
  height: 100vh;
  width: 100vw;
  background-color: #f7f8fa;
  padding-bottom: 20px;
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
  text-align: center;
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
  text-align: center;
}

.description p {
  font-size: 14px;
  line-height: 1.6;
  color: #646566;
  white-space: pre-wrap;
}

.qrcode-section {
  margin-top: 16px;
  padding: 24px 16px;
  background: white;
  border-radius: 8px;
  text-align: center;
}

.qrcode-section h3 {
  font-size: 16px;
  margin-bottom: 20px;
  color: #323233;
  font-weight: 600;
}

.qrcode-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: #fff;
  border: 2px dashed #e5e5e5;
  border-radius: 8px;
  margin-bottom: 12px;
}

.qrcode-hint {
  font-size: 13px;
  color: #969799;
  margin: 0;
}
</style>

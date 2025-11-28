<template>
  <div class="activity-list">
    <van-nav-bar title="校园活动" fixed>
      <template #right>
        <span style="color: #1989fa; font-size: 14px;" @click="goToQuery">查询报名</span>
      </template>
    </van-nav-bar>

    <div class="content">
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <van-list
          v-model:loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          @load="onLoad"
        >
          <van-empty v-if="!loading && activities.length === 0" description="暂无活动" />
          
          <div v-for="activity in activities" :key="activity.id" class="activity-card" @click="goToDetail(activity.id)">
            <van-image
              v-if="activity.posterUrl"
              :src="activity.posterUrl"
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
              <h3 class="title">{{ activity.activityName }}</h3>
              
              <div class="info-row">
                <van-icon name="location-o" />
                <span>{{ activity.location }}</span>
              </div>

              <div class="info-row">
                <van-icon name="clock-o" />
                <span>{{ formatTime(activity.startTime) }}</span>
              </div>

              <div class="footer">
                <van-tag v-if="activity.activityStatus === 1" type="success">报名中</van-tag>
                <van-tag v-else-if="activity.activityStatus === 2" type="warning">报名结束</van-tag>
                <van-tag v-else-if="activity.activityStatus === 3" type="primary">进行中</van-tag>
                <van-tag v-else type="default">已结束</van-tag>

                <span class="count">{{ activity.currentRegistrationCount || 0 }} / {{ activity.maxParticipants || '不限' }}</span>
              </div>
            </div>
          </div>
        </van-list>
      </van-pull-refresh>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { NavBar, Icon, PullRefresh, List, Empty, Image as VanImage, Tag, showToast } from 'vant'
import { getPublicActivities } from '@/api/student'

const router = useRouter()

const activities = ref([])
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const pageNum = ref(1)
const pageSize = 10

const onLoad = async () => {
  try {
    const res = await getPublicActivities({
      pageNum: pageNum.value,
      pageSize,
      activityStatus: 1 // 只显示报名中的活动
    })
    
    if (res.code === 200) {
      const newData = res.data.list || []
      if (pageNum.value === 1) {
        activities.value = newData
      } else {
        activities.value.push(...newData)
      }
      
      loading.value = false
      if (newData.length < pageSize) {
        finished.value = true
      } else {
        pageNum.value++
      }
    }
  } catch (error) {
    loading.value = false
    showToast('加载失败')
  }
}

const onRefresh = async () => {
  pageNum.value = 1
  finished.value = false
  activities.value = []
  refreshing.value = false
  await onLoad()
}

const goToDetail = (id) => {
  router.push(`/activity/${id}`)
}

const goToQuery = () => {
  router.push('/query')
}

const formatTime = (time) => {
  if (!time) return ''
  return time.replace('T', ' ').substring(0, 16)
}
</script>

<style scoped>
.activity-list {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.content {
  padding-top: 46px;
  padding-bottom: 20px;
}

.activity-card {
  margin: 12px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.poster {
  width: 100%;
  height: 200px;
}

.image-placeholder {
  width: 100%;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  color: #aaa;
}

.card-content {
  padding: 16px;
}

.title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #323233;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 14px;
  color: #646566;
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #eee;
}

.count {
  font-size: 14px;
  color: #969799;
}
</style>

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
          
          <div class="grid-container">
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
const pageSize = 10 // 每页10个，配合每行2个，刚好5行

const onLoad = async () => {
  try {
    // 同时加载报名中、进行中和报名结束的活动
    const [res1, res3, res2] = await Promise.all([
      getPublicActivities({
        pageNum: pageNum.value,
        pageSize,
        activityStatus: 1 // 报名中的活动
      }),
      getPublicActivities({
        pageNum: pageNum.value,
        pageSize,
        activityStatus: 3 // 进行中的活动
      }),
      getPublicActivities({
        pageNum: pageNum.value,
        pageSize,
        activityStatus: 2 // 报名结束的活动
      })
    ])
    
    let newData = []
    if (res1.code === 200) {
      newData = newData.concat(res1.data.list || [])
    }
    if (res3.code === 200) {
      newData = newData.concat(res3.data.list || [])
    }
    if (res2.code === 200) {
      newData = newData.concat(res2.data.list || [])
    }
    
    // 排序逻辑：进行中(3) > 报名中(1) > 报名结束(2)，内部按开始时间倒序
    const statusOrder = { 3: 0, 1: 1, 2: 2 }
    
    newData.sort((a, b) => {
      const orderA = statusOrder[a.activityStatus] ?? 99
      const orderB = statusOrder[b.activityStatus] ?? 99
      
      if (orderA !== orderB) {
        return orderA - orderB // 升序排列：0(进行中) -> 1(报名中) -> 2(报名结束)
      }
      return new Date(b.startTime) - new Date(a.startTime)
    })
    
    if (pageNum.value === 1) {
      activities.value = newData
    } else {
      activities.value.push(...newData)
    }
    
    loading.value = false
    // 如果所有状态的数据都少于pageSize，说明没有更多了
    // 注意：这种分页方式在数据量大时会有问题（重复加载），但在当前需求下是可接受的妥协
    const hasMore = (res1.data?.list?.length || 0) >= pageSize || 
                    (res3.data?.list?.length || 0) >= pageSize ||
                    (res2.data?.list?.length || 0) >= pageSize
    if (!hasMore) {
      finished.value = true
    } else {
      pageNum.value++
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

/* 网格布局容器 */
.grid-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* 每行2个 */
  gap: 12px;
  padding: 12px;
}

.activity-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
}

.poster {
  width: 100%;
  height: 120px; /* 适中高度 */
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

.title {
  font-size: 15px; /* 适中字号 */
  font-weight: 600;
  margin-bottom: 8px;
  color: #323233;
  /* 限制标题行数 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2; /* 标准属性 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
  height: 42px; /* 固定高度 */
}

.info-row {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 6px;
  font-size: 12px; /* 适中字号 */
  color: #666;
}

.info-row span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto; /* 推到底部 */
  padding-top: 8px;
  border-top: 1px solid #f5f5f5;
}

.count {
  font-size: 11px;
  color: #999;
}

/* 调整标签大小 */
:deep(.van-tag) {
  padding: 0 4px;
  font-size: 10px;
  height: 18px;
  line-height: 16px;
}
</style>

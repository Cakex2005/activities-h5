import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            redirect: '/activities'
        },
        {
            path: '/activities',
            name: 'activities',
            component: () => import('@/views/ActivityList.vue'),
            meta: { title: '活动列表' }
        },
        {
            path: '/activity/:id',
            name: 'activity-detail',
            component: () => import('@/views/ActivityDetail.vue'),
            meta: { title: '活动详情' }
        },
        {
            path: '/query',
            name: 'query',
            component: () => import('@/views/QueryRegistration.vue'),
            meta: { title: '查询报名' }
        },
        {
            path: '/checkin',
            name: 'checkin',
            component: () => import('@/views/CheckIn.vue'),
            meta: { title: '签到' }
        }
    ]
})

router.beforeEach((to, from, next) => {
    document.title = to.meta.title || '学生活动'
    next()
})

export default router

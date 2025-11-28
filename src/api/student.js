import request from '@/utils/request'

/**
 * 获取公开活动列表
 */
export function getPublicActivities(params) {
    return request({
        url: '/public/activities',
        method: 'get',
        params
    })
}

/**
 * 获取活动详情
 */
export function getActivityDetail(activityId) {
    return request({
        url: `/public/activities/${activityId}`,
        method: 'get'
    })
}

/**
 * 学生报名活动
 */
export function registerActivity(data) {
    return request({
        url: '/registration/register',
        method: 'post',
        data
    })
}

/**
 * 学生签到
 */
export function checkIn(data) {
    return request({
        url: '/registration/checkin',
        method: 'post',
        data
    })
}

/**
 * 获取我的报名列表
 * 注意: 使用通用查询接口,通过手机号筛选
 */
export function getMyRegistrations(params) {
    return request({
        url: '/registration/list',
        method: 'get',
        params
    })
}

/**
 * 根据姓名和手机号查询报名记录
 */
export function getStudentRegistrationRecords(params) {
    return request({
        url: '/registration/student',
        method: 'get',
        params
    })
}

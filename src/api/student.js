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
 * 取消报名
 */
export function cancelRegistration(registrationId) {
    return request({
        url: `/registration/cancel/${registrationId}`,
        method: 'post'
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

/**
 * 验证签到Token
 */
export function validateCheckInToken(token) {
    return request({
        url: '/h5/checkin/validate',
        method: 'get',
        params: { token }
    })
}

/**
 * 扫码签到 (通过Token)
 */
export function checkInByToken(data) {
    return request({
        url: '/h5/checkin',
        method: 'post',
        data
    })
}

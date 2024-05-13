import request from '@/utils/request'

/**
 * draw刷新寄存器
 * @author Yuxianhao <yu.xh00@foxmail.com>
 * @date 2024-05-13
 * @param {any} data
 * @returns {any}
 */
export function refreshDrawReg(data) {
  return request({
    host: true,
    url: '/remote/reg/refresh_reg',
    method: 'post',
    headers: {
      'Carry-Token': false
    },
    data
  })
}

/**
 * draw刷新寄存器
 * @author Yuxianhao <yu.xh00@foxmail.com>
 * @date 2024-05-13
 * @param {any} data
 * @returns {any}
 */
export function getDrawCache(data) {
  return request({
    host: true,
    url: '/remote/reg/get_reg_cache',
    method: 'post',
    headers: {
      'Carry-Token': false
    },
    data
  })
}

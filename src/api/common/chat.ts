import request from '@/utils/request'

export function getChatContent(params) {
  return request({
    host: true,
    url: '/knowledge/knowledge_info/chat',
    method: 'post',
    headers: {
      'Carry-Token': false
    },
    params
  })
}

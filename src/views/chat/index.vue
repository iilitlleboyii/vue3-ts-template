<template>
  <div ref="chatPageRef" class="chat-page">
    <div ref="chatRef" class="response-container">
      <div v-for="chat in chatMsgs" v-html="chat.message" :class="['chat-msg', chat.source]"></div>
    </div>
    <div ref="placeholderDivRef" style="width: 100%; background-color: transparent"></div>
    <div class="question-container">
      <el-input
        v-model="question"
        :autosize="{ minRows: 2, maxRows: 6 }"
        autofocus
        type="textarea"
        placeholder="输入内容开始聊天"
      ></el-input>
      <el-button type="primary" @click="submit" :icon="Position" :loading="loading">发送</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, watch, onMounted, onBeforeUnmount } from 'vue'
import MarkdownIt from 'markdown-it'
import { Position } from '@element-plus/icons-vue'

const md = MarkdownIt()

const loading = ref(false)

const question = ref('')

const chatRef = ref(null)
const chatMsgs = ref([
  {
    source: 'server',
    message: '输入内容开始聊天'
  }
])

const placeholderDivRef = ref(null)

async function updatePageScrollTop() {
  if (!chatRef.value || !placeholderDivRef.value) return
  await nextTick()
  chatRef.value.scrollTop = chatRef.value.scrollHeight
  placeholderDivRef.value.style.height = `${chatRef.value.style.height + 64}px`
}

const chatPageRef = ref(null)
const resizeObserver = new ResizeObserver((entries) => {
  updatePageScrollTop()
})

watch(chatMsgs.value, () => {
  updatePageScrollTop()
})

onMounted(() => {
  resizeObserver.observe(chatPageRef.value)
})

onBeforeUnmount(() => {
  resizeObserver.unobserve(chatPageRef.value)
})

async function submit() {
  if (!question.value) return
  try {
    loading.value = true
    chatMsgs.value.push({
      source: 'client',
      message: question.value
    })
    question.value = ''
    const response = await fetch(
      `http://172.16.30.32:5173/yxh-api/knowledge/knowledge_info/chat?question=${question.value}`,
      {
        method: 'POST',
        timeout: 10000
      }
    )
    if (!response.ok) throw new Error('Network response was not OK')
    if (!response.body) return
    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      chatMsgs.value.push({
        source: 'server',
        message: md.render(JSON.parse(value).msg)
      })
      loading.value = false
    }
  } catch (error) {
    loading.value = false
    console.error(error)
  }
}
</script>

<style scoped lang="scss">
.chat-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
  padding: 16px;
  background-color: #293266;
}

.response-container {
  width: 100%;
  height: 100%;
  overflow: auto;
  scrollbar-width: thin;
  display: flex;
  flex-direction: column;

  .chat-msg {
    max-width: 80vw;
    padding: 10px 12px;
    border-radius: 6px;
    overflow-wrap: break-word;
    margin-bottom: 24px;
    box-shadow: inset 0 0 0 1px #ffffff0d;

    &.client {
      margin-left: auto;
      background-color: #3a4684;
      color: white;
      border-top-right-radius: 0;
    }

    &.server {
      margin-right: auto;
      background-color: white;
      border-top-left-radius: 0;
    }
  }
}

.question-container {
  width: calc(100% - 32px);
  padding: 12px 12px 10px;
  display: flex;
  align-items: center;
  gap: 20px;
  border-radius: 8px;
  background-color: #3a4684;
  box-shadow: inset 0 0 0 1px #ffffff0d;
  position: fixed;
  z-index: 1;
  left: 16px;
  right: 16px;
  bottom: 16px;
}

:deep(.el-textarea__inner) {
  padding: 0;
  caret-shape: block;
  caret-color: white;
  color: white;
  resize: none;
  scrollbar-width: thin;
  box-shadow: none;
  background-color: transparent;
}
</style>

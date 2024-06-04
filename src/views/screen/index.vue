<template>
  <div class="app-container">
    <div>
      <div :class="['controller', horizontal ? 'horizontal' : '']">
        <div style="flex-shrink: 0">
          <el-button
            @click="onPrevPage"
            :disabled="isDebug || pages.length <= 0 || pageIdx === 0"
            circle
            text
            title="上一页"
          >
            <template #default>
              <i-ep:back font-size="4" />
            </template>
          </el-button>
          <el-button
            @click="onNextPage"
            :disabled="isDebug || pages.length <= 0 || pageIdx === pages.length - 1"
            circle
            text
            title="下一页"
          >
            <template #default>
              <i-ep:right font-size="4" />
            </template>
          </el-button>
          <el-button circle text @click="onRefreshCache" :disabled="isDebug" title="刷新">
            <template #default>
              <i-ep:refresh font-size="4" />
            </template>
          </el-button>
          <el-button circle text @click="onResetPage" :disabled="isDebug" title="首页">
            <template #default>
              <i-ep:house font-size="4" />
            </template>
          </el-button>
        </div>
        <el-divider direction="vertical" border-style="dashed" />
        <el-select v-model="pageIdx" placeholder="请选择页面" :filterable="true" :disabled="isDebug" style="flex: 1">
          <el-option v-for="(item, index) in pages" :key="index" :label="item.name" :value="index" />
        </el-select>
        <el-divider direction="vertical" border-style="dashed" />
        <div style="flex-shrink: 0">
          <el-switch v-model="isDebug" @change="onChangeDebug">
            <template #active-action>
              <i-ep:setting font-size="3" />
            </template>
            <template #inactive-action>
              <i-ep:setting font-size="3" />
            </template>
          </el-switch>
          <el-button @click="onCopy" text :disabled="!isDebug" style="margin-left: 6px; width: 75px">{{
            reg
          }}</el-button>
        </div>
      </div>
      <div v-if="false">
        <el-form-item label="选择层级">
          <el-select
            v-model="layerIdx"
            placeholder="请选择层级"
            :filterable="true"
            :disabled="(pages[pageIdx]?.layer || []).length === 0"
            style="width: 240px"
          >
            <el-option
              v-for="(item, index) in pages[pageIdx]?.layer || []"
              :key="index"
              :label="index"
              :value="index"
            />
          </el-select>
        </el-form-item>
      </div>
    </div>
    <div v-loading="loading" :class="['draw', horizontal ? 'horizontal' : '']">
      <Draw-Container v-model:dynamicData="dynamicData" :staticData="staticData" :debug="isDebug"></Draw-Container>
    </div>
  </div>
</template>

<script setup name="Screen">
import { refreshDrawReg, getDrawCache } from '@/api/common'
import { useClipboard } from '@vueuse/core'

const loading = ref(true)

const rawData = shallowRef([])

const pageSelector = reactive({
  pageIdx: 0,
  layerIdx: 0,
  pages: []
})
const { pageIdx, layerIdx, pages } = toRefs(pageSelector)

const staticData = shallowRef([])
const dynamicData = ref([])

const payload = ref(null)

watch(
  [pages, pageIdx, layerIdx],
  () => {
    if (pages.value.length > 0 && pageIdx.value >= 0) {
      const current = pages.value[pageIdx.value]
      const common = current.common
      const layer = current?.layer[layerIdx.value]
      const result = layer ? [...common, ...layer] : common
      const formatted = formatPageData(result)
      const [staticDataItems, dynamicDataItems] = formatted.reduce(
        ([staticData, dynamicData], item) => {
          return ['input', 'select', 'switch'].includes(item.type)
            ? [staticData, [...dynamicData, item]]
            : [[...staticData, item], dynamicData]
        },
        [[], []]
      )
      staticData.value = staticDataItems
      dynamicData.value = dynamicDataItems
      getRegData()
    }
  },
  {
    immediate: true
  }
)

function onPrevPage() {
  if (pageIdx.value > 0) {
    pageIdx.value -= 1
  } else {
    ElMessage.warning('已经是第一页了~')
  }
}
function onNextPage() {
  if (pageIdx.value < pages.value.length - 1) {
    pageIdx.value += 1
  } else {
    ElMessage.warning('已经是最后一页了~')
  }
}
function onResetPage() {
  pageIdx.value = 0
}

function getRegData() {
  return new Promise((resolve, reject) => {
    loading.value = true
    payload.value = {
      sn: '229c5fb163bad606', //主机编码
      regList: Array.from(new Set(dynamicData.value.map((item) => item.reg))) //寄存器列表
    }
    getDrawCache(payload.value)
      .then((res) => {
        dynamicData.value = dynamicData.value.map((item) => {
          // ! toSpliced 兼容性
          let value = res.data[item.reg]
          if (item.type === 'input' && item.showFormatVal) {
            if (item.showFormatVal != '0') {
              const formatVal = value
                .split('')
                .toSpliced(item.showFormatVal * -1, 0, '.')
                .join('')
              value = formatVal.startsWith('.') ? '0' + formatVal : formatVal
            }
          }
          if (item.type === 'select' && item.reg === 'I1375') {
            item.options = [
              {
                label: '选项0',
                value: '0'
              },
              {
                label: '选项1',
                value: '1'
              },
              {
                label: '选项2',
                value: '2'
              }
            ]
            value = item.options[0].value
          }
          return {
            ...item,
            value: value || '-'
          }
        })
        loading.value = false
        resolve()
      })
      .catch(() => {
        loading.value = false
        reject()
      })
  })
}

function onRefreshCache() {
  refreshDrawReg(payload.value)
    .then(getRegData)
    .then(() => {
      ElMessage.success('刷新成功')
    })
    .catch(() => {})
}

function formatPageData(data) {
  return data
    .map((item) => {
      const ret = {
        id: item.id,
        type: item.type,
        value: item.value,
        style: {
          position: 'absolute',
          top: item.top,
          left: item.left,
          width: item.width,
          height: item.height
        }
      }
      if (item.type === 'input') {
        ret.reg = item.reg
        ret.bitWidth = item.bitWidth
        ret.showFormatVal = item.showFormatVal
      } else if (item.type === 'select') {
        ret.reg = item.reg
        ret.bitWidth = item.bitWidth
        ret.options = item.selectList
      } else if (item.type === 'switch') {
        ret.reg = item.reg
        ret.bitWidth = item.bitWidth
        ret.bitNum = item.bitNum
        ret.open = item.open
        ret.close = item.close
        ret.openColor = item.openColor
        ret.closeColor = item.closeColor
        ret.openWord = item.openWord
        ret.closeWord = item.closeWord
      }
      return ret
    })
    .reduce((acc, cur) => {
      if (!acc.some((obj) => obj.id === cur.id)) {
        acc.push(cur)
      }
      return acc
    }, [])
}

const horizontal = ref(false)

const isDebug = ref(false)

const reg = ref('寄存器')
const { copy, copied, isSupported } = useClipboard({
  legacy: true
})
function onCopy() {
  if (!isSupported.value) return ElMessage.warning('当前浏览器环境不支持复制！')
  if (copied.value) return
  copy(reg.value)
  ElMessage.success('复制成功')
}

const debugHandler = (event) => {
  const target = event.target
  if (target.closest('.controller')) return
  const parentElement = target.closest('.debug-ele')
  reg.value = parentElement ? parentElement.getAttribute('data-reg') : '寄存器'
}

function onChangeDebug(val) {
  // 使用mousedown兼容select组件
  if (val) {
    document.addEventListener('mousedown', debugHandler)
  } else {
    document.removeEventListener('mousedown', debugHandler)
    reg.value = '寄存器'
  }
}

function getAllReg() {
  let resArr = []
  for (const current of pages.value) {
    const common = current.common
    const layer = current?.layer[0]
    const result = layer ? [...common, ...layer] : common
    const formatted = formatPageData(result)
    const dynamicData = formatted.filter((item) => ['input', 'select', 'switch'].includes(item.type))
    resArr = resArr.concat(dynamicData.map((item) => item.reg))
  }
  resArr = Array.from(new Set(resArr))
  console.log('@resArr 🚀🚀🚀~ ', resArr)
}

fetch(new URL('@/assets/json/draw-bole.json', import.meta.url).href)
  .then((res) => res.json())
  .then((data) => {
    loading.value = false
    rawData.value = data
    pages.value = Object.entries(data)
      .filter(([key, value]) => {
        return !['title', 'menu', 'button', 'aside'].includes(key)
      })
      .map((item) => item[1])

    getAllReg()

    // 待删除
    horizontal.value = Object.entries(data)
      .filter(([key, value]) => {
        return !['title', 'menu', 'button', 'aside'].includes(key)
      })
      .map((item) => item[1].common)
      .flat()
      .some((item) => item.width.slice(0, -2) > 768)
  })
</script>

<style lang="scss" scoped>
.draw {
  width: 768px;
  height: 1024px;
  background-color: #f9f9f9;
  box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;
  border-radius: 4px;
  scale: 0.75;
  transform-origin: top left;

  &.horizontal {
    width: 1024px;
    height: 768px;
  }
}

.controller {
  display: flex;
  align-items: center;
  width: calc(768px * 0.75);
  margin-bottom: 16px;

  :deep(.el-select__wrapper) {
    border-radius: 9999px;
  }

  &.horizontal {
    width: calc(1024px * 0.75);
  }
}
</style>

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
      // getRegData()
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
    let regList = Array.from(new Set(dynamicData.value.map((item) => item.reg)))
    let tempRegList = Array.from(
      new Set(
        dynamicData.value
          .filter((item) => item.bitWidth === '32' && !item.reg?.startsWith('D'))
          .map((item) => incrementString(item.reg))
      )
    )
    let tempRegList2 = Array.from(
      new Set(dynamicData.value.filter((item) => item.showFormatReg).map((item) => item.showFormatReg))
    )
    payload.value = {
      sn: '229c5fb163bad606', //主机编码
      equipmentCode: 61961617, //设备编码
      regList: regList.concat(tempRegList, tempRegList2) //寄存器列表
    }
    getDrawCache(payload.value)
      .then((res) => {
        dynamicData.value = dynamicData.value.map((item) => {
          // ! toSpliced 兼容性
          let value = res.data.reg[item.reg]
          if (item.type === 'input' && item.bitWidth === '32' && !item.reg?.startsWith('D')) {
            value = parseInt(value) + parseInt(res.data.reg[incrementString(item.reg)] << 16) + ''
          }
          if (item.type === 'input' && item.showFormatVal) {
            if (item.showFormatVal != '0') {
              value = addDecimalPoint(value, item.showFormatVal)
            }
          }
          if (item.type === 'select' && item.reg === 'I1375') {
            if (Array.isArray(res.data.realTimeAlarmList) && res.data.realTimeAlarmList.length > 0) {
              item.options = res.data.realTimeAlarmList
              value = res.data.realTimeAlarmList[0].value
            }
          }
          if (item.type === 'input' && item.showFormatReg) {
            let bitNum = res.data.reg[item.showFormatReg]
            switch (bitNum) {
              case '0':
                value = parseInt(value, 10)
                break
              case '1':
                value = parseInt(value, 16)
                break
              case '2':
              case '3':
              case '4':
              case '5':
              case '6':
              case '7':
              case '8':
                value = parseInt(value, 10)
                value = addDecimalPoint(value, bitNum * 1 - 1)
                break
              case '100':
                value = parseInt(value, 10)
                break
              case '101':
              case '102':
              case '103':
              case '104':
              case '105':
              case '106':
              case '107':
                value = parseInt(value, 10)
                value = addDecimalPoint(value, bitNum * 1 - 100)
                break
              default:
                break
            }
          }
          return {
            ...item,
            value: value || '-'
          }
        })
        loading.value = false
        resolve()
      })
      .catch((err) => {
        console.log('error', err)
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
        ret.openPicture = item.openPicture
        ret.closePicture = item.closePicture
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

/**
 * 32位宽寄存器标识加1
 * @param {string} inputStr
 * @returns {string}
 * @example
 * // returns 'R1235'
 * incrementString('R1234')
 */
function incrementString(inputStr) {
  const matches = inputStr.match(/(\D+)(\d*)/)
  if (!matches) {
    return inputStr
  }

  const prefix = matches[1]
  const numberStr = matches[2]
  const number = numberStr === '' ? 0 : parseInt(numberStr)
  const newNumber = (number + 1).toString()

  return prefix + newNumber.padStart(numberStr.length, '0')
}

function addDecimalPoint(origin, decimal) {
  const formatVal = origin
    .split('')
    .toSpliced(decimal * -1, 0, '.')
    .join('')
  return formatVal.startsWith('.') ? '0' + formatVal : formatVal
}
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

<template>
  <div class="app-container">
    <div style="float: right">
      <div>
        <el-button-group>
          <el-button type="primary" plain @click="onPrevPage">上一页</el-button>
          <el-button type="primary" plain @click="onNextPage">下一页</el-button>
        </el-button-group>
        <el-select
          v-model="pageIdx"
          placeholder="请选择页面"
          :filterable="true"
          @change="onChangePage"
          style="width: 240px"
        >
          <el-option
            v-for="(item, index) in pages"
            :key="index"
            :label="item.name"
            :value="index"
          />
        </el-select>
      </div>
      <div class="flex">
        <el-button type="danger" plain @click="onRefreshCache">刷新</el-button>
        <el-form-item label="选择层级">
          <el-select
            v-model="layerIdx"
            placeholder="请选择层级"
            :filterable="true"
            :disabled="(pages[pageIdx]?.layer || []).length === 0"
            @change="onChangeLayer"
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
      <Draw-Container
        v-model:dynamicData="dynamicData"
        :staticData="staticData"
        @update:dynamicData="onEmit"
      ></Draw-Container>
    </div>
  </div>
</template>

<script setup name="Screen">
import { refreshDrawReg, getDrawCache } from '@/api/common'

const loading = ref(true)

const horizontal = ref(true)

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
      console.log('@dynamicData.value 🚀🚀🚀~ ', dynamicData.value)
      getRegData()
    }
  },
  {
    immediate: true
  }
)

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
      })
  })
}

function onRefreshCache() {
  refreshDrawReg(payload.value).then(() => {
    getRegData().then(ElMessage.success('刷新成功'))
  })
}

function getAllReg() {
  let resArr = []
  for (const current of pages.value) {
    const common = current.common
    const layer = current?.layer[0]
    const result = layer ? [...common, ...layer] : common
    const formatted = formatPageData(result)
    const dynamicData = formatted.filter((item) =>
      ['input', 'select', 'switch'].includes(item.type)
    )
    resArr = resArr.concat(dynamicData.map((item) => item.reg))
  }
  resArr = Array.from(new Set(resArr))
  console.log('@resArr 🚀🚀🚀~ ', resArr)
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

function onChangePage(value) {
  console.log('当前页面：', value)
}

function onChangeLayer(value) {
  console.log('当前层级：', value)
}

function onEmit(value) {
  console.log(value)
}
</script>

<style lang="scss" scoped>
.draw {
  width: 768px;
  height: 1024px;
  background-color: #f9f9f9;
  box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;
  border-radius: 4px;
  scale: 0.8;
  transform-origin: top left;

  &.horizontal {
    width: 1024px;
    height: 768px;
  }
}
</style>

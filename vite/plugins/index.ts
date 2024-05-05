import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import VueSetupExtend from 'vite-plugin-vue-setup-extend'

import createCompression from './compression'
import createAutoImport from './auto-import'
import createSvgIcon from './svg-icon'

import { visualizer } from 'rollup-plugin-visualizer'

export default function createVitePlugins() {
  return [
    vue(),
    UnoCSS(),
    VueSetupExtend(),
    ...createAutoImport(),
    ...createCompression(),
    createSvgIcon(),
    visualizer({
      gzipSize: true,
      brotliSize: true,
      emitFile: false,
      filename: 'stats.html',
      open: true
    })
  ]
}

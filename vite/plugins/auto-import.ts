import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import AutoImport from 'unplugin-auto-import/vite'

export default function createAutoImport() {
  return [
    Icons({
      autoInstall: true
    }),
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia', 'vue-i18n'],
      dts: 'types/auto-import.d.ts',
      resolvers: [
        ElementPlusResolver({
          importStyle: 'sass'
        }),
        IconsResolver({
          prefix: 'Icon'
        })
      ]
    }),
    Components({
      dirs: ['src/components'],
      extensions: ['vue'],
      dts: 'types/components.d.ts',
      resolvers: [
        ElementPlusResolver({
          importStyle: 'sass'
        }),
        IconsResolver({
          enabledCollections: [
            'ep',
            'icon-park-outline',
            'material-symbols-light',
            'ion',
            'material-symbols',
            'line-md',
            'flagpack',
            'healthicons',
            'lucide'
          ]
        })
      ],
      include: [/\.vue$/, /\.vue\?vue/],
      exclude: [/[\\/]node_modules[\\/]/, /[\\/]\.git[\\/]/, /[\\/]\.nuxt[\\/]/]
    })
  ]
}

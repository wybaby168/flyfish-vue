<template>
  <network-select
    :load-data="loadData"
    :placeholder="placeholder"
    :alias="['value', 'text']"
    :value="value"
    @change="value => $emit('change', value)"
  />
</template>

<script>
import NetworkSelect from '@/components/auto/components/NetworkSelect'
import { getAction } from '@/api/manage'

/**
 * 字典选择器
 */
export default {
  name: 'DictSelect',
  components: { NetworkSelect },
  props: {
    code: {
      type: String,
      name: '类型编码'
    },
    placeholder: {
      type: String,
      name: '占位说明'
    },
    value: {
      type: String,
    },
  },
  data() {
    return {
      url: '/dictionaries'
    }
  },
  methods: {
    async loadData() {
      const { success, result = [] } = await getAction(this.url, { code: this.code }) || {}
      if (success && result.length) {
        const [ { values = [] } ] = result
        console.log(values)
        return values
      }
      return []
    }
  }
}
</script>

<style scoped>

</style>
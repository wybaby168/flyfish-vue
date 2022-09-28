<template>
  <a-spin :spinning="loading">
    <a-transfer
      v-bind="$attrs"
      v-on="$listeners"
      :data-source="loaded || []"
      :filter-option="filterOption"
      :lazy="false"
      :target-keys="value"
      @change="handleChange"
    />
  </a-spin>
</template>

<script>
import { NetworkMixins } from '@/components/auto/mixins/network'

/**
 * 支持网络请求的穿梭框，同时支持了双向绑定
 * @author wangyu
 */
export default {
  name: 'NetworkTransfer',
  mixins: [NetworkMixins],
  props: {
    value: {
      type: Array
    }
  },
  data() {
    return {
      targetKeys: []
    }
  },
  mounted() {
    this.targetKeys = this.value || []
  },
  watch: {
    value(value) {
      this.targetKeys = value
    }
  },
  methods: {
    filterOption(inputValue, option) {
      return option.title.indexOf(inputValue) > -1
    },
    handleChange(targetKeys) {
      this.targetKeys = targetKeys
      this.$emit('input', targetKeys)
    }
  }
}
</script>

<style scoped>

</style>

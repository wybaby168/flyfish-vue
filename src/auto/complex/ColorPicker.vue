<template>
  <a-input placeholder="请选择颜色" :value="value" @change="handleChange">
    <a-dropdown slot="addonAfter" :trigger="['click']">
      <chrome slot="overlay" @input="handleChange" :value="value || defaultValue" />
      <a-icon :type="icon" style="cursor: pointer" />
    </a-dropdown>
  </a-input>
</template>

<script>
import Chrome from 'vue-color/src/components/Chrome'
export default {
  name: 'ColorPicker',
  components: { Chrome },
  props: {
    value: {
      type: String,
    },
    defaultValue: {
      type: String,
      default: '#000000',
    },
    icon: {
      type: String,
      default: 'bg-colors'
    },
    full: {
      type: Boolean,
      default: false,
      description: '是否显示全8位hex，包含透明度'
    }
  },
  methods: {
    handleChange(e) {
      const value = e.target ? e.target.value : (this.full ? e.hex8 : e.hex);
      this.$emit('change', value);
    }
  }
}
</script>

<style scoped>

</style>

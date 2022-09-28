<template>
  <a-input-group compact>
    <a-input-number style="width: calc(100% - 80px)" :min="0" placeholder="请输入数值" v-model="number" @blur="handleNumber"/>
    <a-select style="width: 80px" :value="unit" @change="handleUnit" :options="options" />
  </a-input-group>
</template>

<script>/**
 * 文件大小输入框
 */
import { renderSize } from '@/utils/util';

const options = [ 'Bytes', 'KB', 'MB', 'GB', 'TB' ];

export default {
  name: 'FileSizeInput',
  props: {
    value: {
      type: Number,
    },
  },
  data() {
    return {
      number: 0,
      unit: 0,
    }
  },
  computed: {
    options() {
      return options.map((key, index) => ({ label: key, value: index }));
    }
  },
  watch: {
    value() {
      const [ number, unit ] = renderSize(this.value, '-').split('-');
      this.number = number;
      this.unit = options.indexOf(unit);
    }
  },
  methods: {
    handleNumber() {
      this.$emit('change', this.calculate(this.number, this.unit));
    },
    handleUnit(unit) {
      this.$emit('change', this.calculate(this.number, unit));
    },
    calculate(number, unit) {
      return number * Math.pow(1024, unit);
    }
  }
}
</script>

<style scoped>

</style>

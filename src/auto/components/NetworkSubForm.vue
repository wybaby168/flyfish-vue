<template>
  <sub-form v-bind="$attrs" v-on="$listeners" :form="form" :value="value" @change="handleChange" />
</template>

<script>
/**
 * 基于网络和参数缓存的子表单，能够动态根据在线的内容渲染
 * @author wangyu
 */
export default {
  name: 'NetworkSubForm',
  props: {
    load: {
      type: Function,
      default: () => async params => params
    },
    params: {
      type: Object,
      default: () => {
      }
    },
    value: {
      type: Object
    }
  },
  data() {
    return {
      form: []
    };
  },
  watch: {
    params() {
      this.loadForm();
    }
  },
  mounted() {
    // 初始化尝试加载form
    this.loadForm();
  },
  methods: {
    loadForm() {
      const { load, params } = this;
      load(params).then(res => {
        this.form = res || [];
      });
    },
    handleChange(value) {
      this.$emit('input', value);
    }
  }
}
</script>

<style scoped>

</style>

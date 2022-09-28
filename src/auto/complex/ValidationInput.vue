<template>
  <div>
    <a-select mode="multiple" placeholder="请添加校验规则" :options="options" :value="selected" @change="handleChange" />
    <template v-for="v in value">
      <a-form-item label="正则表达式" v-if="'pattern' in v" key="pattern">
        <a-input placeholder="请输入表达式" :value="v.pattern" />
      </a-form-item>
      <a-form-item label="自定义校验" v-else-if="'validator' in v" key="validator">
        <j-code-editor language="javascript" placeholder="请输入表达式"
                       :value="v.validator" />
      </a-form-item>
    </template>
  </div>
</template>

<script>

import JCodeEditor from '@/components/jeecg/JCodeEditor';
const validations = {
  required: context => ({
    required: true,
    message: `必须输入${context.title}`,
  }),
  // new Function('rule', 'value', 'callback', context.expression)
  validator: context => ({
    validator: context.expression,
  }),
  pattern: context => ({
    pattern: context.expression,
  }),
}

/**
 * 表单校验输入框
 * @author wangyu
 * 维护目前支持的所有表单校验方式
 */
export default {
  name: 'ValidationInput',
  components: { JCodeEditor },
  props: {
    title: String,
    validator: String,
    expression: String,
    value: {
      type: Array,
    }
  },
  data() {
    return {
      options: [
        { value: 'required', label: '必填' },
        { value: 'pattern', label: '正则表达式' },
        { value: 'validator', label: '自定义校验' },
      ]
    }
  },
  computed: {
    selected() {
      return (this.value || []).map(this.parseValue).filter(i => i);
    },
  },
  methods: {
    handleChange(value) {
      this.$emit('change', this.toObj(value))
    },
    toObj(value = []) {
      return value.map(item => validations[item](this));
    },
    parseValue(item) {
      return Object.keys(validations).find(key => key in item)
    },
  }
};
</script>

<style scoped>

</style>

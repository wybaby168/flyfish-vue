<template>
  <a-select
    :disabled="disabled"
    :mode="mode"
    :options="store.columns"
    :placeholder="placeholder || '请选择列'"
    :value="value"
    @change="handleChange"
    class="fl-column-picker"
    optionLabelProp="title"
  />
</template>

<script>

/**
 * 列选择器，提供列选择，多选，全选
 * 这个组件是所有配置的基础
 */
export default {
  name: 'ColumnPicker',
  props: {
    value: {
      type: [Number, String, Array]
    },
    placeholder: {
      type: String
    },
    disabled: {
      type: Boolean,
      default: false
    },
    multiple: {
      type: Boolean,
      default: false
    },
    excludes: {
      type: Array,
      default: () => []
    },
    store: {
      type: Object,
      default: () => ({
        columns: []
      })
    }
  },
  computed: {
    mode() {
      return this.multiple ? 'multiple' : 'default';
    }
  },
  methods: {
    handleChange(value) {
      console.log(value);
      this.$emit('change', value);
      this.$emit('input', value);
    }
  }
};
</script>

<style scoped>
.fl-column-picker {
  min-width: 150px;
}
</style>

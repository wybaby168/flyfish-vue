<template>
  <a-spin :spinning="loading">
    <div :key="item.value" v-for="(item, index) in fields">
      <a-form-item :label="item.label" :labelCol="labelCol" :wrapperCol="wrapperCol" v-bind="validationProps(index, item.label)">
        <a-select :id="item.value" v-model="selected[index]" @change="value => handleChange(value, index)" multiple
                  :options="getOptions(index)" allow-clear />
      </a-form-item>
    </div>
    <a-form-item :wrapperCol="controlCol">
      <a style="color: #ff0000" @click="handleClear"><a-icon type="close" /> 清空选择</a>
    </a-form-item>
  </a-spin>
</template>

<script>
/**
 * 分组选择器，能够动态增减选择项
 */

import { NetworkMixins } from '@/components/auto/mixins/network';
import isFunction from 'lodash.isfunction';
import zipObject from 'lodash.zipobject';

export default {
  name: 'SelectGroup',
  mixins: [NetworkMixins],
  props: {
    selection: {
      type: [Array, Function],
      default: () => [],
      description: '可选的内容',
    },
    triggerChange: {
      type: Boolean,
      default: false,
    },
    multiple: {
      type: Boolean,
      description: '是否可重复选',
      default: false,
    },
    //是否将 字段映射左右两边的值合并到一个Map中
    merge: {
      type: Boolean,
      default: false,
    },
    value: {
      type: [Array, Object],
      description: '值',
    },
    selectionAlias: {
      type: Array,
      description: '选择项数据别名',
    },
    requiredFields:{
      type: Array,
      description: '必须进行字段映射的选项',
    }
  },
  data() {
    return {
      selected: [],
      fields: [],
      controlCol: {
        offset: 8,
        span: 10,
      },
      labelCol: {
        span: 8,
      },
      wrapperCol: {
        span: 10,
      },
    };
  },
  mounted() {
    this.initFields().then(() => this.initValue());
  },
  watch: {
    value(value) {
      if (!this.fields.length) {
        this.initFields().then(() => {
          this.initValue();
        });
      } else {
        this.initValue();
      }
    },
    selection() {
      this.initFields();
    },
  },
  methods: {
    validationProps(index, val) {
      if (this.requiredFields.includes(val)) {
        // 如果当前项已经被选中
        if (!this.selected[index]) {
          return {
            validateStatus: 'error',
            help: '必须选择此项的值',
            required: true,
          };
        }
        return {
          required: true,
        }
      }
      return {};
    },
    initValue() {
      const { value } = this;
      if (this.merge) {
        this.selected = this.fields.map(item => value[item.value]);
      } else {
        this.selected = value;
      }
    },
    getValue() {
      if (this.merge) {
        return zipObject(this.fields.map(item => item.value), this.selected);
      }
      return this.selected;
    },
    handleChange(value, index) {
      this.selected[index] = value;
      this.$emit(this.triggerChange ? 'change' : 'input', this.getValue());
      this.$emit('input', this.getValue());
    },
    getOptions(index) {
      const current = this.selected[index];
      return this.options.filter(({ key }) => key === current || !this.selected.includes(key));
    },
    async initFields() {
      if (Array.isArray(this.selection)) {
        this.fields = this.selection;
      }
      if (isFunction(this.selection)) {
        const result = this.selection();
        if (result.then) {
          return result.then(result => {
            if (this.selectionAlias) {
              const [ valueKey, nameKey ] = this.selectionAlias;
              const items = this.bare ? result.result : result;
              this.fields = (items || []).map(item => ({ ...item, value: item[valueKey], label: item[nameKey] }));
            } else {
              this.fields = result || [];
            }
          });
        } else {
          this.fields = result || [];
        }
      }
    },
    handleClear() {
      this.selected.splice(0, this.selected.length);
      this.$emit(this.triggerChange ? 'change' : 'input', this.getValue());
      this.$emit('input', this.getValue());
    },
  },
};
</script>

<style scoped>

</style>

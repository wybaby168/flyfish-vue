<template>
  <a-form-model
      ref="form"
      :model="data"
      :rules="validation"
      class="auto-form"
      layout="horizontal"
      v-bind="$attrs"
  >
    <a-row :gutter="10">
      <a-col v-for="item in forms" v-if="item.visible(data)" v-show="item.component !== 'input-hidden'"
             :key="item.code" :offset="item.offset || 0" :span="item.span || 12">
        <a-form-model-item :ref="item.code" :extra="item.extra" :prop="item.code" v-bind="styles(item)">
          <span v-if="item.title" slot="label">{{ item.title }}
            <a-tooltip v-if="item.tips" placement="bottom">
              <pre slot="title" class="tips">{{ item.tips }}</pre>
              <a><a-icon type="question-circle"/></a>
            </a-tooltip>
          </span>
          <keep-alive>
            <component
                :is="item.component || 'a-input'"
                v-model="data[item.code]"
                v-bind="item.merge(data)"
                @blur="e => handleBlur(item.code, e)"
                @change="e => handleChange(item.code, e)"
            >{{ item.children || '' }}
            </component>
          </keep-alive>
        </a-form-model-item>
      </a-col>
    </a-row>
  </a-form-model>
</template>

<script>
import ColumnPicker from '@/components/auto/components/ColumnPicker'
import EditableTable from '@/components/auto/components/EditableTable'
import AutoFormConfig from '@/components/auto/model/forms'
import { AutoFormMixins, SubFormMixins } from '@/components/auto/mixins'
import isFunction from 'lodash.isfunction'
import { mergeSafety } from '@/utils/util'

const { AutoFormOptions } = AutoFormConfig

/**
 * 子表单渲染器
 */
export default {
  name: 'SubFormRender',
  components: {
    ColumnPicker,
    EditableTable,
  },
  mixins: [ AutoFormMixins, SubFormMixins ],
  props: {
    form: {
      type: Array,
      default: () => []
    },
    code: {
      type: String,
    },
    trigger: {
      type: Boolean,
      default: false
    },
    value: {
      type: Object
    }
  },
  data() {
    return {
      labelCol: { span: 4 },
      wrapperCol: { span: 18 },
      visible: false,
      data: {},
      forms: [],
      mappings: {}  // 表单映射
    };
  },
  mounted() {
    this.forms = (this.form || []).map(item => new AutoFormOptions(item));
    this.data = mergeSafety(this.initialValue(), this.value);
    this.mapping();
  },
  watch: {
    form(value) {
      this.forms = (value || []).map(item => new AutoFormOptions(item));
      const defaults = this.initialValue();
      this.data = mergeSafety(defaults, this.data);
      this.mapping();
    },
    value(value) {
      this.data = value || this.forms.reduce((result, item) => {
        result[item.code] = undefined;
        return result;
      }, {});
    }
  },
  computed: {
    validation() {
      return this.form.reduce((result, item) => {
        result[item.code] = isFunction(item.validation) ? item.validation(this.data, this) : (item.validation || []);
        return result;
      }, {});
    }
  },
  methods: {
    styles(item) {
      return {
        labelCol: item.grid.label || this.labelCol,
        wrapperCol: item.grid.wrapper || (!item.title ? { offset: 4, ...this.wrapperCol } : this.wrapperCol)
      };
    },
    initialValue() {
      return this.forms.reduce((result, item) => {
        const { code, options: { initialValue } = {} } = item;
        result[code] = initialValue;
        return result;
      }, {});
    },
    handleBlur(key, e) {
      const { [key]: refs } = this.$refs;
      if (Array.isArray(refs)) {
        refs.forEach(ref => ref.onFieldBlur());
      } else {
        refs.onFieldBlur();
      }
    },
    handleChange(key, e) {
      const { options: { valuePropName = 'value' } = {} } = this.forms.find(item => item.code === key) || {}
      const value = e.target ? e.target[valuePropName] : e
      // fix 值不同，填入值（应对无法双向绑定的值）
      if (this.data[key] !== value) {
        this.data[key] = value
      }
      // 联动
      this.chain({ [key]: value })
      // 触发事件
      if (this.trigger) {
        this.$emit('change', this.data)
      }
      const { [key]: refs } = this.$refs;
      if (Array.isArray(refs)) {
        refs.forEach(ref => ref.onFieldChange());
      } else {
        refs.onFieldChange();
      }
    },
    getForm() {
      return this.forms || []
    },
    validate() {
      return new Promise((resolve, reject) => {
        this.$refs.form.validate(valid => {
          if (valid) {
            resolve(true)
          } else {
            this.$emit('error', this);
            // eslint-disable-next-line prefer-promise-reject-errors
            reject(false)
            this.$refs.form.$forceUpdate()
          }
        })
      })
    },
    submit() {
      return new Promise((resolve, reject) => {
        this.$refs.form.validate(valid => {
          if (valid) {
            this.$emit('change', this.data)
            this.$emit('submit')
            resolve(true)
          } else {
            console.log('error submit!!')
            reject(new Error('error submit!!'))
            this.$refs.form.$forceUpdate();
            return false;
          }
        });
      });
    }
  }
};
</script>

<style scoped>
.auto-form /deep/ .ant-input-number {
  width: 100%;
}

.auto-form /deep/ .ant-select {
  width: 100%;
}

.auto-form.outline {
  border-top: 1px black dashed;
  border-bottom: 1px black dashed;
  padding: 5px 0 5px 5px;
}
</style>

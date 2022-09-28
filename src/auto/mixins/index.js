import pick from 'lodash.pick'
import set from 'lodash.set'
import get from 'lodash.get'
import has from 'lodash.has'
import unset from 'lodash.unset'
import isFunction from 'lodash.isfunction'
import AutoFormConfig from '../model/forms'
import { memoizeOne, valueof } from '@/utils/util'
import { interceptors } from '@/utils/request'
import {isNature} from "@/utils/matcher";

const { AutoFormOptions } = AutoFormConfig

// 提交值
const applyValue = (data, item) => {
  const { code, component, props = {}, options } = item
  const { form = [], wrap = true } = props
  // 递归，存在子表单，展开放入
  if (component === 'sub-form' && wrap) {
    form.forEach(subForm => applyValue(data, subForm))
  } else if (component === 'editable-table') {
    const value = get(data, code) || [];
    const { columns = [] } = props;
    columns.forEach(form => value.forEach(row => applyValue(row, form)));
  } else {
    // 为了补偿，新增一个对象，用完释放
    item = item instanceof AutoFormOptions ? item
      : new AutoFormOptions(item);
    // 可见性联动，初始化数据不初始化不存在的prop
    if (item.visible(data)) {
      // 原值
      const value = get(data, code);
      const { initialValue } = options || {};
      // 赋值
      set(data, code, isNature(value) ? value : valueof(initialValue));
    } else {
      unset(data, code);
    }
  }
};

const isWrappedSubForm = data => ({ component, props = {} }) => {
  const { wrap = true } = isFunction(props) ? props(data) : props
  return wrap && component === 'sub-form'
}

/**
 * 自动表单混合
 */
export const AutoFormMixins = {
  data() {
    return {
      // 表单映射
      mappings: {}
    };
  },
  methods: {
    // 补全data的key，提供双向绑定和校验机制
    computeData(data) {
      const form = this.getForm() || [];
      return form.reduce((result, item) => {
        // 存在子表单，展开放入
        applyValue(result, item);
        // 处理完成，返回
        return result;
      }, { ...data });
    },
    // 准备外部数据，放入本数据
    prepare(data) {
      const forms = this.getForm() || [];
      return forms.filter(isWrappedSubForm(data))
        .reduce((result, item) => {
          const { code, props } = item;
          const { form = [] } = isFunction(props) ? props(data) : props;
          const keys = form.map(item => item.code);
          // 合并，写入对象
          set(result, code, pick(result, keys));
          // 删除key
          keys.forEach(key => unset(result, key));
          return result;
        }, this.computeData(data));
    },
    // 转换外部数据，解包合并子表单数据
    transform(data) {
      const forms = this.getForm() || [];
      return forms.filter(isWrappedSubForm(data))
        .reduce((result, item) => {
          const { code } = item
          const { [code]: value = {}, ...rest } = result
          // 组装
          return {
            ...rest,
            ...value
          }
        }, { ...data })
    },
    // 组装值联动映射
    mapping() {
      // 这里为了兼容通用view的特殊情况，通用view中以配置项为最大节点
      if (this.config && this.config.mappings) {
        this.mappings = this.config.mappings;
      } else {
        this.mappings = (this.getForm() || []).reduce((result, item) => {
          if (item.mapping) {
            // 增加节流操作
            result[item.code] = isFunction(item.mapping) ? memoizeOne(item.mapping, value => ({ value }))
              : item.mapping;
          }
          return result;
        }, {});
      }
    },
    // 值联动逻辑
    chain(values, target = this.data) {
      const form = this.getForm() || [];
      form.map(({ code }) => code).filter(key => has(values, key)).forEach(key => {
        // 当且仅当本次变更了该值时才生效
        const mapping = this.mappings[key];
        const value = get(values, key);
        const mapper = isFunction(mapping) ? mapping(value, target) : mapping && mapping[value] ? mapping[value] : '';
        if (mapper) {
          if (mapper.then) {
            mapper.then(value => {
              if (value) {
                applyMappedValue(target, value, this)
                this.$forceUpdate()
              }
            });
          } else {
            applyMappedValue(target, mapper, this)
          }
        }
      });
    },
  },
};

const applyMappedValue = (target, value, context) => {
  const { form } = context
  // 使用赋值的方式，保证调用到setter
  Object.assign(target, value)
  // 存在表单时，执行表单赋值
  if (form && form.setFieldsValue) {
    form.setFieldsValue(value)
  } else if (!context.lazy) {
    context.$emit('change', target)
  }
}

/**
 * 通用表格混入
 */
export const CrudTableMixins = {
  data() {
    return {
      handlers: {
        create: this.handleCreate,
        'batch-delete': this.handleBatchDelete,
        edit: this.handleEdit,
        delete: this.handleDelete,
        detail: this.handleDetail
      }
    };
  },
  methods: {
    getKey(row) {
      return isFunction(this.rowKey) ? this.rowKey(row) : get(row, this.rowKey);
    },
    handleCreate() {
      const { initialForm } = this;
      const form = initialForm ? isFunction(initialForm) ? initialForm() : initialForm : {};
      this.$refs.modal.show(form);
    },
    async handleBatchDelete(record, table) {
      const { batchDelete } = this.config;
      if (batchDelete) {
        if (table.selectedRowKeys && table.selectedRowKeys.length) {
          const { success, message = '删除时发生未知异常！' } = await batchDelete(table.selectedRowKeys) || {};
          if (success) {
            this.$message.success('成功删除选中的数据！');
          } else {
            this.$message.error(message);
          }
        } else {
          this.$message.info('您未选择任何行，请先至少选中一行！');
        }
      }
    },
    async handleDelete(record) {
      const { delete: deleteSingle } = this.config;
      if (deleteSingle) {
        const { success, message = '删除时发生未知异常！' } = await deleteSingle(record) || {};
        if (success) {
          this.$message.success('成功删除记录！');
        } else {
          this.$message.error(message);
        }
      }
    },
    handleEdit(record) {
      this.$refs.modal.show(record);
    },
    handleDetail(record) {
      interceptors.once = { headers: { read: 1 } };
      this.$refs.detail.show(record);
    },
    // 查询变更数据
    async getData(record) {
      const { read } = this.config;
      if (read && this.getKey(record)) {
        const { success, message = '查询数据发生未知异常！', result = {} } = await read(record) || {};
        if (success) {
          return result;
        } else {
          this.$message.error(message);
        }
      }
      return record;
    }
  },
};

export const FormRenderMixins = {
  props: {
    // 是否隐藏提交区域
    embedded: {
      type: Boolean,
      default: false
    },
    handleOk: {
      type: Function
    },
    handleClear: {
      type: Function
    },
    data: {
      type: Object
    },
    groups: {
      type: Array
    },
    form: {
      type: Object,
    },
  },
  data() {
    return {
      submitCol: {
        xs: { span: 24, offset: 0 },
        sm: { span: 16, offset: 1 }
      }
    };
  },
};

export const StepFormMixins = {
  data() {
    return {
      current: 0
    };
  },
  methods: {
    next() {
      this.validate(() => {
        this.current++;
      });
    },
    prev() {
      this.current--;
    }
  }
};

export const TransformSupportMixins = {
  methods: {
    prepareData(data) {
      const { transformer: { prepare } = {} } = this.config || {};
      const handled = prepare && prepare(data) || data;
      return this.prepare(handled);
    },
    transformData(data) {
      const transformed = this.transform(data);
      const { transformer: { transform } = {} } = this.config || {};
      return transform && transform(transformed, this.data) || transformed;
    }
  }
}

export const SubFormMixins = {
  mounted() {
    this.$bus.emit('ref', this.code, this)
  },
  beforeDestroy() {
    this.$bus.emit('ref', this.code, this, true)
  },
}

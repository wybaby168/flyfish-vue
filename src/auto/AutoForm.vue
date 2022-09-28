<template>
  <a-spin :spinning="loading">
    <!-- 主表单区域 -->
    <a-form :form="form" :class="mappedClass">
      <title-form-render
        v-if="!type || type === 'default'"
        v-bind="bound"
      />
      <step-form-render
        v-else-if="type === 'step'"
        v-bind="bound"
        :current="current"
        @step="handleStep"
      />
      <tabs-form-render
        v-else-if="type === 'tabs'"
        ref="tab"
        v-bind="bound"
      />
      <menu-form-render
          v-else-if="type === 'menu'"
          v-bind="bound"
      />
    </a-form>
  </a-spin>
</template>

<script>
import isFunction from 'lodash.isfunction'
import groupBy from 'lodash.groupby'
import { AutoFormMixins, TransformSupportMixins } from './mixins'
import set from 'lodash.set'
import get from 'lodash.get'
import { StepFormRender, TabsFormRender, TitleFormRender, MenuFormRender } from './partial'
import { mergeSafety } from '@/utils/util'
import AutoFormConfig from '@/components/auto/model/forms'

/**
 * 转换器视图，提供数据的输入输出，基于通用简单的配置实现
 * @author wangyu
 */
export default {
  name: 'AutoForm',
  components: { TitleFormRender, StepFormRender, TabsFormRender, MenuFormRender },
  mixins: [AutoFormMixins, TransformSupportMixins],
  props: {
    prefixCls: {
      type: [String, Object],
      default: '',
    },
    // 组件标识，会到服务端寻址，存在缓存
    config: {
      type: [AutoFormConfig, Object],
      description: '表单配置'
    },
    current: {
      type: Number,
      default: 0,
      description: '分步表单专用'
    },
    // 是否隐藏提交区域
    embedded: {
      type: Boolean,
      default: false
    },
    // 触发变更事件
    trigger: {
      type: [Boolean, String],
      default: false
    },
    // 读取数据的源
    loadData: {
      type: Function
    },
    // 表单值赋值
    value: {
      type: Object
    }
  },
  mounted() {
    if (this.value) {
      this.updateInternal(this.value)
    }
    // 处理映射
    this.mapping()
    // 处理异步逻辑
    this.handleDelay()
    // 监听bus
    this.$bus.on('ref', this.handleRef)
  },
  beforeDestroy() {
    this.$bus.off('ref', this.handleRef)
  },
  // 挂载时做初始化
  watch: {
    config() {
      // 处理表单映射
      this.mapping()
    },
    value(value) {
      // value改变，更新data
      this.updateInternal(value)
    }
  },
  computed: {
    mappedClass() {
      const { prefixCls } = this;
      if (!prefixCls || typeof prefixCls === 'string') {
        return { 'auto-form': true, [prefixCls]: prefixCls }
      } else {
        return { 'auto-form': true, ...prefixCls }
      }
    },
    type() {
      return (this.config || {}).type
    },
    bound() {
      return {
        embedded: this.embedded,
        handleOk: this.handleOk,
        handleClear: this.clear,
        groups: this.groups,
        data: this.data
      }
    },
    // 分组，这里的分组是综合各因素后产生的。默认仅一个分组
    groups() {
      const { groups = [], wrapper, form = [] } = this.config || {}
      if (groups.length) {
        const group = groupBy(form, 'group')
        const result = groups.filter(({ condition }) => !condition || condition(this.data)).map(({ name, code, form, icon }) => {
          const bound = group[code] || []
          const staticForm = (form || []).map(form =>
            form instanceof AutoFormConfig.AutoFormOptions ? form : new AutoFormConfig.AutoFormOptions(form))
          return {
            code,
            name,
            icon,
            form: staticForm.length ? staticForm.concat(bound) : group[code],
            wrapper
          }
        }).filter(item => item.form && item.form.length)
        // 未分组的，找出来，单独成组
        const ungrouped = form.filter(item => !item.group)
        if (ungrouped.length) {
          result.push({
            code: 'ungrouped',
            name: '未分组',
            form: ungrouped,
            wrapper: wrapper
          })
        }
        if (result.length) {
          return result
        }
      }
      return [{ form, wrapper }]
    }
  },
  data() {
    return {
      lock: false,
      form: this.$form.createForm(this, {
        onValuesChange: (_, values) => {
          // 合并数据
          const merged = mergeSafety({ ...this.data }, values)
          // 未锁定，提交联动和事件
          if (!this.lock) {
            // 值联动
            this.chain(values, merged)
            const { trigger } = this
            if (trigger) {
              // 变更情况提交
              this.$emit(trigger === true ? 'change' : trigger, merged)
            }
          }
          // 触发更新
          this.data = merged
        }
      }),
      // 存储配置信息，最终提交到服务器
      data: {},
      // 加载
      loading: false,
      // 缓存组件
      refs: {}
    }
  },
  methods: {
    async update(data = {}) {
      const { loadData } = this
      // 存在加载方法
      if (Object.keys(data).length && loadData) {
        this.loading = true
        return loadData(data).then(res => {
          return this.updateInternal(res || {})
        }).finally(() => {
          this.loading = false
        })
      } else {
        return Promise.resolve(this.updateInternal(data))
      }
    },
    visibleFields(mapper) {
      const keys = this.groups.flatMap(group => group.form.map(item => item.code))
      return keys.reduce(mapper, {})
    },
    updateInternal(data) {
      this.data = this.prepareData(data)
      this.$nextTick(() => {
        const values = this.visibleFields((result, key) => {
          set(result, key, get(this.data, key))
          return result
        })
        // 执行保护
        this.lock = true
        this.$nextTick(() => {
          this.form.setFieldsValue(values)
          this.lock = false
        })
      })
      return data
    },
    getForm() {
      return (this.config || {}).form || []
    },
    clear() {
      this.update({})
      this.$emit('clear')
    },
    // 下一步触发的动作，我们可以通过值变更判断得出上一步下一步，下一步需要校验
    handleStep(step) {
      this.$emit('step', step)
    },
    // 孙子节点的ref
    handleRef(code, instance, remove) {
      const { refs: { [code]: refs = [] } } = this;
      if (remove) {
        this.refs[code] = refs.filter(comp => comp._uid !== instance._uid)
      } else {
        this.refs[code] = refs.concat(instance);
      }
    },
    // 尝试校验子表单
    validateSub(codes) {
      return Promise.all(Object.keys(this.refs).filter(code => !codes || codes.includes(code))
        .flatMap(code => this.refs[code].map(ref => ref.validate())))
    },
    // 使用该方式处理异步props，后续增加高级法则
    handleDelay() {
      Promise.all(((this.config || {}).form || []).filter(item => isFunction(item.delay)).map(item => {
        item.delay(this).then((result = {}) => item.props = {
          ...item.props,
          ...result
        })
      })).then(() => this.$forceUpdate())
    },
    handleOk() {
      // 触发表单验证
      this.form.validateFields(async (err, values) => {
        // 接着触发子表单校验
        if (!err) {
          await this.validateSub()
          // 解包处置
          const result = this.transformData(values)
          // 提交事件
          this.$emit('ok', result)
        }
      })
    }
  }
}
</script>

<style scoped lang="less">
.auto-form /deep/ .ant-input-number {
  width: 100%;
}

.auto-form /deep/ .ant-select {
  width: 100%;
}
</style>

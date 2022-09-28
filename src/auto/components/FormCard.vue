<template>
  <div class="form-card">
    <a-card v-if="!multiple">
      <span slot="title"><a-icon :type="icon"/> {{ name }}</span>
      <sub-form-render ref="form" :form="form" :value="Array.isArray(value) ? value[0] || {} : value" trigger
                       :transformer="transformer" @change="handleChange"/>
    </a-card>
    <template v-else>
      <a-button v-if="!isBlock('add')" icon="plus" type="primary" @click="handleCreate">添加</a-button>
      <template v-if="mode === 'card'">
        <a-card v-for="(v, index) in value" :key="id(v)">
          <span slot="title"><a-icon :type="icon"/> {{ `${name}${index + 1}` }}</span>
          <a slot="extra" style="color: red" title="删除" @click="handleRemove(v, index)">
            <a-icon type="close-circle"/>
          </a>
          <sub-form-render :ref="id(v)" :transformer="transformer" :form="form" :value="v" trigger
                           @change="data => handleChange(data, index)"/>
        </a-card>
      </template>
      <template v-else-if="mode === 'tab'">
        <a-card :active-tab-key="activeKey" :tab-list="tabs" @tabChange="handleTabChange">
          <template v-if="value && value.length">
            <sub-form-render
                v-for="(v, i) in value"
                v-show="i === activeIndex"
                :key="id(v, i)"
                :code="code"
                :form="form"
                :value="v"
                trigger
                :transformer="transformer"
                @change="data => handleChange(data, i)"
                @error="handleError(v, i)"
            />
          </template>
          <a-empty v-else/>
        </a-card>
      </template>
      <template v-else-if="mode === 'collapse'">
        <a-collapse v-if="value && value.length" :active-key="activeKey" accordion style="margin-top: 10px">
          <a-collapse-panel v-for="(v, index) in value" :key="id(v, index)">
            <template slot="header">
              <dynamic-render v-if="detail" :data="{v, index}" :provider="renderDetail"/>
              <span v-else><a-icon :type="icon"/> {{ `${name}${index + 1}` }}</span>
              <a-popconfirm v-if="!isBlock('delete', v)" placement="topRight" title="确认要删除该页吗？您的数据将不被保存"
                            :overlay-style="{width: '200px'}"  @confirm="doRemove(v, index)">
                <a class="row-remover" @click.stop>
                  <a-icon type="close-circle"/>
                </a>
              </a-popconfirm>
            </template>
            <sub-form-render
                :code="code"
                :form="form"
                :value="v"
                trigger
                :transformer="transformer"
                @change="data => handleChange(data, index)"
                @error="handleError(v, index)"
            />
          </a-collapse-panel>
        </a-collapse>
        <a-empty v-else :description="placeholder || `请点击添加按钮添加“${name}”`"/>
      </template>
    </template>
  </div>
</template>

<script>
import SubFormRender from '@/components/auto/components/partial/SubFormRender'
import { isNature } from '@/utils/matcher'
import debounce from 'lodash.debounce'
import DynamicRender from '@/components/auto/partial/DynamicRender';
import adaptor from '@/utils/adaptor'

const complex = ['sub-form', 'editable-table', 'form-card'];

/**
 * 表单卡片，提供多值情况
 * @author wangyu
 * @supported 根据实际需求，已明确校验规则存在的问题。
 * 现在已脱离视图绑定，对数据进行纯粹的校验，并自动定位到card所在的活动页
 */
export default {
  name: 'FormCard',
  components: { DynamicRender, SubFormRender },
  props: {
    value: {
      type: [ Object, Array ],
      description: '表单卡片的值，支持单值和数组'
    },
    name: {
      type: String,
      default: '表单',
      description: '标题显示名称'
    },
    placeholder: {
      type: String,
      default: '',
    },
    titleKey: {
      type: String,
      default: 'name',
      description: '显示在卡片标题的变量名称'
    },
    icon: {
      type: String,
      default: 'form',
      description: '卡片图标'
    },
    form: {
      type: Array,
      description: '表单卡片的表单'
    },
    mode: {
      type: String,
      description: '多值模式，支持tab, collapse, card',
      default: 'tab'
    },
    multiple: {
      type: Boolean,
      description: '是否是多值情况',
      default: true
    },
    block: {
      type: Function,
      description: '定义什么情况下禁用一些操作',
    },
    detail: {
      type: [ Boolean, Array ],
      description: '是否显示详情，用于collapse，可指定详情的字段'
    },
    transformer: {
      type: Object,
      description: '初始化处理器，作用于每行'
    },
  },
  data() {
    return {
      activeKey: '',
      activeIndex: 0
    }
  },
  watch: {
    value(value) {
      if (value && value.length && !this.activeKey) {
        const [ { id, _id = id } ] = value
        this.activeKey = String(_id || '0');
      }
    }
  },
  computed: {
    tabs() {
      return (this.value || []).map((value, index) => ({
        key: this.id(value, index),
        tab: (
            <div>
              {value[this.titleKey] || `${this.name}${index + 1}`}
              {
                this.isBlock('delete', value) ? null
                    : <a style="color: red; margin-left: 8px" title="删除"
                         vOn:click={() => this.handleRemove(value, index)}>
                      <a-icon type="close"/>
                    </a>
              }
            </div>
        )
      }))
    },
    current() {
      const { activeKey } = this
      return isNature(activeKey) ? this.value[activeKey] : {}
    },
    code() {
      return this.$attrs.code;
    }
  },
  methods: {
    id(value, index) {
      return String(value._id || value.id || index);
    },
    validate() {
      return this.$refs.form.validate();
    },
    // 校验失败时触发
    handleError(value, index) {
      this.activeKey = this.id(value, index);
      this.activeIndex = index;
    },
    isBlock(key, record) {
      if (this.block) {
        return this.block(key, record);
      }
    },
    handleCreate: debounce(function () {
      // 迭代
      const { value = [] } = this;
      const index = value.length;
      const item = this.initialValues();
      this.$emit(this.triggerType(), [ ...value, item ])
      this.activeKey = String(item._id)
      this.activeIndex = index
    }, 500, { leading: true }),
    handleRemove(value, index) {
      this.activeKey = this.id(value, index)
      this.$confirm({
        title: '确认操作吗？',
        content: '确认要删除该页吗？您的数据将不被保存',
        onOk: () => this.doRemove(value, index),
      })
    },
    doRemove(value, index) {
      this.$emit(this.triggerType(), this.value.filter((_, i) => i !== index))
      this.activeIndex = this.value.length - 2
      if (this.activeIndex !== -1) {
        this.activeKey = this.id(this.value[this.activeIndex], this.activeIndex)
      }
    },
    handleTabChange(tab) {
      this.activeKey = tab
      this.activeIndex = this.value.findIndex((item, index) => this.id(item, index) === tab)
    },
    handleChange(data, index = 0) {
      if (Array.isArray(this.value)) {
        const current = { ...this.value[index], ...data }
        this.$emit(this.triggerType(), this.value.map((item, i) => i === index ? current : item))
      } else {
        this.$emit(this.triggerType(), { ...this.value, ...data })
      }
    },
    triggerType() {
      return this.$listeners.change ? 'change' : 'input';
    },
    initialValues() {
      // 生成临时id
      const id = Date.now()
      return this.form.reduce((result, item) => {
        const { code, options: { initialValue } = {} } = item;
        result[code] = initialValue;
        return result;
      }, { _id: id });
    },
    renderDetail(_, { v: data = {}, index }) {
      const filtered = this.form.filter(({ title, code }) => title && isNature(data[code]) && data[code] !== '');
      return (
          <div>
            <a-descriptions class={!filtered.length ? 'empty' : ''} title={(
                <span><a-icon type={this.icon} style={{ marginRight: '5px' }}/>{`${this.name}${index + 1}`}</span>
            )}>
              {filtered.map(item => (
                  <a-descriptions-item label={item.title} span={complex.includes(item.component) ? 3 : undefined}>
                    {adaptor.adapt(data, item, this.$createElement)}
                  </a-descriptions-item>
              ))}
            </a-descriptions>
          </div>
      )
    },
  }
}
</script>

<style lang="less" scoped>

.form-card {
  .ant-card {
    margin-top: 15px;
  }

  .title {
    width: 300px;
  }

  .row-remover {
    position: absolute;
    top: 13px;
    font-size: 20px;
    right: 20px;
    color: red;
  }

  .empty {
    /deep/ .ant-descriptions-title {
      margin-bottom: 0;
    }
  }

  /deep/ .ant-descriptions-title {
    margin-bottom: 10px;
  }

  /deep/ .ant-descriptions-item {
    padding-bottom: 8px;
  }
}
</style>

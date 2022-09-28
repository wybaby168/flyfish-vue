<template>
  <div>
    <a-button-group v-for="prop in props" :key="prop.code" class="style-toolbar">
      <a-tooltip v-for="child in prop.children" :key="child.code" :title="child.name">
        <a-popover trigger="click" :title="child.name" v-if="child.component">
          <component
              slot="content"
              :is="child.component"
              v-bind="child.props || {}"
              :value="read(child)"
              v-on="{[child.trigger || 'change']: value => trigger(child, child.value(value))}"
          />
          <a-button :icon="child.icon || child.code"/>
        </a-popover>
        <a-button
            v-else
            :icon="child.icon || child.code"
            :type="highlight(child) ? 'primary' : 'default'"
            @click="trigger(child, child.value)"
        />
      </a-tooltip>
    </a-button-group>
    <a-space>
      <span style="font-size: 12px">自定义css</span>
      <a-input size="small" :value="custom" @change="handleCustom" @pressEnter="commit" placeholder="css表达式">
        <a-popover slot="suffix" placement="top" v-model="visible" trigger="click">
          <template slot="content">
            <a-textarea :rows="5" style="width: 300px" :value="custom" @change="handleCustom" />
          </template>
          <template slot="title">
            <span>填写css表达式，优先级高于上述配置</span>
            <span style="float: right" @click="() => this.visible = false">
              <a-icon title="关闭" type="close" />
            </span>
          </template>
          <a-icon class="full-screen-icon" type="fullscreen" />
        </a-popover>
        <a-icon slot="suffix" class="confirm-icon" type="check-circle" @click="commit" />
      </a-input>
    </a-space>
  </div>
</template>

<script>
import { flatten } from '@/utils/util';
import pick from 'lodash.pick';
import Chrome from 'vue-color/src/components/Chrome'

const toNumber = (value, initial) => Number(value && value.replace('px', '') || initial)

/**
 * 内置配置，自动根据key判定值
 */
const props = [
  {
    name: '文本对齐',
    code: 'text-align',
    children: [
      { name: '文本居左', id: 'text-align', code: 'align-left', value: 'left' },
      { name: '文本居中', id: 'text-align', code: 'align-center', value: 'center' },
      { name: '文本居右', id: 'text-align', code: 'align-right', value: 'right' },
    ]
  },
  {
    name: '文本样式',
    code: 'text-style',
    children: [
      { name: '加粗', code: 'bold', id: 'font-weight', value: '500' },
      { name: '斜体', code: 'italic', id: 'font-style', value: 'italic' },
      { name: '下划线', code: 'underline', id: 'text-decoration', value: 'underline' },
      { name: '删除线', code: 'strikethrough', id: 'text-decoration', value: 'line-through' },
    ]
  },
  {
    name: '字体风格',
    code: 'text-config',
    children: [
      {
        name: '字体颜色',
        code: 'font-colors',
        id: 'color',
        component: 'color-picker',
        trigger: 'input',
        initialValue: '#000000',
        value: value => value && value.hex || '#000000',
      },
      {
        name: '背景颜色',
        code: 'bg-colors',
        id: 'background-color',
        component: 'color-picker',
        trigger: 'input',
        initialValue: '#000000',
        value: value => value && value.hex || '#000000',
      },
      {
        name: '字体大小',
        code: 'font-size',
        component: 'a-slider',
        props: { defaultValue: 12, min: 12, max: 200, autoFocus: true, tipFormatter: v => `${v}px` },
        value: value => `${value}px`,
        read: value => toNumber(value, 12),
      },
      {
        name: '行高',
        code: 'line-height',
        component: 'a-slider',
        props: { defaultValue: 25, min: 12, max: 200, autoFocus: true, tipFormatter: v => `${v}px` },
        value: value => `${value}px`,
        read: value => toNumber(value, 25)
      }
    ],
  },
  {
    name: '边框',
    code: 'border',
    children: [
      {
        name: '实线边框',
        code: 'border-outer',
        id: 'border-style',
        value: 'solid',
      },
      {
        name: '虚线边框',
        code: 'dash',
        id: 'border-style',
        value: 'dashed'
      },
      {
        name: '点状边框',
        code: 'small-dash',
        id: 'border-style',
        value: 'dotted'
      },
    ],
  },
  {
    name: '个性化边框',
    code: 'customization',
    children: [
      {
        name: "边框宽度",
        code: 'border-verticle',
        id: 'border-width',
        component: 'a-select',
        props: {
          style: 'width: 100%',
          placeholder: '请选择宽度',
          options: [
            { label: '较细(1px)', value: '1px' },
            { label: '正常(2px)', value: '2px' },
            { label: '较粗(4px)', value: '4px' },
            { label: '很粗(8px)', value: '8px' },
          ]
        },
        value: value => value,
      },
      {
        name: '边框弧度',
        code: 'radius-setting',
        id: 'border-radius',
        component: 'a-slider',
        props: { defaultValue: 30, tipFormatter: v => `${v}px` },
        value: value => `${value}px`,
        read: value => toNumber(value, 0)
      }
    ]
  }
];

const keys = flatten(props).map(item => item.id || item.code);

/**
 * css样式选择器
 */
export default {
  name: 'StylePicker',
  components: { 'color-picker': Chrome },
  props: {
    value: {
      type: String,
    }
  },
  data() {
    return {
      props,
      context: {},
      custom: '',
      visible: false,
    }
  },
  watch: {
    value() {
      const parsed = this.parseValue();
      const allKeys = Object.keys(parsed);
      this.context = pick(parsed, allKeys.filter(key => keys.includes(key)));
      this.custom = allKeys.filter(key => !keys.includes(key)).reduce((result, key) => {
        const value = parsed[key];
        if (value) {
          return [result, `${key}: ${this.parsed[key]}`].filter(i => i).join(';');
        }
        return result;
      }, '');
    }
  },
  computed: {
    parsed() {
      return { ...this.parseValue(), ...this.context };
    },
  },
  methods: {
    trigger(item, value) {
      const key = item.id || item.code;
      // 值一致时，消除选项
      if (this.highlight(item)) {
        delete this.context[key];
        this.context = { ...this.context };
      } else {
        this.context = {
          ...this.context,
          [key]: value,
        }
      }
      this.commit();
    },
    parseValue() {
      const pairs = (this.value || '').replace('\n', '').split(';');
      return pairs.map(pair => pair.split(':')).reduce((result, pair) => {
        const [ key, value = '' ] = pair;
        result[key.trim()] = value.trim();
        return result;
      }, {});
    },
    handleCustom(e) {
      this.custom = e.target ? e.target.value : e;
    },
    commit() {
      if (this.custom && !this.custom.includes(':')) {
        this.$message.error('css表达式校验错误！')
      } else {
        this.$emit('change', this.output());
      }
    },
    highlight(item) {
      return this.parsed[item.id || item.code] === item.value;
    },
    read(item) {
      const value = this.parsed[item.id || item.code] || item.initialValue;
      if (item.read) {
        return item.read(value);
      }
      return value;
    },
    output() {
      return Object.keys(this.context).reduce((result, key) => {
        return [`${key}: ${this.context[key]}`, result].filter(i => i).join(';');
      }, this.custom || '');
    },
  },
}
</script>

<style scoped>
.style-toolbar {
  display: inline-block;
  margin-left: 5px;
}
.full-screen-icon {
  cursor: pointer;
}
.confirm-icon {
  cursor: pointer;
  margin-left: 5px;
  color: #0eb2ff;
}
</style>

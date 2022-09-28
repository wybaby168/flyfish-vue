<template>
  <div class="sub-form">
    <template v-if="modal">
      <a @click="show">{{ placeholder }}</a>
      <a-modal
        :confirmLoading="false"
        :maskClosable="false"
        :title="title"
        :visible="visible"
        :width="1200"
        @cancel="hide"
        @ok="submit"
      >
        <sub-form-render ref="render" v-bind="bind" v-on="$listeners" :form="form" :value="value"
                         @submit="handleSubmit" />
      </a-modal>
    </template>
    <template v-else>
      <h3 v-if="title" style="margin-left: 10px">{{ title }}</h3>
      <sub-form-render ref="render" v-bind="bind" v-on="$listeners" :class="{outline}"
                       :form="form" :value="value" @submit="handleSubmit" />
    </template>
  </div>

</template>

<script>
import SubFormRender from './partial/SubFormRender'

/**
 * 支持嵌套平展的子表单，支持表单的表单绑定，本身是一个标准输出组件，支持双向绑定
 */
export default {
  name: 'SubForm',
  components: {
    SubFormRender
  },
  props: {
    modal: {
      type: Boolean,
      default: true,
      description: '展示形态，默认是modal模态框'
    },
    title: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: '点击设置...'
    },
    wrap: {
      type: Boolean,
      default: true
    },
    outline: {
      type: Boolean,
      default: false,
      description: '外框线，当且仅当非modal使用'
    },
    form: {
      type: Array,
      default: () => []
    },
    value: {
      type: Object
    }
  },
  data() {
    return {
      visible: false
    }
  },
  computed: {
    bind() {
      const { id, is, ...rest } = this.$attrs
      return rest
    }
  },
  methods: {
    show() {
      this.visible = true
    },
    hide() {
      this.visible = false
    },
    submit() {
      return this.$refs.render && this.$refs.render.submit()
    },
    handleSubmit() {
      this.visible = false
    }
  }
}
</script>

<style scoped>

</style>

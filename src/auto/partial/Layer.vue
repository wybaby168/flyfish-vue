<template>
  <a-drawer v-if="type === 'drawer'" :body-style="bodyStyle" v-bind="$attrs" @close="handleClose">
    <slot name="default"></slot>
    <footer-tool-bar v-if="footer || $slots.footer" :width="$attrs.width || null" :is-mobile="false" centered>
      <slot v-if="$slots.footer" name="footer"></slot>
      <div v-else>
        <a-button v-bind="cancelButtonProps || {}" @click="$listeners.cancel">{{
            $attrs.cancelText || '取消'
          }}
        </a-button>
        <a-button v-bind="okButtonProps || {}" :loading="confirmLoading" :type="okType" @click="$listeners.cancel">
          {{ $attrs.okText || '确认' }}
        </a-button>
      </div>
    </footer-tool-bar>
  </a-drawer>
  <a-modal v-else v-bind="$attrs" v-on="$listeners" :cancel-button-props="cancelButtonProps" :cancel-text="cancelText"
           :footer="footer"
           :ok-button-props="okButtonProps" :ok-text="okText" :ok-type="okType">
    <slot name="default"></slot>
    <slot slot="footer" name="footer"></slot>
  </a-modal>
</template>

<script>
/**
 * 图层组件，用于快速适配drawer和modal
 * 以modal的时间为主，drawer模拟modal事件
 * @author wangyu
 */
import PropTypes from 'ant-design-vue/es/_util/vue-types'
import FooterToolBar from '@/components/FooterToolbar'

export default {
  name: 'Layer',
  components: { FooterToolBar },
  props: {
    type: {
      type: String,
      default: 'modal'
    },
    cancelText: PropTypes.any,
    okText: PropTypes.any,
    okButtonProps: PropTypes.object,
    cancelButtonProps: PropTypes.object,
    okType: PropTypes.string,
    confirmLoading: PropTypes.bool,
    footer: PropTypes.any,
  },
  computed: {
    bodyStyle() {
      const { type, footer, $slots: { footer: footerSlot } } = this;
      if (type === 'drawer' && (footer || footerSlot)) {
        return { paddingBottom: '50px' };
      }
      return {};
    },
  },
  methods: {
    handleClose() {
      this.$emit('cancel')
    },
  }
}
</script>

<style lang="less" scoped>
/deep/ .ant-drawer-body {
  padding-bottom: 68px;
}

</style>


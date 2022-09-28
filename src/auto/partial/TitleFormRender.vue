<template>
  <div class="form-container">
    <div v-for="group in groups" :key="group.code" class="form-group-item">
      <h3 v-if="singleTitle || groups.length > 1" class="form-container-title">{{ group.name }}</h3>
      <a-row>
        <form-render :data="data" :fields="group.form" :form="form" :wrapper="group.wrapper" />
      </a-row>
    </div>
    <div class="form-submit">
      <a-form-item v-if="!embedded" :wrapper-col="submitCol">
        <a-button type="primary" @click="handleOk">保存</a-button>
        <a-button style="margin-left: 20px" @click="handleClear">清空</a-button>
      </a-form-item>
    </div>
  </div>
</template>

<script>
import { FormRenderMixins } from '@/components/auto/mixins'

export default {
  name: 'TitleFormRender',
  mixins: [ FormRenderMixins ],
  props: {
    singleTitle: {
      type: Boolean,
      default: false,
    },
  },
}
</script>

<style lang="less" scoped>
@import "~ant-design-vue/es/style/themes/default.less";

.form-container-title {
  padding-left: 10px;
  border-left: 3px solid @primary-color
}
</style>

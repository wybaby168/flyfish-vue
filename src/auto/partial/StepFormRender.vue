<template>
  <div class="form-container">
    <a-steps :current="current" @change="change">
      <a-step v-for="(group, index) in groups" :key="group.code" :disabled="!readonly && index > current" :title="group.name" />
    </a-steps>
    <a-row v-for="(group, index) in groups" v-show="current === index" :key="group.code" :gutter="20"
           class="form-row steps-content">
      <form-render :data="data" :fields="group.form" :wrapper="group.wrapper" />
      <a-col class="form-submit" v-if="!embedded" :span="24">
        <a-form-item :wrapper-col="submitCol">
          <a-button v-if="current < groups.length - 1" type="primary" @click="next">
            下一步
          </a-button>
          <a-button
            v-if="current === groups.length - 1"
            type="primary"
            @click="handleOk"
          >
            提交
          </a-button>
          <a-button v-if="current > 0" style="margin-left: 8px" @click="prev">
            上一步
          </a-button>
        </a-form-item>
      </a-col>
    </a-row>
  </div>
</template>

<script>
import { FormRenderMixins } from '@/components/auto/mixins';

export default {
  name: 'StepFormRender',
  mixins: [FormRenderMixins],
  props: {
    current: {
      type: Number,
      default: 0
    },
    readonly: {
      type: Boolean,
      default: false,
    }
  },
  methods: {
    next() {
      this.$emit('step', this.current + 1);
    },
    prev() {
      this.$emit('step', this.current - 1);
    },
    change(value) {
      this.$emit('step', value);
    }
  }
};
</script>

<style scoped>
.steps-content {
  margin-top: 16px;
  border: 1px dashed #e9e9e9;
  border-radius: 6px;
  min-height: 300px;
  padding-top: 80px;
}

.steps-action {
  margin-top: 24px;
}
</style>

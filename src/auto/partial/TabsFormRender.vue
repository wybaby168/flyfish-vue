<template>
  <div class="form-container">
    <a-tabs :active-key="active" @change="changeTab">
      <a-tab-pane :key="group.code" :tab="group.name" v-for="group in groups" />
    </a-tabs>
    <div class="form-group-item" :key="group.code" v-show="active === group.code" v-for="group in groups">
      <keep-alive>
        <a-row :gutter="20">
          <form-render :data="data" :fields="group.form" :wrapper="group.wrapper" />
          <a-col class="form-submit" v-if="!embedded" :span="24">
            <a-form-item :wrapper-col="submitCol">
              <a-button type="primary" @click="handleOk">保存</a-button>
              <a-button style="margin-left: 20px" @click="handleClear">清空</a-button>
            </a-form-item>
          </a-col>
        </a-row>
      </keep-alive>
    </div>
  </div>
</template>

<script>
import { FormRenderMixins } from '@/components/auto/mixins';

export default {
  name: 'TabsFormRender',
  mixins: [FormRenderMixins],
  data() {
    return {
      active: ''
    };
  },
  mounted() {
    const [first = { code: '' }] = this.groups || [];
    this.active = first.code || '';
  },
  computed: {
    group() {
      const { groups = [] } = this;
      return groups[this.active];
    }
  },
  watch: {
    groups(value = []) {
      if (!this.active) {
        const [first = { code: '' }] = value;
        this.active = first.code || '';
      }
    }
  },
  methods: {
    changeTab(activeKey) {
      this.active = activeKey;
    }
  }
};
</script>

<style scoped>

</style>

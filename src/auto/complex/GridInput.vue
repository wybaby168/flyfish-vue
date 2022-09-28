<template>
  <div class="inner-collapse">
    <a-collapse v-if="groups">
      <a-collapse-panel v-for="group in groups" :key="group.code" :header="group.name">
        <sub-form :colon="false" :form="form" :modal="false" :value="data[group.code]" trigger
                  @change="data => handleGroupChange(group, data)" />
      </a-collapse-panel>
    </a-collapse>
    <sub-form v-else :colon="false" :form="form" :modal="false" :value="data" trigger @change="handleChange" />
  </div>
</template>

<script>
// 栅格布局控件
const style = {
  span: 24,
  grid: {
    label: {
      span: 7
    },
    wrapper: {
      span: 17
    }
  }
};
// 响应栅格布局
const reactiveStyle = {
  span: 8,
  grid: {
    label: {
      span: 7
    },
    wrapper: {
      span: 17
    }
  }
};

const supports = [
  {
    code: 'span',
    title: '占据栅格',
    component: 'a-slider',
    ...style,
    props: {
      min: 1,
      max: 24,
      marks: { 1: '1', 6: '6', 12: '12', 24: '24' },
      placeholder: '请输入栅格数'
    }
  },
  {
    code: 'offset',
    title: '栅格偏移',
    component: 'a-slider',
    ...style,
    props: {
      min: 0,
      max: 24,
      marks: { 0: '无', 6: '6', 12: '12', 24: '24' },
      placeholder: '请输入栅格偏移'
    }
  },
  ...['xs', 'sm', 'md', 'lg', 'xl', 'xxl'].map(code => ({
    code,
    title: code,
    ...reactiveStyle,
    component: 'a-input-number',
    props: {
      min: 1,
      max: 24,
      size: 'small'
    }
  }))
];
/**
 * 栅格设计神器
 * @author wangyu
 */
export default {
  name: 'GridInput',
  props: {
    value: {
      type: Object
    },
    groups: {
      type: Array,
      description: '分组，支持多项嵌套'
    }
  },
  data() {
    return {
      form: supports,
      values: {}
    };
  },
  computed: {
    data() {
      return this.value || {};
    }
  },
  methods: {
    handleChange(data) {
      this.$emit('change', data);
    },
    handleGroupChange(group, data) {
      const { code } = group;
      const updating = this.data;
      updating[code] = data;
      console.log(updating);
      this.$emit('change', updating);
    }
  }
};
</script>

<style lang="less" scoped>
.inner-collapse {
  /deep/ .ant-form label {
    font-size: 12px;
  }

  /deep/ .ant-form-item {
    margin-bottom: 0 !important;
  }
}
</style>

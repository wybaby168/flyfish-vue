<template>
  <a-spin :spinning="loading">
    <a-tree-select
      v-if="tree"
      v-bind="$attrs"
      v-on="listeners"
      :dropdownStyle="{ maxHeight: '400px', overflow: 'auto' }"
      :multiple="$attrs.mode === 'multiple'"
      :treeData="options"
      :treeDefaultExpandAll="expand"
      :value="data"
      @change="handleChange"
    />
    <custom-select v-else-if="!!$attrs.optionRender" v-bind="$attrs" v-on="listeners"
                   :options="options" :value="data" @change="handleChange" />
    <a-select v-else v-bind="props" v-on="listeners" :options="options" :value="data" @search="handleSearch" @change="handleChange" />
  </a-spin>
</template>

<script>
import { NetworkMixins } from '@/components/auto/mixins/network'
import CustomSelect from './partial/CustomSelect'

export default {
  name: 'NetworkSelect',
  components: { CustomSelect },
  mixins: [NetworkMixins],
  computed: {
    props() {
      return this.searchable ? {
        ...this.$attrs,
        showSearch: true,
        optionFilterProp: 'children',
      } : this.$attrs
    },
    data() {
      const { value, object, alias } = this;
      if (!value || !object) {
        return value;
      }
      const [ valueKey = 'value' ] = alias;
      if (Array.isArray(value)) {
        return object ? value.map(item => item[valueKey] || item) : value;
      }
      return object ? (value[valueKey] || value) : value;
    },
  },
  model: {
    prop: 'value',
    event: 'change',
  },
  data() {
    return {
      name: '',
    };
  },
  created() {
    if (this.searchable && !this.auto) {
      this.loadOnMount = false;
    }
  },
  props: {
    searchable: {
      type: Boolean,
      description: '是否可搜索',
      default: true
    },
    auto: {
      type: Boolean,
      description: '为搜索下拉框时，是否自动加载首批数据',
      default: true,
    },
    tree: {
      type: Boolean,
      default: false,
      description: '是否是树形结构'
    },
    expand: {
      type: Boolean,
      default: true,
      description: '是否默认展开所有树'
    },
  },
  methods: {
    handleSearch(text) {
      this.name = text;
      this.load();
    },
  },
}
</script>

<style scoped>

</style>

<template>
  <a-spin :spinning="loading" :style="$attrs.style">
    <a-cascader
      v-bind="$attrs"
      :load-data="loadData"
      :options="options"
      :value="data"
      change-on-select
      placeholder="请选择表名"
      @change="handleChange">
      <template slot="displayRender" slot-scope="{ labels, selectedOptions }">
        <span v-for="(label, index) in labels" :key="selectedOptions[index].value">
          <j-ellipsis v-if="index === 0" style="font-size: 12px" :value="label" :length="4" />
          <span style="font-size: 12px" v-else> / {{ label }}</span>
        </span>
      </template>
    </a-cascader>
  </a-spin>
</template>

<script>/**
 * 表选择器
 * 支持选择不同数据源的表
 *
 * @author wangyu
 */
import { getTableNames, loadDatasource } from '@/api/api';
import JEllipsis from '@/components/jeecg/JEllipsis';

export default {
  name: 'TablePicker',
  components: { JEllipsis },
  props: {
    value: {
      type: String,
    },
    category: {
      type: String,
      description: '数据源分层',
    },
  },
  data() {
    return {
      options: [],
      loading: true,
    };
  },
  mounted() {
    this.loadMediaSource()
      .finally(() => this.loading = false);
  },
  computed: {
    data() {
      if (!this.value) {
        return [];
      }
      return (this.value || '').split('-');
    },
  },
  methods: {
    handleChange(value) {
      console.log("####");
      console.log(value);
      const [ mediaSourceId, tableName ] = value || [];
      if (mediaSourceId && tableName) {
        this.$emit('change', `${mediaSourceId}-${tableName}`);
      }
    },
    // 加载数据源，同时，如果有数据，加载表
    async loadMediaSource() {
      // 查询数据源
      const result = await loadDatasource({ category: this.category }) || [];
      const options = result.map(({ value, label }) => ({ label, value: String(value), isLeaf: false }));
      // 尝试加载表
      const [ mediaSourceId, tableName ] = this.data;
      if (tableName) {
        const found = options.find(item => item.value === mediaSourceId);
        if (found) {
          found.children = await getTableNames(mediaSourceId) || [];
        }
      }
      this.options = options;
    },
    async loadData(selectedOptions) {
      console.log(selectedOptions)
      const targetOption = selectedOptions[selectedOptions.length - 1];
      targetOption.loading = true;
      // 取得选中的数据源，然后查询该数据源下的表
      try {
        targetOption.children = await getTableNames(targetOption.value) || [];
        this.options = [ ...this.options ];
      } finally {
        targetOption.loading = false;
      }
    },
  },
};
</script>

<style scoped>

</style>

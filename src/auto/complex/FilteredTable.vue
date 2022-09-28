<template>
  <div>
    <a-row :gutter="15">
      <a-col :span="5">
        <a-card :loading="loading" :title="filterTitle">
          <a slot="extra" @click="loadData">
            <a-icon type="sync" />
          </a>
          <a-tree
            v-if="filterType === 'normal'"
            :tree-data="treeData"
            :selected-keys="selectedKeys"
            @select="handleSelect"
          />
          <a-directory-tree
            v-if="filterType === 'directory'"
            :selected-keys="selectedKeys"
            :tree-data="treeData"
            default-expand-all
            @select="handleSelect"
          />
        </a-card>
      </a-col>
      <a-col :span="19">
        <simple-table
          ref="table"
          v-bind="$attrs"
          v-on="$listeners"
          :initial-query="mergedQuery"
          class=""
        />
      </a-col>
    </a-row>
  </div>
</template>

<script>
import SimpleTable from '@comp/auto/SimpleTable'
import { mapTree } from '@/utils/util'

export default {
  name: 'FilteredTable',
  components: { SimpleTable },
  props: {
    filterTitle: {
      type: String,
      default: '按类型筛选',
      description: '筛选标题'
    },
    filterData: {
      type: Function,
      description: '加载筛选树的方法'
    },
    filterType: {
      type: String,
      default: 'directory',
      description: 'normal,普通的节点；directory,目录树节点;'
    },
    initialQuery: {
      type: Object,
      description: '初始搜索条件'
    },
    filterField: {
      type: String,
      description: '筛选的目的查询key'
    },
    filterMapper: {
      type: Function,
      description: '数据映射，可以做禁用点击等'
    }
  },
  mounted() {
    this.loadData();
  },
  data() {
    return {
      selectedKeys: [],
      query: {},
      loading: false,
      treeData: []
    };
  },
  computed: {
    mergedQuery() {
      return {
        ...this.initialQuery,
        ...this.query
      }
    }
  },
  methods: {
    handleSelect(selectedKeys) {
      const [key] = selectedKeys;
      const exists = this.selectedKeys.includes(key);
      const currentKey = exists ? '' : key;
      this.selectedKeys = exists ? [] : selectedKeys;
      this.$emit('select', currentKey);
      this.query = {
        ...this.query,
        [this.filterField]: currentKey
      };
      this.$nextTick(() => {
        this.$refs.table.fetchRows();
      });
    },
    loadData() {
      this.loading = true
      const { filterMapper } = this
      this.filterData().then(res => {
        this.treeData = filterMapper && mapTree(res, filterMapper) || res
      }).finally(() => {
        this.loading = false
      })
    }
  },
};
</script>

<style scoped>

</style>

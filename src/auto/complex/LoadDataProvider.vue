<template>
  <div>
    <a-radio-group v-model="mode" :style="{ marginBottom: '8px' }" button-style="solid" size="small">
      <a-radio-button value="static">静态数据</a-radio-button>
      <a-radio-button value="dict">数据字典</a-radio-button>
      <a-radio-button value="dict-table">字典表</a-radio-button>
      <a-radio-button value="api">远端接口</a-radio-button>
      <a-radio-button value="lambda">函数fx</a-radio-button>
    </a-radio-group>
    <key-value-list
        v-if="mode === 'static'"
        :value="list"
        @change="handleList"
    />
    <network-select v-if="mode === 'dict'" :load-data="getDictList" :alias="['dictCode', 'title']" />
  </div>
</template>

<script>
import KeyValueList from '@/components/auto/components/KeyValueList';
import NetworkSelect from '@/components/auto/components/NetworkSelect';
import { getDictList } from '@/api/api';

/**
 * 加载数据函数提供者
 * @author wangyu
 * 本项目出现的第一个注入型组件，注入和读取js代码
 * 提供静态内容，数据字典，表取值，远端数据
 */
export default {
  name: 'LoadDataProvider',
  components: { NetworkSelect, KeyValueList },
  props: {
    value: [String, Object],
  },
  data() {
    return {
      mode: 'static',
      list: [],
    }
  },
  methods: {
    getDictList,
    handleList(list) {
      this.list = list;
      this.$emit('change', list);
    },
  }
}
</script>

<style scoped>

</style>



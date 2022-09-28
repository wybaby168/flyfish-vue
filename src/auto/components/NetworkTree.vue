<template>
  <a-spin :spinning="loading">
    <a-tree v-bind="$attrs" :tree-data="loaded" />
  </a-spin>
</template>

<script>
import { NetworkMixins } from '@/components/auto/mixins/network';

export default {
  name: 'NetworkTree',
  mixins: [NetworkMixins]
};
</script>

<style scoped>

</style>

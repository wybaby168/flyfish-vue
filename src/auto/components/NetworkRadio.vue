<template>
  <a-radio-group v-bind="$attrs" v-on="$listeners" :options="options" :value="value" @change="handleChange" />
</template>

<script>
import { NetworkMixins } from '@/components/auto/mixins/network'

export default {
  name: 'NetworkRadio',
  mixins: [ NetworkMixins ]
}
</script>

<style scoped>

</style>

<template>
  <keep-alive>
    <component
      :is="component"
      v-bind="$attrs">
      <slot></slot>
      {{ children }}
    </component>
  </keep-alive>
</template>

<script>
export default {
  name: 'ComponentWrapper',
  props: {
    component: {
      type: String
    },
    children: {
      type: String
    }
  }
};
</script>

<style scoped>

</style>

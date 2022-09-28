<template>
  <input :value="value" type="hidden" />
</template>

<script>
export default {
  name: 'InputHidden',
  props: {
    value: {
      type: String
    }
  }
};
</script>

<style scoped>

</style>

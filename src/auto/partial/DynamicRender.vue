<script>
export default {
  name: "DynamicRender",
  props: {
    provider: {
      type: Function,
    },
    data: {
      type: Object,
    },
    handleChange: {
      type: Function,
    }
  },
  render() {
    const h = this.$createElement;
    return this.provider(h, this.data, this.handleChange);
  }
}
</script>

<style scoped>

</style>
<script>
export default {
  name: 'CardWrapper',
  props: {
    wrap: {
      type: Boolean,
      description: '是否包装',
      default: true
    }
  },
  methods: {
    renderChildren() {
      return this.$children.map(component => component.render());
    }
  },
  render() {
    const { wrap, $attrs } = this;
    return wrap ? <ACard {...$attrs}>{this.$slots.default}</ACard> : <div>{this.$slots.default}</div>;
  }
};
</script>

<style scoped>

</style>

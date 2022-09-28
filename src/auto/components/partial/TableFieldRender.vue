<script>
import AsyncDisplay from '@/components/AsyncDisplay'
import { isNature } from '@/utils/matcher'

export default {
  name: 'TableFieldRender',
  components: { AsyncDisplay },
  props: {
    customRender: {
      type: Function
    }
  },
  render(h) {
    const { text, record, index } = this.$attrs
    return <div>{this.customRender && this.customRender(text, record, index, h) || (isNature(text) ? text : '暂无数据')}</div>
  }
}
</script>

<style scoped>

</style>

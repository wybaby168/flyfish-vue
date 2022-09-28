<template>
  <a-input v-if="type === 'input'" v-bind="this.$attrs" :value="data" @change="handleChange">
    <a-popover slot="suffix" v-model="visible" placement="top" trigger="click">
      <template slot="content">
        <a-textarea v-bind="this.$attrs" :rows="5" :value="data" style="width: 300px" @change="handleChange" />
      </template>
      <template slot="title">
        <span>填写对象，支持json</span>
        <span class="close-icon" @click="handleClose"><a-icon title="关闭" type="close" /></span>
      </template>
      <a-icon class="full-screen-icon" type="fullscreen" @click="handleFull" />
    </a-popover>
  </a-input>
  <key-value-list v-else :draggable="false" :placeholder="placeholder" :value="values"
                  :value-only="valueOnly" @input="handleValueChange" />
</template>

<script>
import KeyValueList from '@/components/auto/components/KeyValueList'

/**
 * 对象输入框
 * @author wangyu
 * 可以输入对象
 */
export default {
  name: 'ObjectInput',
  components: { KeyValueList },
  props: {
    value: {
      type: [String, Object, Array],
    },
    type: {
      type: String,
      default: 'input',
      description: '支持input、list'
    },
    valueOnly: {
      type: Boolean,
      default: false,
      description: '视图是否仅支持修改值'
    },
    placeholder: {
      type: [Array, String]
    }
  },
  data() {
    let { value } = this;
    if (value && typeof value === 'string') {
      try {
        value = JSON.parse(value);
      } catch (e) {
        // nothing
      }
    }
    return {
      data: this.transform(value),
      values: this.map(value),
      visible: false,
      dirty: false
    };
  },
  watch: {
    value(value) {
      this.data = this.transform(value)
      this.values = this.map(value)
    }
  },
  methods: {
    handleFull() {

    },
    handleValueChange(values) {
      this.values = values
      const trigger = this.$listeners.change ? 'change' : 'input';
      this.$emit(trigger, values.reduce((result, item) => {
        result[item.code] = item.name
        return result
      }, {}))
    },
    transform(value) {
      return value && JSON.stringify(value) || '{}'
    },
    map(value) {
      return value && Object.keys(value).map(key => ({ code: key, name: value[key] })) || []
    },
    handleChange(e) {
      this.data = e.target.value
      try {
        const parsed = JSON.parse(this.data)
        this.$emit('input', parsed)
        this.dirty = false
      } catch (e) {
        this.dirty = true
      }
    },
    handleClose() {
      this.visible = false
    }
  },
};
</script>

<style scoped>
.full-screen-icon {
  cursor: pointer;
}

.close-icon {
  float: right;
  cursor: pointer;
}
</style>

<template>
  <div v-bind="$attrs">
    <draggable
      :animation="100"
      :list="values"
      :prevent-on-filter="false"
      easing="cubic-bezier(1, 0, 0, 1)"
      filter="input"
      handle=".drag-handler"
      tag="div"
      @end="handleDrop"
    >
      <div v-for="(item, index) in values" :key="index">
        <a-icon class="drag-handler" type="bars" />
        <a-input-group class="list-inputs" compact>
          <a-input :placeholder="placeholder" :value="item" :class="{'list-input': true, limited: limit}"
                   @change="e => handleChange(e.target.value, index)" />
          <a-button v-if="!limit" icon="minus" shape="circle" type="danger" @click="handleRemove(index)" />
        </a-input-group>
      </div>
    </draggable>
    <a-button v-if="!limit" icon="plus" type="link" @click="handleCreate">添加项</a-button>
  </div>
</template>

<script>

import Draggable from 'vuedraggable'

/**
 * 列表输入框
 */
export default {
  name: 'ListInput',
  components: { Draggable },
  props: {
    value: {
      type: Array
    },
    trigger: {
      type: String,
      default: 'change'
    },
    placeholder: {
      type: String,
      default: '请输入值'
    },
    limit: {
      type: Number,
      default: 0,
      description: '限制大小'
    }
  },
  data() {
    return {
      values: this.limit ? new Array(this.limit).fill('') : [],
    }
  },
  watch: {
    value(value) {
      const computing = value || [];
      this.values = this.limit ? computing.slice(-this.limit) : computing;
    }
  },
  computed: {
    currentValue() {
      return this.value || []
    }
  },
  methods: {
    handleChange(item, index) {
      this.$emit(this.trigger, this.values.map((value, i) => i === index ? item : value))
    },
    handleCreate() {
      this.$emit(this.trigger, [...this.values, ''])
    },
    handleRemove(index) {
      this.$emit(this.trigger, this.values.filter((_, i) => index !== i))
    },
    handleDrop() {
      this.$emit(this.trigger, [...this.values])
    }
  }
}
</script>

<style scoped>
.list-input {
  width: calc(100% - 31px);
  margin-bottom: 10px;
}
.list-input.limited {
  width: 100%;
}

.drag-handler {
  display: inline-block;
  font-size: 20px;
  line-height: 35px;
  width: 35px;
  height: 35px;
  cursor: move;
}

.list-inputs {
  display: inline-block;
  width: calc(100% - 35px);
}

.list-input /deep/ .ant-btn-danger {

}
</style>

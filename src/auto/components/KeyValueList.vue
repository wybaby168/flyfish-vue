<template>
  <div>
    <div ref="root" class="key-value-list" :class="{draggable, valueOnly}">
      <div v-for="(item, index) in value" :key="mapping[item[keyProp]] || item[keyProp]">
        <a-icon v-if="draggable" class="drag-handler" type="bars" />
        <a-input-group class="list-inputs" compact>
          <a-input :disabled="valueOnly" :placeholder="placeholder[0]" :value="item[keyProp]" class="list-input"
                   @change="e => handleChange(keyProp, e, index)" />
          <a-input :placeholder="placeholder[1]" :value="item[valueProp]" class="list-input"
                   @change="e => handleChange(valueProp, e, index)" />
          <a-button icon="minus" shape="circle" type="danger" @click="handleRemove(index)" />
        </a-input-group>
      </div>
    </div>
    <template v-if="!valueOnly">
      <a-button icon="plus" type="link" @click="handleCreate">添加项</a-button>
      <span style="float: right">请点击<span style="color: #0eb2ff">添加项</span>添加新的键值对</span>
    </template>
  </div>
</template>

<script>
import Sortable from 'sortablejs';
import { generateUUID } from '@/utils/util';

/**
 * 键值对维护列表
 */
export default {
  name: 'KeyValueList',
  props: {
    value: {
      type: Array,
    },
    keyProp: {
      type: String,
      default: 'code',
    },
    valueProp: {
      type: String,
      default: 'name',
    },
    triggerChange: {
      type: Boolean,
      default: false,
    },
    placeholder: {
      type: Array,
      default: () => [ '请输入键', '请输入值' ],
    },
    draggable: {
      type: Boolean,
      default: true,
    },
    valueOnly: {
      type: Boolean,
      default: false,
      description: '视图是否仅支持修改值'
    },
  },
  data() {
    return {
      mapping: {},
      counter: 1,
    };
  },
  mounted() {
    this.handleWrapKey(this.value);
    this.initializeDrag();
  },
  watch: {
    value(value) {
      this.handleWrapKey(value);
    }
  },
  computed: {
    event() {
      return this.triggerChange ? 'change' : 'input';
    }
  },
  methods: {
    handleChange(key, e, index) {
      const item = this.value[index];
      const value = e.target.value;
      // 改的是key字段，重定义id映射
      if (key === this.keyProp) {
        this.handleKeyChange(item, value);
      }
      item[key] = value;
      this.$emit(this.event, [ ...(this.value || []) ]);
    },
    handleCreate() {
      const { keyProp, valueProp } = this;
      const key = `var${this.counter++}`;
      // 填充mapping以保证可存
      if (!this.mapping[key]) {
        this.mapping[key] = generateUUID();
      }
      this.$emit(this.event, [ ...this.value || [], { [keyProp]: key, [valueProp]: '' } ]);
    },
    handleKeyChange(item, value) {
      // 之前的key
      const pre = item[this.keyProp];
      // 之前的id标记
      const origin = this.mapping[pre];
      // 没有下标，直接赋值
      if (origin) {
        delete this.mapping[pre];
        this.mapping[value] = origin;
      } else {
        this.mapping[value] = generateUUID();
      }
    },
    handleWrapKey(value) {
      if (value && value.length) {
        value.forEach(item => {
          const key = item[this.keyProp];
          if (!this.mapping[key]) {
            this.mapping[key] = generateUUID();
          }
        });
      }
    },
    handleRemove(index) {
      const key = this.value[index][this.keyProp];
      delete this.mapping[key];
      this.$emit(this.event, (this.value || []).filter((item, i) => i !== index));
    },
    initializeDrag() {
      Sortable.create(this.$refs.root, {
        filter: 'input',
        handle: '.drag-handler',
        preventOnFilter: false,  // 设置这个属性，防止input输入时间被prevent掉，这个属于原生事件
        onEnd: this.handleDrop,
        animation: 100,
        easing: 'cubic-bezier(1, 0, 0, 1)',
      });
    },
    handleDrop(context) {
      const { newIndex, oldIndex } = context;
      const value = this.value || [];
      const currRow = value.splice(oldIndex, 1)[0];
      value.splice(newIndex, 0, currRow);
      this.$emit(this.event, [ ...value ]);
    },
  },
};
</script>

<style scoped>
.list-input {
  width: calc(50% - 16px);
  margin-bottom: 10px;
}

.drag-handler {
  font-size: 20px;
  line-height: 35px;
  width: 35px;
  height: 35px;
  cursor: move;
}

.draggable .list-inputs {
  width: calc(100% - 35px);
}

.list-inputs {
  width: 100%;
}
</style>

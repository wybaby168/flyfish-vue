<template>
  <div>
    <a-radio-group v-if="types.length > 1" v-model="current" size="small" style="margin-bottom: 16px">
      <a-radio-button v-for="type in types" :key="type" :value="type">
        {{ typeMap[type].name }}
      </a-radio-button>
    </a-radio-group>
    <keep-alive>
      <component
        :is="component.component"
        v-bind="bind"
        @change="handleChange"
      />
    </keep-alive>
  </div>
</template>

<script>
import isFunction from 'lodash.isfunction';

const typeMap = {
  String: {
    name: '字符串',
    component: 'a-input',
    props: {
      placeholder: '请输入字符串值'
    }
  },
  Number: {
    name: '数字',
    component: 'a-input-number',
    props: {
      placeholder: '请输入数字值'
    }
  },
  Object: {
    name: '对象',
    component: 'object-input',
    props: {
      placeholder: '请输入对象值'
    }
  },
  Boolean: {
    name: '布尔',
    component: 'a-switch',
    model: 'checked'
  },
  Array: {
    name: '数组',
    component: 'editable-table'
  },
  Function: {
    name: '函数',
    component: 'span'
  }
};
/**
 * 一个代理的输入框，支持任意类型
 * @author wangyu
 * 智能根据props列举支持的属性，显示tab项和对应的输入框
 */
export default {
  name: 'DelegateInput',
  props: {
    prop: {
      type: [Object, String, Array, Function],
      description: '输入属性配置'
    },
    value: {
      type: [Object, Number, Boolean, String, Array, Function],
      description: '实际的数据'
    }
  },
  data() {
    return {
      // 支持的类型
      types: [],
      // 类型映射
      typeMap,
      // 当前类型
      current: null,
      // 数据
      data: null
    };
  },
  mounted() {
    this.parseTypes(this.prop);
    this.data = this.value;
  },
  computed: {
    component() {
      const current = this.current || 'String';
      return typeMap[current] || typeMap.String;
    },
    bind() {
      const { props, model = 'value' } = this.component;
      return {
        ...props,
        [model]: this.data
      };
    }
  },
  watch: {
    prop(value) {
      this.parseTypes(value);
    },
    value(value) {
      if (value === true) {
        // debugger;
        console.log(value);
      }
      this.data = value;
    }
  },
  methods: {
    parseTypes(prop) {
      if (typeof prop === 'string') {
        this.types = [prop];
      } else if (typeof prop === 'function') {
        this.types = [prop.name];
      } else if (Array.isArray(prop)) {
        this.types = prop.map(item => item.name);
      } else {
        this.types = (isFunction(prop.type) ? [prop.type] : prop.type || [String])
          .map(type => type.name);
      }
      this.current = this.types[0] || 'String';
    },
    handleChange(e) {
      let value;
      if (e instanceof Event) {
        value = e.target.value;
      } else {
        value = e;
      }
      this.$emit('change', value);
    }
  }
};
</script>

<style scoped>

</style>

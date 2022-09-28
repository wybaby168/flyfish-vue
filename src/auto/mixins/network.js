import debounce from 'lodash.debounce';
import { message as $message } from 'ant-design-vue';
import { mapTree } from '@/utils/util';

const ignore = () => {};
const supports = ['change', 'input'];

export const NetworkMixins = {
  props: {
    loadData: {
      type: Function
    },
    hook: {
      type: Function,
      description: '钩子，用于回显静态内容'
    },
    value: {
      type: [String, Array, Number, Object],
      description: '值'
    },
    alias: {
      type: Array,
      default: () => [],
      description: '别名'
    },
    trigger: {
      type: String,
      default: 'input',
      description: '触发事件',
    },
    object: {
      type: Boolean,
      default: false,
      description: '是否选择到对象'
    },
    bare: {
      type: Boolean,
      default: false,
      description: '是否是裸请求，如果是，自动解包'
    }
  },
  data() {
    return {
      loaded: [],
      load: null,
      loading: false,
      loadOnMount: true,
    };
  },
  mounted() {
    this.load = debounce(this.loadOptions, 500);
    if (this.loadOnMount) {
      this.load();
    }
  },
  computed: {
    options() {
      if (this.alias && this.alias.length) {
        const [valueName, textName] = this.alias;
        return mapTree(this.loaded || [], item => ({ ...item, value: item[valueName], label: item[textName] }));
      }
      return this.loaded;
    },
    dict() {
      const [ valueKey = 'value' ] = this.alias;
      return (this.loaded || []).reduce((result, item) => {
        const { [valueKey]: value } = item;
        result[value] = item;
        return result;
      }, {});
    },
    nameKey() {
      if (this.alias && this.alias.length) {
        const [,, nameKey] = this.alias;
        return nameKey || 'name';
      }
      return 'name'
    },
    listeners() {
      const { change, input, ...rest } = this.$listeners;
      ignore(change, input);
      return rest;
    },
    triggers() {
      return supports.filter(key => this.$listeners[key]);
    }
  },
  watch: {
    loadData() {
      this.load();
    },
    '$route'(to) {
      this.load();
    },
  },
  methods: {
    loadOptions() {
      const { hook, name } = this;
      if (this.loadData) {
        this.loading = true;
        const result = name ? this.loadData({ [this.nameKey]: name }) : this.loadData();
        if (result.then) {
          result.then(res => {
            if (this.bare) {
              const { success, result = [], message = '尝试请求下拉框数据失败！' } = res;
              if (success) {
                this.loaded = result || [];
              } else {
                $message.error(message);
              }
            } else {
              this.loaded = res || [];
            }
            if (hook) {
              hook(this.display);
            }
          }).finally(() => {
            this.loading = false;
          })
        } else {
          this.loaded = result || [];
          this.loading = false;
        }
      }
    },
    // 值显示钩子
    display(id) {
      if (this.loaded) {
        return this.loaded.filter(item => item.value === id)[0];
      }
      return id;
    },
    // 找到值
    pickValue(value) {
      if (!value || !this.object) {
        return value;
      } else {
        const dict = this.dict;
        const [ valueKey = 'value' ] = this.alias;
        if (Array.isArray(value)) {
          const mapped = value.filter(a => !!a).map(key => dict[key] || { [valueKey]: key });
          return this.object ? mapped : value;
        } else {
          return this.object ? (dict[value] || { [valueKey]: value }) : value;
        }
      }
    },
    // 处理变更，自动映射实体
    handleChange(value) {
      const mapped = this.pickValue(value);
      // 存在指定的监听器，直接激活处理
      if (this.triggers.length) {
        this.triggers.forEach(trigger => this.$emit(trigger, mapped));
      } else {
        // 常规操作，支持自定义事件
        this.$emit(this.trigger, mapped);
      }
    },
  }
}

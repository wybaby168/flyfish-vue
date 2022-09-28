import isFunction from 'lodash.isfunction';
import { match } from '@/utils/matcher';
import { valueof } from '@/utils/util';

/**
 * 转换器表单选项
 * 声明，以便于维护
 * @author wangyu
 */
class AutoFormOptions {

  // 当前所属视图
  view;

  // 表单编码，存储数据的key
  code;
  // 显示名称，这个名称是输入框的label
  title = '';
  // 组件，标识使用的组件
  component;
  // 占据栅格，用于表单布局
  span = 12;
  // 栅格偏移，布局需要
  offset = 0;
  // 栅格布局
  grid = {};
  // 儿子，手动指定儿子们
  children;
  // 条件，用于匹配条件以显示与否
  condition;
  // 校验规则，允许多个
  validation;
  // 选项，用于表单的额外选项，支持antd vue的所有逻辑
  options = {};
  // 组件属性，支持对象
  props;
  // 表单联动，key为表单组件的属性，包含两种模式，condition是激活条件，value是激活的值
  links;
  // 事件支持
  events;
  // 映射支持
  mapping;
  // 异步的props
  delay;
  // 分组
  group;
  // 新增，增加反馈状态
  feedback = false;
  // 新增，增加额外描述
  extra;
  // 新增，额外的复杂帮助，在tooltip弹出
  tips;

  constructor(obj, parent = {}) {
    const { layout: { span: defaultSpan = 12, offset: defaultOffset = 0, wrapper, label } = {} } = parent;
    const {
      code, title, component, span = defaultSpan, offset = defaultOffset,
      grid, condition, children, validation, options, props = {},
      events, links, mapping, delay, group, feedback, extra, tips
    } = obj;
    this.code = code;
    this.feedback = feedback;
    this.extra = extra;
    this.tips = tips;
    this.title = title;
    this.component = component;
    this.span = span;
    this.offset = offset;
    this.condition = condition;
    this.validation = validation;
    this.children = children;
    this.options = options;
    this.events = events || {};
    this.props = props || {};
    this.grid = grid || { wrapper, label };
    this.links = links;
    this.mapping = mapping;
    this.delay = delay;
    this.group = group;
  }

  /**
   * 根据数据，获得当前对象可见性
   */
  visible(data) {
    const { condition } = this;
    if (!condition) {
      return true;
    }
    return isFunction(condition) ? condition(data) : match(data, condition);
  }

  /**
   * 取得当前配置的装饰配置，自动解析
   */
  decorator(data = {}) {
    const { validation, code, options } = this;
    let rules = validation || [];
    if (validation) {
      if (isFunction(validation)) {
        rules = validation(data);
      }
    }
    const other = isFunction(options) ? options(data) : options;
    const { initialValue, ...rest } = other || {};
    return [code, { rules, initialValue: valueof(initialValue), ...rest }];
  }

  /**
   * 合并props的方法，提供插入
   * @param data 当前数据
   * @returns {{}} props结果，最终属性
   */
  merge(data) {
    const { links, props = {} } = this;
    const parsedProps = isFunction(props) ? props(data) : props;
    if (links) {
      // 动态合并props
      const merging = Object.keys(links).reduce((result, key) => {
        const { condition = {}, value } = links[key];
        const matched = isFunction(condition) ? condition(data) : match(data, condition);
        // 判断匹配性，合并入props
        if (matched) {
          result[key] = isFunction(value) ? value(data) : (value || '');
        }
        return result;
      }, {});
      return { ...parsedProps, ...merging };
    }
    return parsedProps || {};
  }
}

/**
 * 承载所有配置的类
 * @author wangyu
 */
export default class AutoFormConfig {

  // 转换器名称
  name;

  // 转换器编号
  code;

  // 描述
  description;

  // 表单配置
  form = [];

  // 分组们，包含标识和名称
  groups = [];

  // 表单样式，支持default， tabs， step
  type = 'default';

  // 宽度
  width;

  // 默认布局
  layout = {};

  // 转换器
  transformer = {};

  // 表单包装器
  wrapper = null;

  /**
   * 构造器
   * @param props 属性
   */
  constructor(props) {
    const { form = [], wrapper, name, width = 1200, code, groups, description, type, transformer, layout } = props;
    this.width = width;
    this.wrapper = wrapper;
    this.name = name;
    this.code = code;
    this.type = type;
    this.groups = groups;
    this.layout = layout;
    this.description = description;
    this.transformer = transformer;
    this.form = form.map(item => new AutoFormOptions(item, this));
  }

  /**
   * 静态构造
   * @param props 属性
   * @returns {AutoFormConfig}
   */
  static of(props) {
    return new AutoFormConfig(props);
  }

}

AutoFormConfig.AutoFormOptions = AutoFormOptions;

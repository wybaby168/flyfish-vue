import isFunction from 'lodash.isfunction';
import { match } from '@/utils/matcher';

/**
 * 详情表单选项
 * 声明，以便于维护
 * @author wangyu
 */
class DetailFormOptions {

  // 表单编码，存储数据的key
  code;
  // 显示名称，这个名称是输入框的label
  title = '';
  // 组件，标识使用的组件，这里只有包裹组件
  component;
  // 联动，值的静态联动
  links;
  // 占据栅格，用于表单布局。不同于form，这个是实际的占用列数，而非栅格数
  span = 1;
  // 儿子，手动指定儿子们
  children;
  // 条件，用于匹配条件以显示与否
  condition;
  // 组件属性，支持对象
  props;
  // 主动渲染方法，支持复杂的渲染，暂时只支持文本
  render;
  // 分组
  group;
  // 日期格式
  dateFormat;

  constructor(obj) {
    const { code, title, component, links, span = 1, condition, children, props = {}, render, group, dateFormat } = obj;
    this.render = render;
    this.code = code;
    this.title = title;
    this.component = component;
    this.span = span;
    this.links = links;
    this.condition = condition;
    this.children = children;
    this.props = props || {};
    this.group = group;
    this.dateFormat = dateFormat;
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
        // console.log(JSON.stringify(condition), JSON.stringify(data), value);
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
export default class DetailFormConfig {

  // 详情名称
  name;

  // 详情编号
  code;

  // 模式，支持modal和drawer
  mode = 'modal';

  // 分组类型，支持title和tabs
  type = 'title';

  // 描述
  description;

  // 默认三列布局。注意，这里直接定义列
  column = 3;

  // 表单配置
  form = [];

  // 异步变量池，懒加载模式，可在render函数随意使用，注意判空
  lazy = {};

  // 分组们，包含标识和名称
  groups = [];

  /**
   * 构造器
   * @param props 属性
   */
  constructor(props) {
    const { form = [], mode, type, name, code, groups, description, column, lazy } = props;
    this.form = form.map(item => new DetailFormOptions(item));
    this.groups = groups;
    this.type = type;
    this.mode = mode;
    this.name = name;
    this.code = code;
    this.description = description;
    this.column = column;
    this.lazy = lazy;
  }

  /**
   * 静态构造
   * @param props 属性
   * @returns {DetailFormConfig}
   */
  static of(props) {
    return new DetailFormConfig(props);
  }

}

DetailFormConfig.DetailFormOptions = DetailFormOptions;

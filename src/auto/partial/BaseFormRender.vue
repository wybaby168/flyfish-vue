<script>
import GridInput from '@/components/auto/complex/GridInput'
import GeneratedInput from '@/components/generator/GeneratedInput'
import DelegateInput from '@/components/auto/components/DelegateInput'
import StrengthInput from '@/components/tools/StrengthInput'
import ValidationInput from '@/components/auto/complex/ValidationInput'
import JCodeEditor from '@/components/jeecg/JCodeEditor';
import JCron from '@/components/jeecg/JCron';
import isFunction from 'lodash.isfunction'

/**
 * 表单核心渲染逻辑，使用jsx增加扩展性
 * 重构了底层，支持自定义包装器
 * @author wangyu
 */
export default {
  name: 'FormRender',
  components: { GeneratedInput, GridInput, DelegateInput, StrengthInput, ValidationInput, JCodeEditor, JCron },
  props: {
    fields: {
      type: Array
    },
    data: {
      type: Object
    },
    wrapper: {
      type: Function,
    }
  },
  data() {
    return {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 5 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 }
      }
    }
  },
  methods: {
    renderChildren(children, data) {
      const createElement = this.$createElement;
      return isFunction(children) ? children(createElement, data) : children
    },
    renderLabel(title, tips) {
      if (title) {
        return (
          <span slot="label">{title}
            {
              tips ? (
                <a-tooltip placement="bottom">
                  <pre slot="title" class="tips">{tips}</pre>
                  <a>
                    <a-icon type="question-circle" />
                  </a>
                </a-tooltip>
              ) : null
            }
          </span>
        )
      }
      return null
    },
    renderComponent(item) {
      const { data, renderChildren } = this;
      const { component = 'a-input', children, code, events = {} } = item;
      const createElement = this.$createElement;
      const props = item.merge(data);
      const { 'class': className, style, ...restProps } = props;
      const context = {
        attrs: {
          code,
          ...restProps,
        },
        ...(className ? { class: className } : {}),
        ...(style ? { style } : {}),
        directives: [
          {
            name: 'decorator',
            value: item.decorator(data),
          }
        ],
        on: isFunction(events) ? events(data) : events
      };
      return createElement(component, context, renderChildren(children, data))
    },
    renderInner(item) {
      const { labelCol, wrapperCol, renderLabel } = this
      const {
        title,
        grid: { label, wrapper } = {},
        component,
        extra,
        feedback,
        tips,
      } = item
      const emptyCls = component === 'input-hidden' ? 'empty' : '';
      return (
        <a-form-item class={emptyCls} extra={extra} hasFeedback={feedback} labelCol={label || labelCol}
                     wrapperCol={wrapper || wrapperCol}
        >
          {renderLabel(title, tips)}
          <keep-alive>
            {this.renderComponent(item)}
          </keep-alive>
        </a-form-item>
      )
    },
    renderField(item) {
      const { renderInner } = this
      const {
        code,
        span = 12,
        offset = 0,
      } = item
      return (
        <a-col key={code} offset={offset} span={span}>
          {renderInner(item)}
        </a-col>
      )
    }
  },
  render() {
    const { renderField, renderInner, data, fields, wrapper } = this
    if (wrapper) {
      return wrapper(fields, renderInner)
    }
    const filtered = fields.filter(item => item.visible(data));
    return (
      <div>
        {filtered.map(renderField)}
      </div>
    )
  }
}
</script>

<style scoped>
.ant-row.ant-form-item.empty {
  margin: 0 !important;
  display: none;
}
</style>

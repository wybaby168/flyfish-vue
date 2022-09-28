<script>
import isFunction from 'lodash.isfunction';
import groupBy from 'lodash.groupby';
import get from 'lodash.get';
import set from 'lodash.set';
import ComponentWrapper from '@/components/auto/components/ComponentWrapper';
import DetailFormConfig from '@/components/auto/model/details';
import moment from 'moment';
import Layer from '@/components/auto/partial/Layer'

export default {
  name: 'AutoFormDetail',
  components: {
    Layer,
    ComponentWrapper
  },
  props: {
    // 组件标识，会到服务端寻址，存在缓存
    config: {
      type: Object,
      description: '表单配置',
      default: () => ({})
    },
    title: {
      type: String,
      default: '设置平台配置'
    },
    layout: {
      type: String,
      default: 'horizontal'
    },
    loadData: {
      type: [ Function, Object ],
      description: '加载数据的方法'
    }
  },
  data() {
    return {
      get,
      parsedConfig: {},
      visible: false,
      data: {},
      external: {},
      query: {}
    };
  },
  mounted() {
    this.parsedConfig = DetailFormConfig.of(this.config);
    this.loadExternal();
  },
  computed: {
    form() {
      return this.parsedConfig.form || [];
    },
    // 分组，这里的分组是综合各因素后产生的。默认仅一个分组
    groups() {
      const { groups = [], form = [], column: globalColumn } = this.parsedConfig || {};
      if (groups.length) {
        const group = groupBy(form, 'group');
        const result = groups.map(({ name, code, condition, render, column = globalColumn }) => {
          return {
            code,
            name,
            condition,
            column,
            render,
            form: group[code]
          };
        }).filter(({ form: groupForm, render: groupRender }) => groupForm && groupForm.length || groupRender);
        if (result.length) {
          return result;
        }
      }
      return [ { form } ];
    }
  },
  watch: {
    loadData() {
      this.fetchData();
    },
    config(value) {
      this.parsedConfig = DetailFormConfig.of(value);
      this.loadExternal();
    }
  },
  methods: {
    show(record) {
      this.query = record;
      this.visible = true;
      // 尝试拉取数据，同时更新加载的额外数据源
      this.fetchData().then(() => this.loadExternal());
    },
    loadExternal() {
      const { lazy = {} } = this.parsedConfig;
      Object.keys(lazy).forEach(key => {
        const { [key]: method } = lazy;
        const result = method(this.data);
        if (result.then) {
          result.then(res => {
            set(this.external, key, res);
            this.$forceUpdate();
          });
        } else {
          set(this.external, key, result);
          this.$forceUpdate();
        }
      });
    },
    handleClose() {
      this.visible = false;
      this.data = {};
    },
    renderField(item) {
      const { data, external } = this;
      const attrs = { ...data, ...external };
      const value = get(attrs, item.code);
      if (item.render) {
        return item.render(value, attrs, this.$createElement);
      } else {
        if (item.dateFormat) {
          return moment(value).format(item.dateFormat);
        } else {
          return value;
        }
      }
    },
    renderContent() {
      // 渲染
      if (this.config.type === 'tabs') {
        return this.renderTab();
      }
      return this.renderTitle();
    },
    renderTitle() {
      const { groups, data, external, parsedConfig, layout } = this;
      const attrs = { ...data, ...external };
      return groups.filter(({ condition }) => !condition || condition(attrs)).map((group, index) => (
          <div key={group.code}>
            {
              group.render ? (
                  <div class="ant-descriptions ant-descriptions-bordered">
                    <div class="ant-descriptions-title">{group.name}</div>
                    <div class="ant-descriptions-view">
                      {group.render(this.$createElement, attrs)}
                    </div>
                  </div>
              ) : (
                  <ADescriptions layout={layout} bordered column={group.column || parsedConfig.column || 3}
                                 title={group.name}>
                    {
                      (group || []).form.filter(item => item.visible(attrs)).map(item => (
                          <ADescriptionsItem span={item.span || 1} key={item.code} label={item.title}>
                            {item.component ? (
                                <ComponentWrapper
                                    component={item.component}
                                    children={`${this.renderField(item) || ''}${item.children || ''}`}
                                    {...item.merge(attrs)}
                                />
                            ) : this.renderField(item)}
                          </ADescriptionsItem>
                      ))
                    }
                  </ADescriptions>
              )
            }
            {index !== groups.length - 1 ? <ADivider/> : ''}
          </div>
      ));
    },
    renderTab() {
      const { groups, data, external, parsedConfig, layout } = this;
      const attrs = { ...data, ...external };
      return (
          <ATabs>
            {
              groups.filter(({ condition }) => !condition || condition(attrs)).map((group, index) => (
                  <a-tab-pane key={group.code} tab={group.name}>
                    {
                      group.render ? (
                          <div class="ant-descriptions ant-descriptions-bordered">
                            <div class="ant-descriptions-view">
                              {group.render(this.$createElement, attrs)}
                            </div>
                          </div>
                      ) : (
                          <ADescriptions layout={layout} bordered column={group.column || parsedConfig.column || 3}>
                            {
                              (group || []).form.filter(item => item.visible(attrs)).map(item => (
                                  <ADescriptionsItem span={item.span || 1} key={item.code} label={item.title}>
                                    {item.component ? (
                                        <ComponentWrapper
                                            component={item.component}
                                            children={`${this.renderField(item) || ''}${item.children || ''}`}
                                            {...item.merge(attrs)}
                                        />
                                    ) : this.renderField(item)}
                                  </ADescriptionsItem>
                              ))
                            }
                          </ADescriptions>
                      )
                    }
                    {index !== groups.length - 1 ? <ADivider/> : ''}
                  </a-tab-pane>
              ))
            }
          </ATabs>
      );
    },
    async fetchData() {
      const { loadData } = this;
      if (isFunction(loadData)) {
        const { success = false, result = {}, message = '系统发生未知异常！' } = await loadData(this.query) || {};
        if (!success) {
          this.$message.error(message);
        }
        this.data = success ? result : {};
      } else {
        this.data = loadData || {};
      }
    }
  },
  render() {
    const { title, visible, handleClose, parsedConfig: { mode = 'modal' } = {} } = this;
    return mode === 'modal' || mode === 'drawer' ? (
        <Layer
            type={mode}
            title={title}
            visible={visible}
            width={1000}
            vOn:cancel={handleClose}
            vOn:ok={handleClose}>
          {mode === 'modal' ?
              <AButton slot="footer" key="submit" vOn:click={handleClose} type="primary">关闭</AButton> : null}
          {this.renderContent()}
        </Layer>
    ) : this.renderContent()
  }
};
</script>

<style scoped>

</style>

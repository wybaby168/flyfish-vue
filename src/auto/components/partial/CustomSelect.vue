<script>
import groupBy from 'lodash.groupby';
import { Select as ASelect } from 'ant-design-vue';

const { OptGroup: ASelectOptGroup, Option: ASelectOption } = ASelect;

export default {
  name: 'CustomSelect',
  props: {
    optionRender: {
      type: Function,
      description: '选项渲染方法，jsx'
    },
    options: {
      type: Array,
      description: '拦截的options'
    },
    groups: {
      type: Array,
      description: '分组'
    },
    groupAttr: {
      type: String,
      default: 'group',
      description: '分组字段'
    }
  },
  methods: {
    filterOption(input, option) {
      const { componentOptions: { propsData: { label = '' } = {} } } = option;
      return label.toLowerCase().indexOf(input.toLowerCase()) >= 0;
    }
  },
  render(h) {
    const attrs = this.$attrs;
    const listeners = this.$listeners;
    const props = {
      props: attrs,
      on: listeners
    };
    const { optionRender = a => a, options, groups, groupAttr = 'group' } = this;
    const grouped = groupBy(options, groupAttr);
    return (
      <ASelect {...props} optionLabelProp="label" showSearch filterOption={this.filterOption}>
        {
          groups && groups.length ? groups.map(([name, value, icon]) => (
            <ASelectOptGroup key={value}>
              <span slot="label">{icon ? <AIcon type={icon} /> : ''} {name}</span>
              {(grouped[value] || []).map(option => (
                <ASelectOption key={option.value} value={option.value} label={option.label}>
                  {optionRender(h, option)}
                </ASelectOption>
              ))}
            </ASelectOptGroup>
          )) : options.map(option => (
            <ASelectOption key={option.value} value={option.value} label={option.label}>
              {optionRender(h, option)}
            </ASelectOption>
          ))
        }
      </ASelect>
    );
  }
};
</script>

<style scoped>

</style>

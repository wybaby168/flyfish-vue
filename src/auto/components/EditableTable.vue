<template>
  <div :class="{'editable-table': true, draggable: !readonly && draggable}">
    <a-button v-if="changeable && !readonly" class="editable-table-btn" @click="handleAdd">
      <a-icon type="plus" />
      添加
    </a-button>
    <a-button v-for="batch in batches" :key="batch.key" :type="batch.type || ''" class="editable-table-btn"
              @click="() => handleButton(batch)">
      <a-icon v-if="batch.icon" :type="batch.icon" />
      {{ batch.name }}
    </a-button>
    <a-table
      v-bind="checkable ? { rowSelection } : {}"
      :columns="config"
      :dataSource="data"
      :loading="loading"
      :pagination="maxCount && data.length > maxCount ? { position: 'bottom' } : false"
      :rowKey="getId"
      bordered
    >
      <template slot="operation" slot-scope="text, record">
        <template v-if="getId(record) in editing">
          <a @click="() => handleSave(getId(record))">完成</a>
          <a-divider type="vertical" />
          <a-popconfirm
            title="取消将放弃您对本行的输入！"
            @confirm="() => handleCancel(getId(record))"
          >
            <a class="danger">取消</a>
          </a-popconfirm>
        </template>
        <template v-else-if="!record.readonly">
          <a @click="() => handleEdit(record)">修改</a>
          <template v-if="changeable">
            <a-divider type="vertical" />
            <a-popconfirm
              title="确定要删除该行吗?您的操作不可撤销！"
              @confirm="() => handleRemove(getId(record))"
            >
              <a class="danger">删除</a>
            </a-popconfirm>
          </template>
        </template>
      </template>
      <template
        v-for="(col, colIndex) in columns"
        :slot="col.code" slot-scope="text, record, index"
      >
        <div :key="col.code">
          <a-form-item
            v-if="needRender(col, record)"
            v-bind="validationProps(record, col)"
          >
            <template v-if="col.component">
              <keep-alive>
                <component
                  :is="col.component"
                  v-if="form[colIndex] && form[colIndex].visible(editingRecord(record))"
                  v-bind="form[colIndex] && form[colIndex].merge(editingRecord(record)) || col.props || {}"
                  :value="editingRecord(record)[col.code]"
                  @change="e => handleChange(col.code, editingRecord(record), e)"
                >{{ col.children || '' }}
                </component>
              </keep-alive>
            </template>
            <a-input v-else v-model="editingRecord(record)[col.code]" placeholder="请输入" />
          </a-form-item>
          <span v-else @dblclick="() => handleEdit(record)">
            <table-field-render :custom-render="col.render" :index="index" :record="record" :text="text" />
          </span>
        </div>
      </template>
    </a-table>
  </div>
</template>

<script>
import Sortable from 'sortablejs';
import isEqual from 'lodash.isequal';
import groupBy from 'lodash.groupby';
import isFunction from 'lodash.isfunction';
import schema from 'async-validator';
import AutoFormConfig from '../model/forms';
import get from 'lodash.get';
import { AutoFormMixins } from '../mixins';
import TableFieldRender from './partial/TableFieldRender';

const { AutoFormOptions } = AutoFormConfig;

/**
 * vue精品之动态表格，支持各种配置化特性，一应俱全
 * @author wangyu
 */
export default {
  name: 'EditableTable',
  components: { TableFieldRender },
  mixins: [AutoFormMixins],
  props: {
    number: {
      type: Boolean,
      default: true
    },
    draggable: {
      type: Boolean,
      default: false
    },
    rowKey: {
      type: String,
      default: '_id'
    },
    readonly: {
      type: Boolean,
      default: false
    },
    checkable: {
      type: Boolean,
      default: false
    },
    multiple: {
      type: Boolean,
      default: false
    },
    value: {
      type: Array
    },
    rows: {
      type: [Array, Function],
      default: () => []
    },
    changeable: {
      type: Boolean,
      default: true
    },
    columns: {
      type: Array,
      default: () => []
    },
    batches: {
      type: Array,
      default: () => []
    },
    maxCount: {
      type: Number,
      default: 10,
      description: '最大数量，多于这个会分页'
    }
  },
  data() {
    return {
      // 关闭自动提交（auto-form-mixin）
      lazy: true,
      // 保存的数据
      data: [],
      // 校验状态
      validation: {},
      // 编辑中的行数据，key是id
      editing: {},
      // 渲染的列配置
      config: [],
      // 表单
      form: [],
      // 加载状态
      loading: false,
      // 当前校验的行
      current: {},
      // 行选择
      rowSelection: {
        type: 'radio',
        selectedRowKeys: [],
        onChange: this.handleSelect
      }
    };
  },
  mounted() {
    // 初始化
    this.initData(true);
    // 初始化列
    this.parseColumns();
    // 初始化拖拽
    this.initializeDrag();
    // 初始化校验器
    this.buildDescriptor();
    // 初始化表单
    this.buildForm();
    // 初始化选择器
    this.parseSelection();
  },
  watch: {
    columns(value) {
      this.parseColumns();
      this.buildDescriptor(value);
      this.buildForm(value);
    },
    realRows: {
      deep: true,
      handler() {
        // rows发生改变，需要重新初始化
        this.initData(true);
      }
    },
    multiple() {
      this.parseSelection();
    },
    value() {
      this.initData();
    }
  },
  computed: {
    // 校验检查器
    validator() {
      const columns = this.columns;
      return this.buildDescriptor(columns);
    },
    realRows() {
      return isFunction(this.rows) ? this.rows(this.columns) : this.rows;
    }
  },
  methods: {
    initData(first) {
      // 当可勾选，且只读时；或者当可勾选，非只读但不可更改行时，初始数据写入data，且不再更改
      if (first && this.checkable && (this.readonly || !this.readonly && !this.changeable)) {
        this.data = this.dataSource(this.realRows);
      }
      // 可选中，需要赋值选中行以回显
      if (this.checkable) {
        // 只读时，选中情况双向绑定
        if (this.readonly) {
          this.rowSelection.selectedRowKeys = this.dataSource(this.value);
        } else if (!this.changeable) {
          const selectedRowKeys = this.value && this.value.map(item => this.getId(item)) || [];
          // 不是第一次修改，需要更新value
          const group = groupBy(this.data, this.getId);
          (this.value || []).forEach(item => {
            const key = this.getId(item);
            if (key in group) {
              Object.assign(group[key][0], item);
            }
          });
          // 非只读但不可变更，选中项由内容多寡决定
          this.rowSelection.selectedRowKeys = selectedRowKeys;
        }
      } else {
        // 其他情况，正常交换
        this.applyValue(this.dataSource());
      }
    },
    getForm() {
      return this.form || [];
    },
    getId(record) {
      const { rowKey = '_id' } = this;
      const { [rowKey]: key } = record;
      return record._id || key;
    },
    dataSource(target = this.value) {
      if (target) {
        return [...((target || []).length && target || [])];
      }
      return [];
    },
    applyValue(value) {
      const clearData = this.data.filter(item => !item._new);
      // 未匹配时，更新值，降低io
      if (clearData.length !== value.length || !isEqual(clearData, value)) {
        this.data = value;
      }
    },
    parseColumns() {
      const { number, readonly } = this;
      const columns = this.columns.map(column => {
        const { code, title, width } = column;
        return {
          align: 'left',
          dataIndex: code,
          title,
          width,
          scopedSlots: { customRender: code }
        };
      });
      // 根据是否显示头决定
      if (number) {
        columns.unshift({
          align: 'center',
          key: 'index',
          title: '#',
          width: 60,
          customRender: (text, record, index) => {
            return index + 1;
          }
        });
      }
      // 结尾添加操作
      if (!readonly) {
        columns.push({
          align: 'center',
          key: 'operation',
          title: '操作',
          width: 120,
          scopedSlots: { customRender: 'operation' }
        });
      }
      this.config = columns;
    },
    initializeDrag() {
      if (this.draggable) {
        const elem = document.querySelector('.editable-table .ant-table-tbody');
        Sortable.create(elem, {
          filter: 'input',
          preventOnFilter: false,  // 设置这个属性，防止input输入时间被prevent掉，这个属于原生事件
          onEnd: this.handleDrag,
          animation: 150,
          easing: 'cubic-bezier(1, 0, 0, 1)'
        });
      }
    },
    // 解析选择器
    parseSelection() {
      this.rowSelection.type = this.multiple ? 'checkbox' : 'radio';
    },
    // 构建表单
    buildForm(columns = this.columns) {
      this.form = (columns || []).map(item => new AutoFormOptions(item));
      this.mapping();
    },
    // 构建解释器
    buildDescriptor(columns = this.columns) {
      // 构建元数据
      const meta = columns.reduce((result, column) => {
        const { code, validation } = column;
        if (validation) {
          result[code] = isFunction(validation) ? validation(this.current) : validation;
        }
        return result;
      }, {});
      // 赋值校验器
      if (Object.keys(meta).length) {
        return new schema(meta);
      }
      return null;
    },
    create(id) {
      const row = { _id: id, _new: true };
      this.columns.forEach(column => {
        row[column.code] = get(column, 'options.initialValue') || undefined;
      });
      return row;
    },
    handleAdd() {
      const id = Date.now();
      const row = this.create(id);
      this.beforeEdit(id, row);
      this.data = [...this.data, { ...row }];
    },
    handleEdit(data) {
      if (!this.readonly && !data.readonly) {
        this.beforeEdit(this.getId(data), { ...data });
      }
    },
    // 编辑前
    beforeEdit(id, row) {
      this.editing = { ...this.editing, [id]: this.prepare(row) };
    },
    // 编辑后
    afterEdit(row) {
      const record = this.transform(row);
      this.$emit('edit', record);
      return record;
    },
    handleSave(id) {
      const { [id]: record } = this.editing;
      // 使用async-validator进行行校验，校验不通过无法保存
      this.validateRow(record, () => {
        if (record._new) {
          delete record._new;
        }
        this.handleCancel(id);
        // 转换值
        this.data = this.data.map(item => this.getId(item) === id ? this.afterEdit(record) : item);
        // 调用onChange
        this.commit(id);
      });
    },
    handleCancel(id) {
      const { [id]: ignored, ...rest } = this.editing;
      // 直接取消新添加的，会导致删除
      if (ignored._new) {
        this.handleRemove(id);
      }
      this.editing = rest;
    },
    handleRemove(id) {
      this.data = this.data.filter(item => this.getId(item) !== id);
      this.$emit('remove', id);
      this.commit();
    },
    // 行控件内容变更的回调
    handleChange(key, data, e) {
      const value = e instanceof Event ? e.target.value : e;
      data[key] = value;
      // 值联动
      this.chain({ [key]: value }, data);
    },
    handleDrag(context) {
      const { newIndex, oldIndex } = context;
      if (this.readonly) {
        this.$emit('dragend', context);
      } else {
        const currRow = this.data.splice(oldIndex, 1)[0];
        this.data.splice(newIndex, 0, currRow);
        this.commit();
      }
    },
    // 选中状态改变时的回调
    handleSelect(selectedRowKeys) {
      // console.debug(selectedRowKeys, selectedRows);
      this.rowSelection.selectedRowKeys = selectedRowKeys;
      // 当为只读表格时，触发onchange
      if (this.checkable) {
        if (this.readonly) {
          this.$emit('change', selectedRowKeys);
        } else if (!this.changeable) {
          this.$emit('change', this.data.filter(item => selectedRowKeys.includes(this.getId(item))));
        }
        // todo 可变表格的勾选无效
      }
    },
    // 头部按钮事件
    handleButton(batch) {
      if (batch.on) {
        batch.on(this);
      }
      this.$emit('btnclick', batch);
    },
    // 获取校验属性
    validationProps(record, col) {
      const id = this.getId(record);
      const { code } = col;
      if (id in this.validation) {
        const { [id]: { [code]: error } } = this.validation;
        if (error) {
          return {
            validateStatus: 'error',
            help: error
          };
        }
      }
      return {};
    },
    // 校验，这里使用校验方法
    validateRow(record, callback) {
      this.current = record;
      const validator = this.validator;
      // 执行校验
      if (validator) {
        validator.validate(record, (errors, fields) => {
          // 存在错误，将错误进行显示
          if (errors && errors.length) {
            this.validation[this.getId(record)] = errors.reduce((result, item) => {
              result[item.field] = item.message;
              return result;
            }, {});
            this.$forceUpdate();
          } else {
            // 没有错误，放行
            delete this.validation[this.getId(record)];
            callback(fields);
          }
        });
      } else {
        callback(record);
      }
    },
    // 判断是否预加载
    needRender(col, record) {
      const id = this.getId(record);
      return id in this.editing && col.editable !== false;
    },
    editingRecord(record) {
      return this.editing[this.getId(record)] || record;
    },
    clear() {
      this.editing = {};
      this.data = [];
    },
    commit(id) {
      const { selectedRowKeys = [] } = this.rowSelection;
      if (!this.checkable) {
        const value = this.data.filter(item => !item._new);
        this.$emit('change', value);
        this.$emit('input', value);
      } else if (id && !this.changeable && selectedRowKeys.includes(id)) {
        // 当不可编辑表 + 可选 + 选中行包含当前行，修改后需要通知父组件
        this.$emit('change', this.data.filter(item => selectedRowKeys.includes(this.getId(item))));
      }
    }
  },
};
</script>

<style lang="less" scoped>
.editable-table {
  background: white;

  &.draggable /deep/ .ant-table-row {
    cursor: move;
  }

  /deep/ .sortable-chosen {
    background: #2eabff;
  }

  /deep/ .sortable-ghost {
    opacity: 0.4;
  }

  &.readonly {
    /deep/ .ant-table-row {
      cursor: inherit;
    }
  }

  .editable-table-btn {
    margin: 0 15px 20px 0;
  }

  /deep/ .ant-input-number, /deep/ .ant-select {
    width: 100%;
  }

  /deep/ .ant-form-item {
    margin-bottom: 0;
  }
}

.danger {
  color: red;
}
</style>

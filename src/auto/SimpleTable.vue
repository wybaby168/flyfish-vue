<template>
  <div v-bind="$attrs">
    <card-wrapper :bordered="false" :wrap="wrap">
      <!-- 查询区域 -->
      <div v-if="parsedSearch.length" class="table-page-search-wrapper">
        <a-form layout="inline" @keyup.enter.native="handleSearch">
          <a-row :gutter="24">
            <a-col v-for="(field, index) in parsedSearch" v-if="field.visible(query)" v-show="index <= 2 || index > 2 && expand" :key="field.code"
                   :md="field.span || 6" :sm="24">
              <a-form-item :label="field.title">
                <keep-alive>
                  <component
                    :is="field.component"
                    v-model="query[field.code]"
                    v-bind="field.merge(query)"
                    :placeholder="field.props.placeholder || `请输入${field.title}进行筛选`"
                    v-on="field.events || {}"
                  >{{ field.children || '' }}
                  </component>
                </keep-alive>
              </a-form-item>
            </a-col>
            <a-col :md="6" :sm="8">
              <span class="table-page-search-submitButtons" style="float: left; overflow: hidden;">
                <a-button icon="search" type="primary" @click="handleSearch">查询</a-button>
                <a-button icon="reload" style="margin-left: 8px" type="primary"
                          @click="handleReset">重置</a-button>
                <a v-if="parsedSearch.length > 3" style="margin-left: 8px" @click="toggleField">
                  {{ expand ? '收起' : '展开' }}
                  <a-icon :type="expand ? 'up' : 'down'" />
                </a>
              </span>
            </a-col>
          </a-row>
        </a-form>
      </div>
      <!-- 查询区域-END -->

      <!-- 操作按钮区域 -->
      <div class="table-operator">
        <template v-for="item in parsedButtons" v-if="visible(item)">
          <a-dropdown :key="item.key" v-if="item.children" :trigger="['click']">
            <a-menu slot="overlay" @click="({key}) => handleOperation(findTree(item.children, t => t.key === key))">
              <template v-if="visible(sub)" v-for="sub in item.children">
                <a-menu-item
                    :key="sub.key"
                    v-if="!sub.children"
                    v-show="!sub.batch || sub.batch && selectedRowKeys.length"
                >
                  <a-icon v-if="sub.icon" :type="sub.icon" /> {{ sub.name | value }}
                </a-menu-item>
                <a-sub-menu v-else :key="sub.key">
                  <span slot="title"><a-icon v-if="sub.icon" :type="sub.icon" /> {{ sub.name | value }}</span>
                  <a-menu-item v-for="grand in sub.children" :disabled="grand.disabled === true" :key="grand.key">
                    <a-icon v-if="grand.icon" :type="grand.icon" /> {{ grand.name | value }}
                  </a-menu-item>
                </a-sub-menu>
              </template>
            </a-menu>
            <a-button
                :type="item.type || 'primary'"
                v-show="!item.batch || item.batch && selectedRowKeys.length"
                :ghost="item.ghost"
            >
              <a-icon v-if="item.icon" :type="item.icon" />
              {{ item.name | value }}
              <a-icon type="down" />
            </a-button>
          </a-dropdown>
          <a-button
              :key="item.key"
              :type="item.type || 'primary'"
              @click="() => handleOperation(item)"
              v-else
              v-show="!item.batch || item.batch && selectedRowKeys.length"
              :ghost="item.ghost"
          >
            <a-icon v-if="item.icon" :type="item.icon" />
            {{ item.name | value }}
          </a-button>
        </template>
        <template v-if="excel">
          <a-button  v-if="!isBlock('export') && authorities.includes('export')" icon="download" type="primary" @click="handleExportXls">导出
          </a-button>
          <a-upload v-if="!isBlock('import') && authorities.includes('import')" :action="importExcelUrl" :headers="tokenHeader" :multiple="false"
                    :showUploadList="false"
                    name="file" @change="handleImportExcel">
            <a-button icon="import" type="primary">导入</a-button>
          </a-upload>
        </template>
      </div>

      <slot name="header"></slot>

      <!-- table区域-begin -->
      <div>
        <div v-if="selectedRowKeys.length" class="ant-alert ant-alert-info" style="margin-bottom: 16px;">
          <i class="anticon anticon-info-circle ant-alert-icon"></i> 已选择 <a style="font-weight: 600">{{
            selectedRowKeys.length }}</a>项
          <a style="margin-left: 24px" @click="clearSelected">清空</a>
        </div>

        <a-table
          :bordered="bordered"
          :columns="parsedColumns"
          :dataSource="data"
          :loading="loading"
          :pagination="this.page && pagination"
          :rowKey="rowKey"
          :rowSelection="readonly ? null : rowSelection"
          @change="handleTableChange"
          ref="table"
          v-bind="$attrs"
          v-on="$listeners"
        >
          <div slot="operation" slot-scope="text, record">
            <template v-if="parsedOperations(record).length < operationLimit + 1">
              <template v-for="(opt, index) in parsedOperations(record)">
                <a-divider v-if="index !== 0" :key="`${opt.key}divider`" type="vertical" />
                <template v-if="opt.danger">
                  <a-popconfirm :key="`${opt.key}name`" :title="opt.text || `确定${opt.name}吗?`"
                                @confirm="() => handleOperation(opt, record)">
                    <a class="danger">{{ opt.name }}</a>
                  </a-popconfirm>
                </template>
                <a v-else :key="`${opt.key}name`" @click="() => handleOperation(opt, record)">
                  <a-icon v-if="opt.icon" :type="opt.icon" />
                  {{ opt.name }}
                </a>
              </template>
            </template>
            <template v-else>
              <template v-for="(opt, index) in parsedOperations(record)" v-if="index < operationLimit - 1">
                <template v-if="opt.danger">
                  <a-popconfirm :key="`${opt.key}name`" :title="`确定${opt.name}吗?`"
                                @confirm="() => handleOperation(opt, record)">
                    <a class="danger">{{ opt.name }}</a>
                  </a-popconfirm>
                </template>
                <a v-else :key="`${opt.key}name`" @click="() => handleOperation(opt, record)">
                  <a-icon v-if="opt.icon" :type="opt.icon" />
                  {{ opt.name }}
                </a>
                <a-divider :key="`${opt.key}divider`" type="vertical" />
              </template>
              <a-dropdown>
                <a class="ant-dropdown-link">更多
                  <a-icon type="down" />
                </a>
                <a-menu slot="overlay">
                  <a-menu-item v-for="(opt, index) in parsedOperations(record)" v-if="index >= operationLimit - 1"
                               :key="opt.key">
                    <template v-if="opt.danger">
                      <a-popconfirm :title="`确定${opt.name}吗?`" @confirm="() => handleOperation(opt, record)">
                        <a class="danger">{{ opt.name }}</a>
                      </a-popconfirm>
                    </template>
                    <a v-else @click="() => handleOperation(opt, record)">
                      <a-icon v-if="opt.icon" :type="opt.icon" />
                      {{ opt.name }}
                    </a>
                  </a-menu-item>
                </a-menu>
              </a-dropdown>
            </template>
          </div>
        </a-table>

        <!--模态框骚操作-->
        <auto-form-modal ref="modal" :action="operation" :after="next" :config="formConfig"
                         :get="getData" :save="handleOk" :title="`${operation}${name}`" @success="fetchRows()" />
        <auto-form-detail ref="detail" :config="details" :loadData="this.config.read" :title="`查看${name}详情`" />
      </div>
    </card-wrapper>
  </div>
</template>

<script>
import isFunction from 'lodash.isfunction';
import AutoFormModal from '@/components/auto/AutoFormModal';
import {CrudTableMixins} from '@/components/auto/mixins';
import AutoFormConfig from '@/components/auto/model/forms';
import AutoFormDetail from '@/components/auto/AutoFormDetail';
import moment from 'moment';
import {findTree, flatten, hasAuthorities, hasAuthority, memoizeOne} from '@/utils/util';
import CardWrapper from './partial/CardWrapper';
import ExcelMixin from '@/mixins/ExcelMixin';

// 默认解析策略
const defaultResponse = result => {
  const { success, result: { records: list, total } = {}, message = '系统发生未知异常！' } = result;
  return { success, list, total, message };
};

// 共享store，用于路由切换自动刷新
export const sharedStore = {
  current: null
};

const authorityKeys = ['create', 'batch-delete', 'edit', 'delete', 'detail', 'import', 'export'];

/**
 * 公共table组件
 * @author wangyu
 * @version
 * 1.0.0 组件创建
 * 1.0.1 新增HOC支持
 * 1.1.0 将状态存储至Redux，享受全局变量保持状态
 * @description
 * 1. 特性
 * == 自动化处理内部state
 * == 智能处理分页
 * == 全局统一样式
 * == 统一处理列表操作
 * == 灵活的钩子函数
 * == 支持重写
 * 2. 支持的props
 * == id:  1.1.0新增，标识一个唯一的table，最终生成的tableId为route + key
 * == fields: 搜索域，接受一个ReactNode的array
 * == wrapper: boolean 默认为true，如果设为false，则不包装外层的Card，用户自定义布局
 * == alwaysShow: 总是显示批量操作按钮: type: Boolean  (decorate 包装参数)
 * == initialSearch: 初始的查询参数，支持受控传入。注意：该参数会覆盖之前输入框自身的状态，需要在外层组件自己维护部分可变状态state。
 * == autoLoad: 是否自动加载数据，默认true
 * == onSearch: 点击搜索按钮的事件，可以理解为触发查询前的事件，在这里，可以return false来禁止本次搜索，做自定义校验。
 *              如果需要在搜索完成后处理一些事情，请在 @see onLoad 参数回调中处理
 * == onFieldsChange: 当搜索域值改变时的回调，返回key和事件，自行处理。可以返回false阻止默认执行，默认请返回true
 * == page:   boolean 是否支持分页，默认支持
 *
 * == loadData：  数据加载方法，直接从services/api.js传入对应的async方法即可
 * == resultMapper： @deprecated 使用mapResponseToRows替代 ！ 结果映射，从{ code: '', msg: ''， data: '' }的data中取出的映射
 * == onLoad: 数据每次刷新后的回调，参数是映射后取出的数据，在分页，搜索，删除操作后都会执行。（受控）
 * == onSelect: 选中后的回调，用于自行处理选中结果。（受控）
 *
 * == operations: 操作列的渲染列表，可以指定key和options.bind属性来绑定事件。*new【可以使用lambda动态传入操作】 如果是函数,  必须返回空数组
 * == onOperation: 点击操作后的事件，参数为： 操作名， 操作行数据， 事件对象
 * ==== 操作对象支持的属性
 *   == bind: boolean 可以主动指定是否绑定事件
 *
 * ==== fields内部组件支持
 *   == mapper： 输入组件结果映射，从onChange方法的event传入
 *   == name: 组件的标识，用于发送表单数据
 *
 * == 其它属性
 *   == 拥有Table组件全部属性
 * 3. 包装connectTable选项
 * == mapResponseToRows：  指定该项可以自己解析请求响应，响应值为 response.data，
 * authorities: {
 *    type: Object,
 *    description: '权限表，默认key支持create,batch-delete,edit,delete,detail,import,export',
 *    default: () => ({}),
 * },
 */
export default {
  name: 'SimpleTable',
  components: { AutoFormDetail, AutoFormModal, CardWrapper },
  props: {
    autoLoad: {
      type: Boolean,
      default: true,
    },
    wrap: {
      type: Boolean,
      description: '是否包装card',
      default: true
    },
    rowKey: {
      type: [String, Function],
      default: 'id'
    },
    control: {
      type: Boolean,
      default: false,
      description: '是否受控',
    },
    bordered: {
      type: Boolean,
      default: true
    },
    config: {
      type: Object,
      default: () => ({}),
      description: '一些缺省配置，包含url'
    },
    number: {
      type: Boolean,
      default: false,
      description: '是否显示序号列'
    },
    columns: {
      type: Array,
      description: '表格包含的列，支持slot'
    },
    operations: {
      type: [Array, Function],
      default: () => [],
      description: '操作的列表，会显示在下拉位置'
    },
    block: {
      type: [Array, Function],
      default: () => [],
      description: '屏蔽不需要的按钮'
    },
    initialQuery: {
      type: Object,
      description: '初始搜索条件'
    },
    initialForm: {
      type: [Object, Function],
      description: '初始的表单值'
    },
    showSelect: {
      type: Boolean,
      default: true,
      description: '是否显示选择列'
    },
    loadData: {
      type: [Function, Array],
      default(params) {
        const { config: { list } } = this;
        return list(params);
      },
      description: '加载数据的方式，支持静态array和接口，接口格式'
    },
    readonly: {
      type: Boolean,
      default: false,
      description: '是否是只读的'
    },
    search: {
      type: Array,
      default: () => [],
      description: '搜索域渲染，兼容auto-form组件'
    },
    buttons: {
      type: Array,
      default: () => [],
      description: '表格上方按钮，一般用于批量操作'
    },
    title: {
      type: String,
      default: '',
      description: '表格显示的标题，默认不显示标题'
    },
    name: {
      type: String,
      default: '内容',
      description: '表格内部缺省操作的文案'
    },
    form: {
      type: Object,
      default: () => ({ form: [] }),
      description: '表单配置，包含详情配置'
    },
    operationWidth: {
      type: Number,
      default: 170,
      description: '操作列的宽度'
    },
    operationLimit: {
      type: Number,
      default: 3,
      description: '操作列限制个数'
    },
    page: {
      type: [Boolean, Object],
      default: true,
      description: '是否分页'
    },
    multiple: {
      type: Boolean,
      default: false,
      description: '是否多选'
    },
    selectedKeys: {
      type: Array,
      default: () => [],
      description: '已经选中的keys'
    },
    response: {
      type: Function,
      description: '手动解析响应'
    },
    disabledRows: {
      type: Function,
      description: '禁用的行'
    },
    details: {
      type: Object,
      description: '详情描述'
    },
    next: {
      type: [Object, Function],
      description: '下一步动作提示'
    },
    factor: {
      type: Object,
      description: '数据变动因素，用于数据缓存提高渲染性能',
      default: () => ({}),
    },
    i18n: {
      type: Object,
      default: () => ({
        create: '新建'
      }),
      description: '国际化配置，也可用于别名'
    },
  },
  mixins: [CrudTableMixins, ExcelMixin],
  data() {
    return {
      // 展开搜索域
      expand: false,
      // loading
      loading: false,
      // 数据
      data: [],
      // 分页
      pagination: {
        current: 1,
        pageSize: 10,
        total: 0,
        pageSizeOptions: ['2', '5', '10', '20', '50'],
        showTotal: (total, range) => {
          return range[0] + '-' + range[1] + ' 共' + total + '条';
        },
        showQuickJumper: true,
        showSizeChanger: true
      },
      // 内置的operation
      defaultOperations: [
        {
          key: 'edit',
          name: '编辑',
          condition: record => !this.readonly && !this.isBlock('edit', record)
        },
        {
          key: 'detail',
          name: '详情',
          condition: record => !this.isBlock('detail', record)
        },
        {
          key: 'delete',
          name: '删除',
          condition: record => !this.readonly && !this.isBlock('delete', record),
          danger: true
        }
      ],
      // 分页配置
      pageConfig: { page: 'page', size: 'size' },
      // 分页对象
      rowSelection: {
        mode: 'multiple',
        selectedRowKeys: [],
        onChange: this.handleSelect,
        getCheckboxProps: this.getCheckboxProps
      },
      // 已经解析的搜索
      parsedSearch: [],
      // 已经解析后的列
      parsedColumns: [],
      // 已经解析的按钮们
      parsedButtons: [],
      // 选中的行keys
      selectedRowKeys: [],
      // 查询参数
      query: {},
      // 正在编辑的
      row: {},
      // 解析operations
      parsedOperations: this.produceOperations(),
      // 当前操作描述
      operation: '新增'
    };
  },
  mounted() {
    sharedStore.current = this;
    // 初始化搜索
    this.initSearch();
    // 初始化列
    this.initColumns();
    // 初始化按钮
    this.initButtons();
    // 初始化选中
    this.initSelection();
    // 初始化默认
    this.query = { ...this.initialQuery } || {};
    // 分页配置解析
    this.initPage();
    // 尝试拉取数据，初始化表格
    if (this.autoLoad) {
      this.fetchRows().then(() => {
        const { query: { id } = {} } = this.$route;
        if (id) {
          this.handleOperation('edit', { id });
        }
      });
    }
  },
  beforeDestroy() {
    sharedStore.current = null;
  },
  computed: {
    formConfig() {
      const { form } = this;
      return AutoFormConfig.of(form);
    },
    routerPath() {
      const { matched = [] } = this.$route;
      const { path } = matched[matched.length - 1] || {};
      return path;
    },
    // 当前拥有的权限
    authorities() {
      const keys = [...authorityKeys, ...(flatten(this.buttons || [])).map(button => button.key)];
      return hasAuthorities(this.routerPath, keys);
    }
  },
  watch: {
    selectedKeys() {
      this.initSelection(true);
    },
    operations() {
      this.parsedOperations = this.produceOperations();
    },
    multiple() {
      this.rowSelection.mode = this.multiple ? 'multiple' : 'single';
    },
    initialQuery(value) {
      this.query = this.control ? value : {
        ...this.query,
        ...(value || {})
      };
    },
    loadData() {
      this.fetchRows();
    },
    columns() {
      this.initColumns();
    },
    search() {
      this.initSearch();
    },
    buttons() {
      this.initButtons();
    },
    page() {
      this.initPage();
    },
    '$route'() {
      // 强制刷新表单
      this.$refs.modal.$forceUpdate();
      this.$refs.detail.$forceUpdate();
      this.fetchRows();
    }
  },
  methods: {
    findTree,
    // 是否屏蔽
    isBlock(key, record) {
      const { block } = this;
      return Array.isArray(block) ? block.includes(key) : isFunction(block) ? block(key, record) : false;
    },
    // 初始化分页配置
    initPage() {
      if (typeof this.page === 'object') {
        this.pageConfig = this.page;
      } else if (typeof this.page === 'boolean') {
        this.pageConfig = { page: 'page', size: 'size' };
      }
    },
    produceOperations() {
      return memoizeOne(row =>
          [...this.defaultOperations, ...(isFunction(this.operations) ? this.operations(row) : this.operations)]
            .filter(({ key, condition }) => (!condition || condition(row)) && hasAuthority(`${this.routerPath}/${key}`)),
        row => ({ row, factor: this.factor }));
    },
    // 初始化行选择
    initSelection(change = false) {
      // 行选择类型
      if (!change) {
        this.rowSelection.mode = this.multiple ? 'multiple' : 'single';
      }
      // 选中的行，先透传
      this.selectedRowKeys = this.selectedKeys || this.selectedRowKeys || [];
      // 行选择内容
      this.rowSelection.selectedRowKeys = this.selectedRowKeys;
    },
    // 初始化搜索
    initSearch() {
      this.parsedSearch = this.search.map(item => new AutoFormConfig.AutoFormOptions(item));
    },
    // 初始化列
    initColumns() {
      const { number, operationWidth, readonly } = this;
      const columns = this.columns.map(column => {
        const { code, title, width, render, dateFormat, align = this.$attrs.align || 'left' } = column;
        // 判断需要转换时间格式
        const patch = {};
        if (dateFormat) {
          patch.customRender = value => moment(value).format(dateFormat);
        }
        return {
          align,
          dataIndex: code,
          ellipsis: true,
          title,
          width,
          ...patch,
          ...(render ? { customRender: render } : { scopedSlots: { customRender: code } })
        };
      });
      // 根据是否显示头决定
      if (number) {
        columns.unshift({
          align: 'center',
          key: 'index',
          title: '#',
          width: 50,
          customRender: (text, record, index) => {
            return index + 1;
          }
        });
      }
      if (!(this.isBlock('detail') && this.readonly && !isFunction(this.operations) && !this.operations.length)) {
        // 结尾添加操作
        columns.push({
          align: 'center',
          key: 'operation',
          title: '操作',
          width: operationWidth - (readonly ? 50 : 0),
          scopedSlots: { customRender: 'operation' }
        });
      }
      this.parsedColumns = columns;
    },
    // 初始化按钮们
    initButtons() {
      // 增加缺省的按钮
      this.parsedButtons = this.readonly ? this.buttons : [
        {
          key: 'create',
          name: `${this.i18n.create}${this.name}`,
          type: 'primary',
          icon: 'plus'
        },
        {
          key: 'batch-delete',
          name: `批量删除`,
          type: 'danger',
          icon: 'delete',
          batch: true,
          confirm: true
        },
        ...this.buttons
      ];
    },
    // 触发查询
    handleSearch() {
      this.pagination.current = 1;
      this.$emit('search');
      this.fetchRows();
    },
    // 检测显示条件
    visible(item, record) {
      const { key, condition } = item;
      return !this.isBlock(key) && this.authorities.includes(key) && (!condition || condition(record));
    },
    // 拉取行
    async fetchRows() {
      // 检测判断loadData
      if (isFunction(this.loadData)) {
        const {
          response = defaultResponse, pagination: { current, pageSize }, pageConfig:
            { page, size, offset = false, zero = false }
        } = this;
        const currentPage = offset ? (zero ? current - 1 : current) * pageSize : zero ? current - 1 : current;
        const paged = {
          [page]: currentPage,
          [size]: pageSize
        };
        this.loading = true;
        const { success, list, total, message } = response(await this.loadData({
          ...paged,
          ...this.query
        }) || {});
        this.loading = false;
        if (success) {
          this.data = list || [];
          this.pagination.total = total || 0;
        } else {
          this.$message.error(message);
        }
      } else {
        // 直接赋值
        this.data = this.loadData;
        this.pagination.current = 1;
        this.pagination.total = this.data.length;
      }
    },
    handleReset() {
      // 重置事件推送
      this.$emit('reset');
      // 重置为默认查询
      this.query = { ...this.initialQuery } || {};
      // 重新从第一页开始
      this.pagination.current = 1;
      // 拉取数据
      this.fetchRows();
    },
    // 处理批量按钮的回调
    handleOperation(key, record, name) {
      this.row = record || {};
      this.operation = name || (!this.row || !this.getKey(this.row) ? '新增' : '修改');
      // 处理批量操作，批量操作传入options
      if (typeof key === 'object') {
        const { key: _key, alias, name, confirm = false, lint = '该操作不可撤回', onClick } = key;
        const operationKey = alias || _key;
        // 代码复用
        const runner = () => {
          // 缺省的处理器
          const { [operationKey]: handler } = this.handlers || {};
          // 取出处理器，优先onClick
          const callback = onClick || handler || '';
          // 判断回调
          return this.handleAndReturn(operationKey, callback, record);
        };
        // 如果是危险操作，确认后执行
        if (confirm) {
          this.$confirm({
            title: `确认要${name}吗？`,
            content: lint,
            okType: 'danger',
            onOk: runner
          });
        } else {
          runner();
        }
      } else {
        // 缺省的处理器
        const { [key]: handler } = this.handlers || {};
        return this.handleAndReturn(key, handler, record);
      }
    },
    // 选中时候的回调
    handleSelect(selectedRowKeys, selectionRows) {
      if (this.selectedKeys.length) {
        this.$emit('select', selectedRowKeys, selectionRows);
      } else {
        // 同步更新
        this.selectedRowKeys = selectedRowKeys;
        this.rowSelection.selectedRowKeys = selectedRowKeys;
      }
    },
    // 分页、排序、筛选变化时触发
    handleTableChange(pagination) {
      this.pagination = pagination;
      this.fetchRows();
    },
    toggleField() {
      this.expand = !this.expand;
    },
    // 处理更新 & 新增
    async handleOk(values) {
      const { create, update } = this.config;
      const id = this.getKey(this.row);
      if (id) {
        if (!isFunction(this.rowKey)) {
          values[this.rowKey] = id;
        }
        return await update(values) || {};
      } else {
        return await create(values) || {};
      }
    },
    // 处理并返回
    handleAndReturn(key, callback, record) {
      if (callback) {
        const result = callback(record, this) || {};
        // 返回true，需要刷新
        if (result === true) this.fetchRows();
        // 返回promise，异步刷新
        if (result.then) {
          this.loading = true;
          return result.then(() => this.fetchRows()).finally(() => this.loading = false);
        }
      } else {
        // 需要主动刷新
        this.$emit(key, record, this);
      }
    },
    // 清除选中
    clearSelected() {
      if (this.selectedKeys.length) {
        this.$emit('clear-select');
      } else {
        this.selectedRowKeys = [];
        this.rowSelection.selectedRowKeys = [];
      }
    },
    // 获取选择框属性
    getCheckboxProps(record) {
      return {
        props: {
          disabled: this.isBlock('select', record),
          name: record.name,
        }
      };
    }
  }
};
</script>

<style scoped lang="less">
.danger {
  color: red;
}
.table-page-search-wrapper {
  /deep/ .ant-col .ant-calendar-picker {
    width: 100% !important;
  }
}
</style>

<template>
  <layer
    :maskClosable="false"
    :title="title"
    :visible="visible"
    :width="config.width || 1200"
    @cancel="handleClose"
    @ok="submit"
    v-bind="$attrs"
  >
    <template slot="footer">
      <template v-if="$slots.footer">
        <slot name="footer"></slot>
      </template>
      <template v-else-if="type !== 'step'">
        <a-button key="back" @click="handleClose">
          关闭
        </a-button>
        <a-button key="submit" v-if="!readonly" :loading="confirmLoading" type="primary" @click="submit">
          {{ action }}
        </a-button>
      </template>
      <div v-else style="text-align: center">
        <a-button v-if="current > 0" style="margin-left: 8px" @click="prev">
          上一步
        </a-button>
        <a-button v-if="current < groups.length - 1" type="primary" @click="next">
          下一步
        </a-button>
        <a-button
          v-if="current === groups.length - 1"
          type="primary"
          :loading="confirmLoading"
          @click="submit"
        >
          {{ action }}
        </a-button>
      </div>
    </template>
    <auto-form
      :load-data="get"
      :prefix-cls="{'disabled-force': readonly, [prefixCls]: prefixCls}"
      ref="view"
      @ok="handleOk"
      :config="config"
      @step="handleStep"
      :current="current"
      embedded
    />
  </layer>
</template>

<script>
import AutoForm from './AutoForm';
import { StepFormMixins } from '@/components/auto/mixins';
import { mergeSafety } from '@/utils/util';
import isFunction from 'lodash.isfunction';
import Layer from '@/components/auto/partial/Layer'

/**
 * 转换器视图，提供数据的输入输出，基于通用简单的配置实现
 * @author wangyu
 */
export default {
  name: 'AutoFormModal',
  components: {
    AutoForm,
    Layer,
  },
  mixins: [StepFormMixins],
  props: {
    prefixCls: {
      type: String,
    },
    // 组件标识，会到服务端寻址，存在缓存
    config: {
      type: Object,
      description: '表单配置'
    },
    action: {
      type: String,
      description: '提交按钮名称',
      default: '提交'
    },
    autoClose: {
      type: Boolean,
      description: '隐藏错误信息',
      default: true
    },
    title: {
      type: String,
      default: '设置平台配置'
    },
    after: {
      type: [Object, Function],
      description: '下一个路由'
    },
    // 保存方法
    save: {
      type: Function
    },
    // 读取数据的源
    get: {
      type: Function
    }
  },
  data() {
    return {
      visible: false,
      readonly: false,
      data: {},
      confirmLoading: false,
      current: 0,
      step: null
    };
  },
  computed: {
    type() {
      return (this.config || {}).type;
    },
    groups() {
      return (this.config || {}).groups || [];
    },
    nextConfig() {
      const { after } = this;
      if (after) {
        return isFunction(after) ? after(this.data) : after;
      }
      return null;
    }
  },
  methods: {
    show(data) {
      this.visible = true;
      this.$nextTick(() => {
        this.$refs.view.update(data).then(res => this.data = res);
      });
    },
    view(data) {
      this.readonly = true;
      this.show(data);
    },
    // 处理分步表单
    handleStep(value) {
      this.current = value;
    },
    // 校验
    validate(callback) {
      // 处理分布表单
      if (this.type === 'step') {
        const { view } = this.$refs;
        const group = (this.groups[this.current] || {}).code;
        const form = (this.config || {}).form || [];
        const filtered = form.filter(item => item.group === group).map(item => item.code);
        view.form.validateFields(filtered, async (errors, values) => {
          if (!errors) {
            try {
              const result = await this.$refs.view.validateSub(filtered);
              if (result) {
                callback(values);
              }
            } catch (e) {

            }
          }
        });
      }
    },
    handleOk(values) {
      const { save } = this;
      if (save) {
        this.confirmLoading = true;
        const merged = mergeSafety(this.data, values);
        save(merged).then(({ success, result, message = '系统发生未知异常！' }) => {
          if (success) {
            if (result && result.id) {
              mergeSafety(this.data, { id: result.id });
            }
            if (this.nextConfig) {
              const { text, route } = this.nextConfig;
              this.$confirm({
                title: '成功完成',
                content: text,
                onOk: () => {
                  this.$router.push({ path: route });
                }
              });
            } else {
              this.$message.success(`${this.action}成功！`);
            }
            // 关闭
            if (this.autoClose) {
              this.handleClose();
            }
            // 成功
            this.$emit('success');
          } else {
            this.$message.error(message);
          }
        }).finally(() => {
          this.confirmLoading = false;
        });
      }
      // 触发ok
      this.$emit('ok', values);
    },
    submit() {
      this.$refs.view.handleOk();
    },
    handleClose() {
      // 可见改变
      this.visible = false;
      this.readonly = false;
      // 重置表单
      if (this.type === 'step') {
        this.current = 0;
      }
      // 处理关闭事件
      this.$emit('close');
    }
  }
};
</script>

<style scoped>
.auto-form /deep/ .ant-input-number {
  width: 100%;
}
/deep/ .disabled-force {
  pointer-events: none !important;
}
</style>

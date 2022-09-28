<template>
  <div class="tag-list">
    <template v-for="(tag, index) in tags">
      <a-tooltip v-if="tag.length > 20" :key="key(tag, index)" :title="tag">
        <a-tag :key="tag" :closable="true" class="tag" @close="() => handleClose(tag)">
          {{ `${tag.slice(0, 20)}...` }}
        </a-tag>
      </a-tooltip>
      <a-tag v-else :key="key(tag, index)" :closable="true" @close="() => handleClose(tag)">
        {{ tag }}
      </a-tag>
    </template>
    <a-input
      v-if="inputVisible"
      ref="input"
      v-model="inputValue"
      size="small"
      style="width: 78px"
      type="text"
      @blur="handleInputConfirm"
      @keyup.enter="handleInputConfirm"
    />
    <a-tag v-else class="tag tag-dashed" @click="showInput">
      <a-icon type="plus" />
      {{ placeholder }}
    </a-tag>
  </div>
</template>

<script>
export default {
  name: 'TagList',
  props: {
    value: {
      type: [Array, String]
    },
    placeholder: {
      type: String,
      default: '点击添加内容'
    },
    duplicate: {
      type: Boolean,
      default: false
    },
    delimiter: {
      type: String,
    }
  },
  data() {
    return {
      tags: [],
      inputVisible: false,
      inputValue: ''
    }
  },
  mounted() {
    if (this.delimiter && this.value) {
      this.tags = this.value.split(this.delimiter);
    } else {
      this.tags = this.value || []
    }
  },
  watch: {
    value(val) {
      if (this.delimiter && this.value) {
        this.tags = val.split(this.delimiter);
      } else {
        this.tags = val || []
      }
    }
  },
  methods: {
    key(key, index) {
      if (this.duplicate) {
        return `${key}-${index}`
      } else {
        return key;
      }
    },
    handleClose(removedTag) {
      this.tags = this.tags.filter(tag => tag !== removedTag);
      this.$emit('change', this.toValue());
    },
    showInput() {
      this.inputVisible = true;
      this.$nextTick(function() {
        this.$refs.input.focus();
      });
    },
    handleInputChange(e) {
      this.inputValue = e.target.value;
    },
    handleInputConfirm() {
      const inputValue = this.inputValue;
      const duplicate = this.duplicate;
      let tags = this.tags;
      if (inputValue && (duplicate || tags.indexOf(inputValue) === -1)) {
        tags = [...tags, inputValue];
      }
      // 更新tags
      Object.assign(this, {
        tags,
        inputVisible: false,
        inputValue: ''
      });
      // 通知
      this.$emit('change', this.toValue());
    },
    toValue() {
      return this.delimiter ? this.tags.join(this.delimiter) : this.tags;
    }
  },
};
</script>

<style scoped>
.tag-list /deep/ .ant-tag {
  margin-bottom: 8px;
}

.tag-dashed {
  background: #fff;
  border-style: dashed !important;
}

.has-error .tag, .has-error .ant-tag {
  color: red;
  border: 1px solid red;
}
</style>

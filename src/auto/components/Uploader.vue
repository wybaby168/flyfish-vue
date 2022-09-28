<template>
  <a-spin class="clearfix" :spinning="loading">
    <a-upload
        name="file"
        :multiple="multiple"
        :action="action"
        :headers="headers"
        :data="{bizPath}"
        :fileList="fileList"
        :beforeUpload="beforeUpload"
        :list-type="listType"
        @preview="handlePreview"
        @change="handleChange"
        :disabled="disabled"
        :accept="limit.accept"
        v-bind="$attrs"
    >
      <template v-if="!disabled">
        <a-button v-if="listType !== 'picture-card'">
          <a-icon type="upload"/>
          {{ placeholder }}
        </a-button>
        <template v-else>
          <div v-if="listSize === 0 || fileList.length < listSize">
            <a-icon :type="$attrs.loading ? 'loading' : 'plus'"/>
            <div class="ant-upload-text">
              {{ placeholder }}
            </div>
          </div>
        </template>
      </template>
    </a-upload>
    <a-modal :visible="previewVisible" :footer="null" @cancel="() => this.previewVisible = false">
      <img alt="预览图片" style="width: 100%" :src="previewImage"/>
    </a-modal>
  </a-spin>

</template>

<script>
/**
 * 读取图片为base64以预览
 */
import { renderSize } from '@/utils/util';
import { download } from '@/utils/request';
import { ACCESS_TOKEN } from '@/store/mutation-types';
import Vue from 'vue';

function getBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

const isImage = path => {
  const imageTypes = ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'tiff', 'bmp'];
  return imageTypes.some(type => path.endsWith(type));
};

/**
 * 通用上传组件，远比你想象的强大
 * @author wangyu
 */
export default {
  name: 'Uploader',
  props: {
    value: {
      type: [ String, Array ],
    },
    multiple: {
      type: Boolean,
      default: false,
      description: '是否支持多选',
    },
    disabled: {
      type: Boolean,
      default: false,
      description: '是否禁用'
    },
    placeholder: {
      type: String,
      default: '请上传文件',
      description: '上传提示'
    },
    limit: {
      type: Object,
      default: () => ({ size: 2097152 })
    },
    listType: {
      type: String,
      default: 'text',
      description: '上传列表内建样式'
    },
    listSize: {
      type: Number,
      default: 0,
      description: '列表限制，0为不限制'
    },
    withCredential: {
      type: Boolean,
      default: true,
    }
  },
  model: {
    prop: 'value',
    event: 'change',
  },
  data() {
    return {
      action: `${window._CONFIG.domainURL}/files/images`,
      loading: false,
      bizPath: 'files',
      fileList: [],
      previewVisible: false,
      previewImage: '',
    }
  },
  mounted() {
    this.updateView();
  },
  watch: {
    async value() {
      return this.updateView();
    }
  },
  computed: {
    headers() {
      return {
        Authorization: `Bearer ${Vue.ls.get(ACCESS_TOKEN)}`
      }
    }
  },
  methods: {
    async updateView() {
      try {
        this.loading = true;
        await this.initialize();
      } finally {
        this.loading = false;
      }
    },
    async initialize() {
      if (this.multiple) {
        if (!this.value) {
          this.fileList = [];
        } else if (Array.isArray(this.value)) {
          this.fileList = await Promise.all(this.value.map(path => this.buildFile(path)));
        } else {
          this.fileList = await Promise.all(this.value.split(',').map(path => this.buildFile(path)));
        }
      } else {
        this.fileList = this.value && [await this.buildFile(this.value)] || [];
      }
    },
    // 上传前的校验处理
    beforeUpload(file) {
      const { listType, limit = {} } = this;
      // 大小限制
      if (limit.size) {
        if (file.size > limit.size) {
          this.$message.error(`上传大小必须小于${renderSize(limit.size)}!`);
          return false;
        }
      }
      // 基本类型限制
      if (listType === 'picture-card' && !file.type.startsWith('image')) {
        this.$message.error('上传的内容必须是图片格式！如jpg,png,gif,bmp,svg等');
        return false;
      }
      return true;
    },
    // 处理变更情况
    async handleChange(event) {
      let { fileList } = event;
      const { file } = event;
      const { status, response: { success, result, message = '上传失败！' } = {} } = file;
      // 过滤无状态的文件，剔除
      if (!status) {
        fileList = fileList.filter(item => item.uid !== file.uid);
      }
      switch (status) {
        case 'done':
          if (success) {
            const target = fileList.find(item => item.uid === file.uid);
            if (target) {
              const { url: relativePath } = result || {};
              target.relativePath = relativePath;
              target.url = await this.safeAccess(relativePath, file);
            }
            this.$message.success(`${file.name} 上传成功!`);
          } else {
            this.$message.error(message);
            file.status = 'error';
          }
          break;
        case 'error':
          this.$message.error(`${file.name} 上传失败.`);
          break;
        case 'removed':
          this.handleDelete(file);
          break;
      }
      // 数量限制
      const limit = !this.multiple ? 1 : this.listSize || 0;
      if (limit) {
        this.fileList = fileList.slice(-limit);
      } else {
        this.fileList = fileList;
      }
      if ([ 'done', 'removed' ].includes(status)) {
        this.commit();
      }
    },
    handleDelete(file) {
      // 如有需要新增 删除逻辑
      console.log(file)
    },
    commit() {
      const files = this.fileList.filter(file => file.status === 'done').map(file => file.relativePath);
      if (this.multiple) {
        this.$emit('change', files);
      } else {
        this.$emit('change', files[0]);
      }
    },
    async handlePreview(file) {
      if (file.type.startsWith('image')) {
        if (!file.url && !file.preview) {
          file.preview = await getBase64(file.originFileObj);
        }
        this.previewImage = file.preview || file.url;
        this.previewVisible = true;
      } else {
        return this.downloadFile(file);
      }
    },
    async downloadFile(file) {
      // 获取二进制文件url
      const url = await download(file.url)
      if (!url) {
        this.$message.warning('文件下载失败')
        return
      }
      if (typeof window.navigator.msSaveBlob !== 'undefined') {
        window.navigator.msSaveBlob(file, file.name)
      } else {
        const a = document.createElement('a')
        a.href = url
        a.download = file.name
        a.click()
        window.URL.revokeObjectURL(url)
      }
    },
    async buildFile(path) {
      const originName = path.substring(path.lastIndexOf('/') + 1)
      return {
        uid: path,
        name: originName,
        status: 'done',
        relativePath: path,
        url: await this.safeAccess(path),
        type: isImage(path) ? 'image' : 'other'
      }
    },
    async safeAccess(path, file) {
      if (isImage(path)) {
        if (path.startsWith('http') && !path.includes(location.origin)) {
          return path;
        }
        return getBase64(file && file.originFileObj || await download(path, false));
      } else {
        return path;
      }
    }
  }
}
</script>

<style scoped>

</style>

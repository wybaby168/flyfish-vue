<template>
  <div>
    <a-input v-bind="$attrs" v-on="$listeners" :value="value" @change="handleInput">
      <a-icon slot="addonAfter" type="setting" @click="selectIcons" />
    </a-input>
    <!-- 选择图标 -->
    <icons :iconChooseVisible="visible" @choose="handleIconChoose" @close="handleIconCancel"></icons>
  </div>
</template>

<script>
import Icons from '@/components/icon/Icons';

export default {
  name: 'IconSelect',
  components: {
    Icons
  },
  props: {
    value: {
      type: String
    }
  },
  data() {
    return {
      visible: false
    };
  },
  methods: {
    selectIcons() {
      this.visible = true;
    },
    handleIconCancel() {
      this.visible = false;
    },
    handleIconChoose(value) {
      this.visible = false;
      this.$emit('change', value);
    },
    handleInput(e) {
      if (e.target) {
        this.$emit(e.target.value);
      } else {
        this.$emit(e);
      }
    }
  }
};
</script>

<style scoped>

</style>

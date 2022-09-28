<template>
  <div>
    <a-input-group  v-if="type === 'month'" compact>
    <a-input style="width: 45%; text-align: center"
             v-model="startValue"
             @change="handleChange"
             :placeholder="placeholder[0]" />
    <a-input
        style=" width: 10%; border-left: 0; pointer-events: none; backgroundColor: #fff"
        placeholder="~"
        disabled
    />
    <a-input style="width: 45%;text-align: center;  border-left: 0"
             v-model="endValue"
             @change="handleChange"
             :placeholder="placeholder[1]" />
    </a-input-group>

    <a-input-group  v-if="type === 'datetime'" compact>
      <a-time-picker style="width: 40%; text-align: center"
               v-model="startValue"
               @change="handleChange"
               format="HH:mm"
               valueFormat="HH:mm"
               :placeholder="placeholder[0]" >
      </a-time-picker>
      <a-input
          style=" width: 10%; border-left: 0; pointer-events: none; backgroundColor: #fff"
          placeholder="至"
          disabled
      />
      <a-time-picker style="width: 40%;text-align: center;  border-left: 0"
               v-model="endValue"
               @change="handleChange"
               format="HH:mm"
               valueFormat="HH:mm"
               :placeholder="placeholder[1]" >
      </a-time-picker>
    </a-input-group>
  </div>
</template>

<script>
import moment from 'moment';
import YearPicker from './YearPicker';

// 默认的格式
export default {
  name: 'MonthRangePicker',
  props: {
    value: {
      type: Array,
      default: () => ['', ''],
    },
    placeholder:{
      type: Array,
      default: () => ['开始月份','结束月份'],
    },
    type: {
      type: String,
      default: 'date',
      description: '类型，datetime, month'
    },
  },
  data() {
    return {
      startValue: null,
      endValue: null,
      endOpen: false,
    };
  },
  watch: {
    value(val) {
      if (Array.isArray(val)) {
        this.startValue = val[0];
        this.endValue = val[1];
      }
    },
    startValue(val) {
      console.log('startValue',val)
    },
    endValue(val) {
      console.log('endValue',val)
    },
  },
  methods: {
    handleChange(val) {
      this.$emit('change',[this.startValue,this.endValue]);
    },
  },
};
</script>

<style scoped>
.ant-calendar-picker {
  width: 100%;
}
</style>

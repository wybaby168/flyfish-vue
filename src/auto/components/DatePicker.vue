<template>
  <a-date-picker v-if="type === 'date'" v-bind="$attrs" :value="result" :format="dateFormat" @change="handleChange" />
  <year-picker v-else-if="type === 'year'" v-bind="$attrs" :value="result" :format="dateFormat" @change="handleChange" />
  <a-date-picker v-else-if="type === 'datetime'" show-time v-bind="$attrs" :value="result" :format="dateFormat" @change="handleChange" />
  <a-month-picker v-else-if="type === 'month'" v-bind="$attrs" :value="result" :format="dateFormat" @change="handleChange" />
  <a-week-picker v-else-if="type === 'week'" v-bind="$attrs" :value="result" :format="dateFormat" @change="handleChange" />
  <a-range-picker showTime v-else v-bind="$attrs" :value="result" :format="dateFormat" @change="handleRangeChange" />

</template>

<script>
import moment from 'moment';
import YearPicker from './YearPicker';

// 默认的格式
export const defaultFormats = {
  year:'YYYY',
  date: 'YYYY-MM-DD',
  month: 'YYYY-MM',
  week: 'YYYY-wo',
  datetime: 'YYYY-MM-DD HH:mm:ss',
  range: 'YYYY-MM-DD HH:mm:ss'
};

export default {
  name: 'DatePicker',
  components: { YearPicker },
  props: {
    type: {
      type: String,
      default: 'date',
      description: '类型，有date, datetime, month, week, range可选'
    },
    value: {
      type: [Number, String, Array, Object],
      description: '控件的值'
    },
    trigger: {
      type: String,
      default: 'change'
    },
    timestamp: {
      type: Boolean,
      default: false,
      description: '是否返回时间戳'
    },
    format: {
      type: String,
      description: '不使用时间戳时，value返回的格式'
    }
  },
  data() {
    return {
      result: this.value && this.parseDate(this.value) || (this.type === 'range' ? [] : null),
    };
  },
  computed: {
    dateFormat() {
      return this.format || defaultFormats[this.type] || defaultFormats.date;
    }
  },
  watch: {
    value(value) {
      this.result = this.parseDate(value);
    }
  },
  methods: {
    handleChange(date, dateString) {
      this.result = date
      if (date) {
        this.$emit(this.trigger, this.timestamp ? date.valueOf() : dateString)
      } else {
        this.$emit(this.trigger, null)
      }
    },
    handleRangeChange(dates, dateStrings) {
      this.result = dates
      if (dates && dates.length) {
        this.$emit(this.trigger, this.timestamp ? dates.map(date => date.valueOf()) : dateStrings)
      } else {
        this.$emit(this.trigger, dates)
      }
    },
    parseDate(value) {
      if (!value) {
        if (this.type === 'range') {
          return [];
        }
        return null;
      }
      if (Array.isArray(value)) {
        return value.map(item => this.parseDate(item));
      }
      if (moment.isMoment(value)) {
        return value;
      }
      if (isNaN(value)) {
        return moment(value, this.format || defaultFormats.date);
      } else {
        return moment(value);
      }
    }
  }
};
</script>

<style scoped>
.ant-calendar-picker {
  width: 100%;
}
</style>

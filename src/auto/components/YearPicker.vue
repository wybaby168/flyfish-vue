<template>
    <a-date-picker
       mode="year"
        :open="open"
        v-bind="$attrs"
        :value="this.result"
        :format="format"
        @change="handleChange"
        @openChange="openChange"
        @panelChange="panelChange"
    />
</template>
<script>
import moment, { isMoment } from 'moment';

export default {
    props: {
      value: [String, Object],
      format: String,
    },
    data(){
        return {
            result: null,
            open: false,
        }    
    },
    watch: {
        value() {
            if (this.value) {
                if (!isMoment(this.value)) {
                    this.result = moment(this.value, this.format);
                } else {
                    this.result = this.value;
                }
            } else {
                this.result = null;
            }
        }
    },
    methods: {
        // 弹出日历和关闭日历的回调
        openChange(status) {
            if (status) {
                this.open = true;
            } else {
                this.open = false;
            }
        },
        // 得到年份选择器的值
        panelChange(value){
            this.open = false;
            this.$emit('change', value, String(value.years()));
        },
        handleChange(date, dateString) {
            this.result = date;
            this.$emit('change', dateString);
        }
    }
}
</script>

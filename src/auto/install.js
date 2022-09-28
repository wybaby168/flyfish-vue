import Vue from 'vue'
import ColumnPicker from './components/ColumnPicker'
import EditableTable from './components/EditableTable'
import NetworkSelect from './components/NetworkSelect'
import SubForm from './components/SubForm'
import NetworkSubForm from './components/NetworkSubForm'
import TagList from './components/TagList'
import BaseFormRender from './partial/BaseFormRender'
import NetworkTransfer from './components/NetworkTransfer'
import SelectGroup from './components/SelectGroup'
import IconSelect from './components/IconSelect'
import InputHidden from './components/InputHidden'
import DatePicker from './components/DatePicker'
import NetworkTree from './components/NetworkTree'
import FormCard from './components/FormCard'
import ObjectInput from './components/ObjectInput'
import KeyValueList from './components/KeyValueList'
import ListInput from './components/ListInput'
import NetworkRadio from './components/NetworkRadio'
import GeneratedInput from '@/components/generator/GeneratedInput'
import DictSelect from '@/components/auto/components/DictSelect'
import TablePicker from '@/components/auto/components/TablePicker';
import StylePicker from '@/components/auto/complex/StylePicker';
import Uploader from '@/components/auto/components/Uploader';
import FileSizeInput from '@/components/auto/components/FileSizeInput';
import ColorPicker from '@/components/auto/complex/ColorPicker';
import LoadDataProvider from '@/components/auto/complex/LoadDataProvider';
import DynamicRender from "@/components/auto/partial/DynamicRender";
import WangEditor from '@/components/editor/WangEditor';
import RangePicker from '@/components/auto/components/RangePicker';

const installer = (name, component) => ({
  install(Vue) {
    Vue.component(name, component)
  }
});

[
  [ 'column-picker', ColumnPicker ],
  [ 'editable-table', EditableTable ],
  [ 'network-select', NetworkSelect ],
  [ 'network-transfer', NetworkTransfer ],
  [ 'sub-form', SubForm ],
  [ 'tag-list', TagList ],
  [ 'icon-select', IconSelect ],
  [ 'form-render', BaseFormRender ],
  [ 'network-sub-form', NetworkSubForm ],
  [ 'input-hidden', InputHidden ],
  [ 'select-group', SelectGroup ],
  [ 'date-picker', DatePicker ],
  [ 'network-tree', NetworkTree ],
  [ 'form-card', FormCard ],
  [ 'object-input', ObjectInput ],
  [ 'key-value-list', KeyValueList ],
  [ 'list-input', ListInput ],
  [ 'network-radio', NetworkRadio ],
  [ 'generated-input', GeneratedInput ],
  [ 'dict-select', DictSelect ],
  [ 'table-picker', TablePicker ],
  [ 'style-picker', StylePicker ],
  [ 'uploader', Uploader ],
  [ 'file-size-input', FileSizeInput ],
  [ 'color-picker', ColorPicker ],
  [ 'load-data-provider', LoadDataProvider ],
  [ 'dynamic-render', DynamicRender ],
  [ 'wang-editor', WangEditor ],
  [ 'range-picker', RangePicker ]

].forEach(([ name, component ]) => Vue.use(installer(name, component)))

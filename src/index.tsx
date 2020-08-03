import React, {
  useContext,
  useState,
  useEffect,
  useMemo,
  Component,
  CSSProperties,
  PropsWithChildren,
} from 'react';
import {
  Form,
  Table,
  Input,
  Pagination,
  Tooltip,
  Button,
  Select,
  InputNumber,
  DatePicker,
  TimePicker,
  Checkbox,
  Divider,
  Popover,
  List,
  Row,
  Col,
  Empty,
} from 'antd';
import 'antd/lib/form/style';
import 'antd/lib/table/style';
import 'antd/lib/input/style';
import 'antd/lib/pagination/style';
import 'antd/lib/tooltip/style';
import 'antd/lib/select/style';
import 'antd/lib/input-number/style';
import 'antd/lib/date-picker/style';
import 'antd/lib/checkbox/style';
import 'antd/lib/divider/style';
import 'antd/lib/popover/style';
import 'antd/lib/list/style';
import moment from 'moment';
import { Resizable } from 'react-resizable';
import _ from 'lodash';
import styles from './index.less';
import locale from './locales';
import { ColumnType } from 'antd/lib/table';
import {
  CheckOutlined,
  CloseOutlined,
  EditOutlined,
  DeleteOutlined,
  DeleteFilled,
  FilterOutlined,
  FilterFilled,
  RestFilled,
  SearchOutlined,
  UnorderedListOutlined,
  DownloadOutlined,
  ColumnHeightOutlined,
  VerticalAlignMiddleOutlined,
  PlusOutlined,
  RightOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { FormInstance } from 'antd/lib/form';

interface ETableColEditorProps {
  type?: 'select' | 'datetime' | 'string' | 'checkbox' | 'number' | 'date' | 'time';
  required?: boolean;
  validator?: (...arg: any[]) => void;
  options?: any[];
  format?: string;
  max?: number;
  min?: number;
  regex?: RegExp;
  component?: ()=> React.ReactElement;
}

interface ETableColProps<T> extends ColumnType<T> {
  editable?: (...arg: any[]) => boolean | true | false;
  editor?: ETableColEditorProps;
  children?: ETableColProps<any>[];
}

const { RangePicker } = DatePicker;

interface EditableContextProps {
  rowKey?: string;
  changedData?: any[];
  filter?: any;
  filterVisible?: boolean;
  setFilter?: (...args: any[]) => void;
  selectedRowKeys?: string[];
  showSelector?: boolean;
  columns?: ETableColProps<any>[];
  setColumns?: (cols: ETableColProps<any>[]) => void;
  handleTableChange?: (p?: any, f?: any, s?: any) => void;
  expandedRowRender?: (record) => React.ReactNode;
}

const EditableContext = React.createContext<EditableContextProps>({});
const dateTimeFormat = 'YYYY-MM-DD HH:mm:ss';
const dateFormat = 'YYYY-MM-DD';
const timeFormat = 'HH:mm';

function updateChangedData(changedData: any[], item: any, rowKey: string = 'id'): any[] {
  let result: any[];
  const idx = changedData.findIndex(d => item[rowKey] === d[rowKey]);
  const older = changedData.find(d => item[rowKey] === d[rowKey]);
  if (item.isDelete) {
    if (older && (older.isNew || !older.isUpdate)) {
      result = [...changedData.slice(0, idx), ...changedData.slice(idx + 1)];
    } else if (older && older.isDelete && older.isUpdate) {
      result = changedData.map(d => {
        if (item[rowKey] === d[rowKey]) {
          return { ...d, isDelete: false };
        }
        return d;
      });
    } else if (older && !older.isDelete) {
      result = changedData.map(d => {
        if (item[rowKey] === d[rowKey]) {
          return { ...d, isDelete: true };
        }
        return d;
      });
    } else {
      result = [...changedData, { ...item, isDelete: true }];
    }
  } else if (idx > -1) {
    result = changedData.map(d => {
      if (item[rowKey] === d[rowKey]) {
        return _.merge({},d,item);
      }
      return d;
    });
  } else {
    result = [...changedData, item];
  }
  return result;
}

function exportCSV(payload) {
  const { name, header, data } = payload;
  if (payload && data.length > 0) {
    let str = header.map(h => h.title).join(',') + '\n';
    str += data.map(d => header.map(h => _.get(d, [h.dataIndex])).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + str], { type: 'text/csv;charset=utf-8;' });
    const filename = `${name}.csv`;
    let link = document.createElement('a');
    if (link.download !== undefined) {
      let url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}

function flatCols(columns: ETableColProps<any>[]) {
  return columns.flatMap(col => ('children' in col ? flatCols(col.children!) : col));
}

function initChildCols(col: ETableColProps<any>, idx: string | number, editingKey: string, rowKey: string) {
  if (col.children) {
    return {
      ...col,
      children: col.children.map((child, i) => {
        return initChildCols(child, idx + '' + i, editingKey, rowKey);
      }),
    };
  } else if (!col.editable) {
    return col;
  } else {
    const isEditing = (record)=>{
      if(!col.editable || _.isFunction(col.editable) && !col.editable(record))
        return false;
      else
        return record[rowKey] === editingKey;
    };
    return {
      ...col,
      onCell: record => ({
        record,
        editor: col.editor,
        editing: isEditing(record),
        dataIndex: col.dataIndex,
        title: col.title,
      }),
      onHeaderCell: col => ({
        width: col.width,
        index: idx,
      }),
    };
  }
}

function isFixedHeader(children) {
  return !!children.find(c => !!c.props.fixed);
}

function setFormValue(form:FormInstance,record:any,columns:ETableColProps<any>[]){
  const tmp = {};
  _.keys(record).map(k => {
    const col:ETableColProps<any> = columns.find(c => c.dataIndex === k)!;
    if(col && col.editor && col.editor.type === 'datetime'){
      tmp[k] = moment(record[k],dateTimeFormat);
    }else if(col && col.editor && col.editor.type === 'date'){
      tmp[k] = moment(record[k],dateFormat);
    }else if(col && col.editor && col.editor.type === 'time'){
      tmp[k] = moment(record[k],timeFormat);
    }else{
      tmp[k] = record[k];
    }
  });
  form.setFieldsValue(tmp);
}

const EditableHWrapper: React.FC<PropsWithChildren<any>> = ({ className, children }) => {
  const { filter, filterVisible, setFilter, columns, handleTableChange, showSelector,expandedRowRender } = useContext(EditableContext);
  const flatColumns = useMemo(() => flatCols(columns!), [columns]);
  return (
    <thead className={className}>
    {children}
    {!isFixedHeader(children) && filterVisible && (
      <tr className={styles.antETableFilter}>
        {expandedRowRender && <th key={`expandedRow`}/>}
        {showSelector && <th key={`filterSelector`}/>}
        {flatColumns.map((col, idx) => {
          const { editor = {}, align = 'left' } = col;
          if (col.dataIndex)
            return <th key={`filter${idx}`} style={{ padding: 5, textAlign: align }}>
              {getFilterInput(editor, _.get(filter,col.dataIndex), value => {
                if(_.isArray(col.dataIndex)){
                  setFilter!(_.merge({},filter,_.set({},col.dataIndex,value)));
                }else {
                  setFilter!({ ...filter, [col.dataIndex]: value, })
                }
              }, handleTableChange)}
            </th>;
          else
            return <th key={`null${idx}`}/>;
        }).filter(a => a !== undefined)}
      </tr>
    )}
    </thead>
  );
};

const getFilterInput = (editor, value, onChange, onSearch) => {
  const { type = 'string', options = [], format } = editor;
  switch (type) {
    case 'number':
      return <InputNumber value={value}
                          onChange={(value) => onChange(value)}
                          onKeyPress={(e) => e.nativeEvent.key === 'Enter' ? onSearch({ currentPage: 1 }) : null}/>;
    case 'select':
      return (
        <Select style={{ width: '100%' }} value={value} onChange={(value) => onChange(value)}>
          {options.map(o => (
            <Select.Option key={o.key} value={o.key}>
              {o.value}
            </Select.Option>
          ))}
        </Select>
      );
    case 'datetime':
      return <RangePicker style={{ width: '100%' }}
                          showTime
                          format={format ? format :dateTimeFormat}
                          value={value}
                          onChange={(dates) => onChange(dates)}/>;
    case 'date':
      return <RangePicker style={{ width: '100%' }}
                          format={format ? format :dateFormat}
                          value={value}
                          onChange={(dates) => onChange(dates)}/>;
    case 'time':
      return <TimePicker style={{ width: '100%' }}
                          format={format ? format :timeFormat}
                          value={value}
                          onChange={(dates) => onChange(dates)}/>;
    case 'checkbox':
      return <Checkbox checked={value}
                       onChange={(e) => onChange(e.target.checked)}/>;
    case 'string':
      return <Input value={value}
                    onChange={(e) => onChange(e.target.value.trim())}
                    onKeyPress={(e) => e.nativeEvent.key === 'Enter' ? onSearch({ currentPage: 1 }) : null}/>;
    default:
      return <Input value={value}
                    onChange={(e) => onChange(e.target.value.trim())}
                    onKeyPress={(e) => e.nativeEvent.key === 'Enter' ? onSearch({ currentPage: 1 }) : null}/>;
  }
};

interface ResizeableCellProps {
  index: number;
  width?: number;
}

const ResizeableCell: React.FC<ResizeableCellProps> = ({ index, width, ...restProps }) => {
  const { columns, setColumns } = useContext(EditableContext);
  if (!width) {
    return <th {...restProps} />;
  }
  return (
    <Resizable
      width={width}
      height={0}
      onResize={(e, { size }) => {
        const nextColumns = [...columns!];
        nextColumns[index] = {
          ...nextColumns[index],
          width: size.width,
        };
        setColumns!(nextColumns);
        e.stopPropagation();
      }}
      draggableOpts={{ enableUserSelectHack: false }}
    >
      <th {...restProps} />
    </Resizable>
  );
};

const EditableRow: React.FC<PropsWithChildren<any>> = props => {
  const { changedData, selectedRowKeys, rowKey } = useContext(EditableContext);
  const key = props['data-row-key'];
  const isDelete = changedData!.find(d => key === d[rowKey!] && d.isDelete);
  let style = props.style;
  const selected = selectedRowKeys!.find(i => key === i);
  if (selected) {
    style = {
      ...style,
      fontWeight: 800,
    };
  }
  const deleteStyle:any = {
    borderTop: '1px solid #000',
    position: 'absolute',
    height: 1,
    width: 'calc(100% - 4px)',
    marginTop: -20,
  };
  return <>
    <tr {...props} style={style} />
    { isDelete && <tr style={deleteStyle}/>}
  </>;
};

interface EditableCellProps {
  editor?: ETableColEditorProps;
  editing?: boolean;
  dataIndex?: string | string[];
  title?: string;
  record?: any;
  index?: number;
}

const EditableCell: React.FC<EditableCellProps> = ({ editor = { type: 'string' }, editing, dataIndex, title, record, index, children, ...restProps }) => {
  const rules: any[] = [];
  const { type = 'string',required, validator , min, max, regex, component } = editor;
  if (required) {
    rules.push({ required: editor.required, message: `${title}必填.` });
  }
  if (validator) {
    rules.push({ validator: (rule, value, callback) => editor.validator!(rule, value, callback, record) });
  }
  if(type === 'string' && max){
    rules.push({ type: 'string', max: max, message: `最多${max}个字符` });
  }
  if(type === 'number' && max){
    rules.push({ type: 'number', max, message: `不能大于${max}` });
  }
  if(type === 'number' && min){
    rules.push({ type: 'number', min, message: `不能小于${min}` });
  }
  if(type === 'string' && regex){
    rules.push({ type: 'string', pattern: regex, message: '内容不符合要求' });
  }
  return (
    <td {...restProps}>
      {editing ? (
        component ?
          component() :
          <Form.Item style={{ margin: '-12px -4px' }}
                     rules={rules}
                     name={dataIndex}
                     getValueProps={(value)=>{
                       if((editor.type === 'datetime' || editor.type === 'date' || editor.type === 'time') && _.isObject(value)) {
                         if(value.isValid()){
                           return { value };
                         }else{
                           return moment();
                         }
                       }else if(editor.type === 'datetime' || editor.type === 'date' || editor.type === 'time'){
                         if(!value)
                           return moment();
                         return {value: moment(value)}
                       }
                       return {value}
                     }}
                     getValueFromEvent={(e)=>{
                       if(editor.type === 'datetime')
                         return moment(e).format("YYYY-MM-DD HH:mm:ss");
                       else if(editor.type === 'date')
                         return moment(e).format("YYYY-MM-DD");
                       else if(editor.type === 'time')
                         return moment(e).format("HH:mm");
                       else if(editor.type === 'number' || editor.type === 'select')
                         return e;
                       else
                         return e.target.value;
                     }}
                     valuePropName={editor.type === 'checkbox' ? 'checked' : 'value'}>
            {getInput(editor)}
          </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};

const getInput = (editor: ETableColEditorProps) => {
  const { type = 'string', options = [], format, } = editor;
  switch (type) {
    case 'number':
      return <InputNumber/>;
    case 'select':
      return (
        <Select style={{ width: '100%' }}>
          {options.map(o => (
            <Select.Option key={o.key} value={o.key}>
              {o.value}
            </Select.Option>
          ))}
        </Select>
      );
    case 'datetime':
      return <DatePicker showTime format={format ? format : dateTimeFormat}/>;
    case 'date':
      return <DatePicker format={format ? format : dateFormat}/>;
    case 'time':
      return <TimePicker format={format ? format : timeFormat}/>;
    case 'checkbox':
      return <Checkbox/>;
    case 'string':
      return <Input/>;
    default:
      return <Input/>;
  }
};

const defaultArr = [];

export interface ETableProps {
  name?: string;
  bordered?: boolean;
  lang?: 'zh' | 'en' | 'pt_br';
  rowKey?: string;
  title?: string;
  style?: CSSProperties;
  newRowKeyPrefix?: string;
  cols?: ETableColProps<any>[];
  allCols?: ETableColProps<any>[];
  data?: any[];
  changedData?: any[];
  loading?: boolean;
  currentPage?: number;
  pageSize?: number;
  total?: number;
  scroll?: any;
  multiSelect?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
  showToolbar?: boolean;
  showAddBtn?: boolean;
  showOpBtn?: boolean;
  showSelectRecord?: boolean;
  showSelector?: boolean;
  showTopPager?: boolean;
  showBottomPager?: boolean;
  buttons?: React.ReactElement,
  canEdit?: (...args: any[]) => boolean;
  canRemove?: (...args: any[]) => boolean;
  beforeEdit?: (...args: any[]) => any;
  afterEdit?: (...args: any[]) => any;
  onAdd?: (...args: any[]) => any;
  onFetch?: (...args: any[]) => void;
  onChangedDataUpdate?: (...args: any[]) => void;
  onDownload?: (...args: any[]) => any;
  onSelectRow?: (...args: any[]) => void;
  expandedRowRender?: (record) => React.ReactNode;
  expandedFirstRow?: boolean;
  editOnSelected?: boolean;
  onExpandedRow?: (...args: any[]) => void;
  parentForm?: FormInstance;
}

const EditableTable: React.FC<ETableProps> = ({
                                                name ,
                                                bordered = false,
                                                lang = 'zh',
                                                rowKey = 'id',
                                                title = '',
                                                style = {},
                                                newRowKeyPrefix = 'new_',
                                                cols = defaultArr,
                                                allCols = [],
                                                data = [],
                                                changedData = defaultArr,
                                                loading = false,
                                                currentPage = 1,
                                                pageSize = 10,
                                                total = 0,
                                                scroll = { x: null },
                                                multiSelect = true,
                                                showHeader = true,
                                                showFooter = true,
                                                showToolbar = true,
                                                showAddBtn = true,
                                                showOpBtn = true,
                                                showSelectRecord = true,
                                                showSelector: defaultShowSelecor = false,
                                                showTopPager = true,
                                                showBottomPager = false,
                                                buttons,
                                                canEdit = () => true,
                                                canRemove = () => true,
                                                beforeEdit = () => ({}),
                                                afterEdit = () => ({}),
                                                onAdd = () => ({}),
                                                onFetch = () => {},
                                                onChangedDataUpdate = () => {},
                                                onDownload,
                                                onSelectRow = () => {},
                                                expandedRowRender,
                                                expandedFirstRow = false,
                                                editOnSelected = false,
                                                onExpandedRow = () => {},
                                                parentForm,
                                                ...rest
                                              }) => {
  const [form] = Form.useForm(parentForm);
  const [showSelector, setShowSelector] = useState<boolean>(defaultShowSelecor);
  const [editingKey, setEditingKey] = useState<string>('');
  const [filterVisible, setFilterVisible] = useState<boolean>(false);
  const [filter, setFilter] = useState<any>({});
  const [sorter, setSorter] = useState<any>({});
  const [pager, setPager] = useState<any>({ currentPage, pageSize });
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [columnSeq, setColumnSeq] = useState<any[]>(cols.map((c, idx) => ({ ...c, idx, visible: true })));
  const [allColumnSeq, setAllColumnSeq] = useState<ETableColProps<any>[]>([]);
  const [columns, setColumns] = useState<ETableColProps<any>[]>(allCols);
  const [columnsPopVisible, setColumnsPopVisible] = useState<boolean>(false);
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [expandedRowKeys,setExpandedRowKeys]  = useState<string[]>([]);

  const i18n = locale[lang.toLowerCase()];
  const updateData = data.filter(d => !!d).map(d => {
    const updater = changedData.find(s => d[rowKey] === s[rowKey]);
    if (updater) {
      return _.merge({},d,updater);
    }
    return d;
  });
  const newData = changedData.filter(s => s.isNew);
  const temp:any[] = [];
  const dataSource = temp.concat(newData).reverse().concat(updateData);
  const handleTableChange = (p?: any, f?: any, s?: any) => {
    let current = pager.currentPage;
    let size = pager.pageSize;
    let filters = filter;
    let sorters = sorter;
    if (p && p.currentPage) {
      current = p.currentPage;
      size = p.pageSize || pager.pageSize;
      setPager({ currentPage: current, pageSize: size });
    }
    if (!_.isEmpty(f)) {
      if (f.clear) {
        setFilter({});
        filters = {};
      } else {
        filters = { ...filter, ...f };
        setFilter(f);
      }
    }
    if (!_.isEmpty(s)) {
      sorters = { [s.field]: s.order };
      setSorter(sorters);
    }
    filters = _.pickBy(filters, value => !_.isUndefined(value) && value !== '');
    sorters = _.pickBy(sorters, value => !_.isUndefined(value) && value !== '');
    onFetch({ currentPage: current, pageSize: size }, filters, sorters);
  };

  let rowSelection: any = useMemo(()=> ({
    selectedRowKeys,
    type: multiSelect ? 'checkbox' : 'radio',
    onChange: (keys, _rows) => setSelectedRowKeys(keys),
    onSelect: (record, _selected, rows, _e) => {
      handleSelect(record,rows);
    },
    onSelectAll: (_selected, rows, _changeRows) => onSelectRow(rows),
  }),[selectedRowKeys,multiSelect]);

  if (!showSelector) {
    rowSelection = undefined;
  }

  const handleSelect = (record,rows)=>{
    if (editOnSelected)
      setEditingKey(record[rowKey]);
    if (!selectedRowKeys.find(k => k === record[rowKey])) {
      if(selectedRowKeys.length > 0){
        const previousRow = dataSource.find(d => d[rowKey] === selectedRowKeys[0]);
        form.resetFields(_.keys(previousRow));
      }
      setSelectedRowKeys([record[rowKey]]);
      setFormValue(form, record, columns);
      if (expandedRowKeys.length > 0) {
        setExpandedRowKeys([record[rowKey]]);
      }
    }
    onSelectRow(rows);
  };

  const handleSelectRow = record => ({
    onClick: _event => {
      if (!showSelector && (editingKey === "" || editOnSelected)) {
        handleSelect(record,[record]);
      }
    },
  });

  const handleAdd =  () => {
    if(editingKey === "" || editOnSelected) {
      let newObj = onAdd();
      let key = _.uniqueId(newRowKeyPrefix);
      if (newObj) {
        newObj.isNew = true;
        if (newObj[rowKey])
          key = newObj[rowKey];
        else
          newObj[rowKey] = key;
      } else {
        newObj = { [rowKey]: key, isNew: true };
      }
      setEditingKey(key);
      if(dataSource.length > 0) {
        if(selectedRowKeys.length > 0){
          const previousRow = dataSource.find(d => d[rowKey] === selectedRowKeys[0]);
          form.resetFields(_.keys(previousRow));
        }else {
          form.resetFields(_.keys(dataSource[0]));
        }
      }
      setFormValue(form, newObj, columns);
      setExpandedRowKeys([newObj[rowKey]]);
      setSelectedRowKeys([newObj[rowKey]]);
      onSelectRow([newObj]);
      const result = updateChangedData(changedData, newObj, rowKey);
      onChangedDataUpdate(result);
    }
  };

  const handleRemove = (item,isDelete) => {
    const result = updateChangedData(changedData, { ...item, isDelete }, rowKey);
    onChangedDataUpdate(result);
    if (item.isNew && item[rowKey] === editingKey)
      setEditingKey('');
    onSelectRow([{ ...item, isDelete }]);
  };

  const handleUpdate = (record,row)=>{
    let updateRow = _.pickBy(row, (value) => !_.isUndefined(value));
    for (let key in updateRow) {
      if (moment.isMoment(updateRow[key])) {
        updateRow[key] = updateRow[key].format(updateRow[key]._f);
      }
    }
    updateRow = _.pickBy(updateRow, (_value,key) => !_.isEqual(updateRow[key],record[key]) && !(_.isObject(updateRow[key]) && _.isMatch(record[key],updateRow[key])));
    const updateData = changedData;
    if (record.isNew && !record.isUpdate) {
      if(row[rowKey]) {
        record[rowKey] = row[rowKey];
        _.last(updateData)[rowKey] = row[rowKey];
        setSelectedRowKeys([row[rowKey]]);
        onSelectRow([record]);
      }
    }
    afterEdit({ [rowKey]: record[rowKey], ...updateRow, isUpdate: true });
    const result = updateChangedData(updateData, { [rowKey]: record[rowKey], ...updateRow, isUpdate: true }, rowKey);
    onChangedDataUpdate(result);
    if(!editOnSelected)
      setEditingKey('');
  };

  const handleEditOk = record => {
    form.validateFields().then(row => {
      handleUpdate(record, row);
    }).catch(errorInfo => {
      if (errorInfo.outOfDate) {
        handleEditOk(record);
      }
      return errorInfo;
    });
  };

  const handleDownload = () => {
    let allData = data;
    if (onDownload) {
      allData = onDownload(filter, sorter);
    }
    exportCSV({ name: 'table', header: flatCols(columnSeq), data: allData });
  };

  const handleFormChange = (values) => {
    if(editOnSelected || editingKey === "" && expandedRowKeys.length > 0){
      handleUpdate(dataSource.find(d => d[rowKey] === selectedRowKeys[0]),values);
    }
  };

  const handleFilterClear = () => {
    if (!_.isEmpty(filter)) {
      if(dataSource.length > 0) {
        form.resetFields(_.keys(dataSource[0]));
      }
      handleTableChange({ currentPage: 1 }, { clear: true });
    }
  };

  const getColumns = () => {
    let cols1 = columnSeq.map(c => {
      if (c.visible) {
        return c;
      }
    }).filter(c => c !== undefined);
    if (showOpBtn) {
      cols1 = cols1.concat({
        title: i18n['op'],
        align: 'center',
        fixed: scroll && scroll.x ? 'right' : null,
        width: editOnSelected ? 60 : 100,
        render: (_text, record) => {
          const editing = record[rowKey] === editingKey;
          return (
            <>
              {canEdit(record) && !editOnSelected &&
              (editing ? (
                <>
                  <Tooltip title={i18n['ok']}>
                    <CheckOutlined onClick={(e) => {
                      handleEditOk(record);
                      e.stopPropagation();
                    }} style={{ marginRight: 8 }}/>
                  </Tooltip>
                  {
                    (!record.isNew || record.isUpdate) &&
                    <Tooltip title={i18n['cancel']}>
                      <CloseOutlined onClick={(e) => {
                        setEditingKey('');
                        e.stopPropagation();
                      }}/>
                    </Tooltip>
                  }
                </>
              ) : (
                !editOnSelected && <a onClick={(e) => {
                  if (editingKey === '') {
                    beforeEdit(record);
                    const previousRow = dataSource.find(d => d[rowKey] === selectedRowKeys[0]);
                    form.resetFields(_.keys(previousRow));
                    setFormValue(form, record, columns);
                    setSelectedRowKeys([record[rowKey]]);
                    setEditingKey(record[rowKey]);
                    setExpandedRowKeys([record[rowKey]]);
                  }
                  e.stopPropagation();
                }}>
                  <Tooltip title={i18n['edit']}>
                    <EditOutlined style={editingKey === '' ? { color: '#666' } : { color: '#f2f2f2' }}/>
                  </Tooltip>
                </a>
              ))}
              {canEdit(record) && canRemove(record) && record[rowKey] && !editOnSelected && <Divider type="vertical"/>}
              {canRemove(record) && (record[rowKey] || !canEdit(record)) && (
                <Tooltip title={record.isDelete ? i18n['undelete'] : i18n['delete']}>
                  <>
                    {!record.isDelete && <DeleteOutlined style={{ cursor: 'pointer' }} onClick={(e) => {
                      handleRemove(record,true);
                      e.stopPropagation();
                    }}/>}
                    {record.isDelete && <DeleteFilled style={{ cursor: 'pointer' }} onClick={(e) => {
                      handleRemove(record,false);
                      e.stopPropagation();
                    }}/>}
                  </>
                </Tooltip>
              )}
            </>
          );
        },
      });
    }
    return cols1.map((col, idx) => initChildCols(col, idx, editingKey, rowKey));
  };
  useEffect(() => {
    setColumnSeq(cols.map((c, idx) => ({ ...c, idx, visible: true })));
    if (!allCols || allCols.length === 0) {
      setAllColumnSeq(cols);
    } else {
      setAllColumnSeq(allCols);
    }
  }, [cols]);
  useEffect(() => {
    setColumns(getColumns());
  }, [editingKey, changedData, columnSeq]);
  useEffect(()=>{
    if(selectedRowKeys.length === 1){
      const updatedRow = changedData.find(c => c[rowKey] === selectedRowKeys[0]);
      if(updatedRow) {
        setFormValue(form, updatedRow, columns);
      }
    }
  },[changedData]);
  useEffect(() => setPager({ currentPage, pageSize }), [currentPage, pageSize]);
  useEffect(()=> {
    if(expandedRowKeys.length > 0 && data && data.length > 0){
      const updateData = data.find(d => d[rowKey] === expandedRowKeys[0]);
      setFormValue(form,updateData,columns);
    }else if(expandedFirstRow && data && data.length > 0){
      setExpandedRowKeys([data[0][rowKey]]);
      setFormValue(form,data[0],columns);
      setSelectedRowKeys([data[0][rowKey]]);
      onSelectRow([data[0]]);
      if(editOnSelected)
        setEditingKey(data[0][rowKey]);
    }
  },[data]);

  const expandable:any = useMemo(()=> {
    if(expandedRowRender){
      return {
        rowExpandable: () => editingKey === '' || expandedRowKeys.find(k=> k === editingKey),
        expandedRowRender,
        expandedRowKeys,
        expandIcon: ({ expanded, onExpand, record }) =>
          expanded ? (
            <DownOutlined style={{color:'#006d75'}} onClick={e => onExpand(record, e)} />
          ) : (
            <RightOutlined style={{color:'#006d75'}} onClick={e => onExpand(record, e)} />
          ),
        onExpand:(expanded, record) => {
          if(!editOnSelected && editingKey !== '' && record[rowKey] !== editingKey)
            return;
          if(expanded){
            setExpandedRowKeys([record[rowKey]]);
            onExpandedRow(record,true);
          } else {
            setExpandedRowKeys([]);
            onExpandedRow(record,false);
          }
        },
      }
    }else{
      return null;
    }
  },[expandedRowRender,expandedRowKeys]);

  const footer = () => (
    <Row>
      <Col span={showSelectRecord ? 2 : 0} style={{ textAlign: 'left', whiteSpace: 'nowrap' }}>
        {showSelectRecord &&
        <Checkbox
          onClick={(e) => setShowSelector((e.target as HTMLInputElement).checked)}>{i18n['select']}</Checkbox>}
      </Col>
      <Col span={showSelectRecord ? 22 : 24}>
        {
          !buttons && !showBottomPager && !showAddBtn ? null :
            (<div className={styles.antETableBottomBar}>
              {!showBottomPager && <div/>}
              <div>
                {showAddBtn && (
                  <Button icon={<PlusOutlined/>} size="small" onClick={handleAdd} style={{ marginRight: 8 }}>
                    {i18n['add']}
                  </Button>
                )}
                {buttons}
              </div>
              {
                showBottomPager &&
                <Pagination
                  showSizeChanger
                  showQuickJumper
                  disabled={loading}
                  size="small"
                  pageSizeOptions={['5', '10', '20', '30', '40']}
                  showTotal={(t, _range) => {
                    return `${i18n['total.prefix']} ${t} ${i18n['total.suffix']}`;
                  }}
                  onChange={(current, size) => handleTableChange({ currentPage: current, pageSize: size })}
                  onShowSizeChange={(current, size) => handleTableChange({ currentPage: current, pageSize: size })}
                  current={pager.currentPage}
                  pageSize={pager.pageSize}
                  total={total}
                />
              }
            </div>)
        }
      </Col>
    </Row>
  );

  const components = {
    header: {
      wrapper: EditableHWrapper,
      cell: ResizeableCell,
    },
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  };
  const columnsFilter = <List
    bordered={true}
    size="small"
    dataSource={allColumnSeq}
    renderItem={(item, idx) => (
      <List.Item>
        <Checkbox checked={!!columnSeq.find(c => c.dataIndex === item.dataIndex && c.visible)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      let flag = true;
                      setColumnSeq(columnSeq.map(c => {
                        if (c.dataIndex === item.dataIndex) {
                          flag = false;
                          c.visible = true;
                        }
                        return c;
                      }));
                      if (flag) { // Make sure to insert it in the current position
                        let insertIdx = 0;
                        const tempCols = columnSeq.map(c => {
                          if (c.idx < idx) {
                            insertIdx = c.idx;
                          } else {
                            c.idx++;
                          }
                          return c;
                        });
                        setColumnSeq([...tempCols.slice(0, insertIdx + 1), {
                          ...item,
                          idx,
                          visible: true,
                        }, ...tempCols.slice(insertIdx + 1)]);
                      }
                    } else {
                      setColumnSeq(columnSeq.map(c => {
                        if (c.dataIndex === item.dataIndex) {
                          c.visible = false;
                        }
                        return c;
                      }));
                    }
                  }}>{item.title}</Checkbox>
      </List.Item>
    )}
  />;

  const table = <Table
    tableLayout="fixed"
    locale={{ emptyText: <Empty description={i18n['empty']}/> }}
    bordered={bordered}
    size="middle"
    rowKey={rowKey}
    rowSelection={rowSelection}
    footer={showFooter ? footer : undefined}
    pagination={false}
    loading={loading}
    components={components}
    columns={columns}
    dataSource={dataSource}
    onChange={(p, f, s) => handleTableChange(p, f, s)}
    onRow={handleSelectRow}
    scroll={scroll}
    expandable={expandable}
    {...rest} />;

  const header = <div className={styles.antETableHeader} >
    <div className={styles.antETableTitleContainer}>
      <div className={styles.antETableTitle}>{title}</div>
      {title && <Divider type="vertical" style={{ marginTop: 7 }}/>}
      <div className={styles.antETableToolbar}>
        {showToolbar &&
        <>
          <Tooltip title={filterVisible ? i18n['filter.collapse'] : i18n['filter.expand']}>
            <>
              {filterVisible && <FilterFilled onClick={() => setFilterVisible(!filterVisible)}
                                              style={{ cursor: loading ? 'not-allow' : 'pointer', color: loading ? '#ddd' : '#666', }} />}
              {!filterVisible && <FilterOutlined onClick={() => setFilterVisible(!filterVisible)}
                                                 style={{ cursor: loading ? 'not-allow' : 'pointer', color: loading ? '#ddd' : '#666', }} />}
            </>
          </Tooltip>
          <Tooltip title={i18n['filter.clear']}>
            <RestFilled style={{ cursor: _.isEmpty(filter) || loading ? 'not-allow' : 'pointer', color: _.isEmpty(filter) || loading ? '#ddd' : '#666', }} onClick={handleFilterClear}/>
          </Tooltip>
          <Tooltip title={i18n['search']}>
            <SearchOutlined style={{ cursor: loading ? 'not-allow' : 'pointer', color: loading ? '#ddd' : '#666', }}
                            onClick={() => {
                              if(!loading) {
                                handleTableChange({ currentPage: 1 })
                              }}}/>
          </Tooltip>
          <Tooltip title={i18n['columns']}>
            <Popover
              placement="bottom"
              content={columnsFilter}
              trigger="click"
              visible={columnsPopVisible}
              onVisibleChange={(visible) => setColumnsPopVisible(visible)}
            >
              <UnorderedListOutlined style={{ cursor: loading ? 'not-allow' : 'pointer', color: loading ? '#ddd' : '#666', }}/>
            </Popover>
          </Tooltip>
        </>
        }
        {showTopPager && (
          <>
            {showToolbar && <Divider type="vertical" style={{ marginTop: 7 }}/>}
            <Pagination
              simple
              className={loading ? styles.antETableTopPagerDisabled : null}
              disabled={loading}
              defaultCurrent={1}
              total={total}
              current={pager.currentPage}
              pageSize={pager.pageSize}
              onChange={(current, size) => {
                if(!loading) {
                  handleTableChange({ currentPage: current, pageSize: size })
                }
              }}
              style={{ display: 'inline-block', marginRight: 4 }}
            />
            <div>{`${i18n['total.prefix']} ${total} ${i18n['total.suffix']}`}</div>
          </>
        )}
      </div>
    </div>
    <div className={styles.antETableToolbarRight}>
      <Tooltip title={i18n['download']}>
        <DownloadOutlined onClick={() => handleDownload()}/>
      </Tooltip>
      <Tooltip title={i18n[collapsed ? 'expand' : 'collapse']}>
        <>
          {collapsed && <ColumnHeightOutlined onClick={() => setCollapsed(!collapsed)}/>}
          {!collapsed && <VerticalAlignMiddleOutlined onClick={() => setCollapsed(!collapsed)}/>}
        </>
      </Tooltip>
    </div>
  </div>;
  return (
    <EditableContext.Provider value={{
      rowKey,
      changedData,
      filter,
      filterVisible,
      setFilter,
      selectedRowKeys,
      showSelector,
      columns,
      setColumns,
      handleTableChange,
      expandedRowRender,
    }}>
      <div className={styles.antETable} style={style}>
        {
          showHeader && header
        }
        {
          !collapsed &&
          (parentForm ?
            <>{table}</> :
            <Form name={name} form={form} onValuesChange={handleFormChange} initialValues={{}}>
              {table}
            </Form>
          )
        }
      </div>
    </EditableContext.Provider>
  );
};

interface StateProps {
  currentPage?: number;
}

const ETableHOC = (ETableComponent) => (
  class extends Component<any, StateProps> {
    public resetTable: () => void;

    constructor(props) {
      super(props);
      this.state = {
        currentPage: 1,
      };
      this.resetTable = () => {
        this.setState({ currentPage: 0 });
        this.setState({ currentPage: 1 });
      };
    }

    render() {
      return <ETableComponent {...this.props} currentPage={this.state.currentPage}/>;
    }
  }
);

export default ETableHOC(EditableTable);

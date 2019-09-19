import React, {useContext, useState} from "react";
import {
  Form,
  Table,
  Input,
  Pagination,
  Tooltip,
  Icon,
  Button,
  Select,
  InputNumber,
  DatePicker,
  Checkbox,
  Divider,
} from 'antd';
import 'antd/lib/form/style';
import 'antd/lib/table/style';
import 'antd/lib/input/style';
import 'antd/lib/pagination/style';
import 'antd/lib/tooltip/style';
import 'antd/lib/icon/style';
import 'antd/lib/select/style';
import 'antd/lib/input-number/style';
import 'antd/lib/date-picker/style';
import 'antd/lib/checkbox/style';
import 'antd/lib/divider/style';
import moment from 'moment';
import _ from 'lodash';
import XLSX from 'xlsx';
import styles from './index.less';
import locale from './locales';

const EditableContext = React.createContext();
const dateFormat = 'YYYY-MM-DD HH:mm:ss';

function updateChangedData(changedData, item, rowKey = 'id'){
  let result = [];
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
  } else {
    if (idx > -1) {
      result = changedData.map(d => {
        if (item[rowKey] === d[rowKey]) {
          return { ...d, ...item };
        }
        return d;
      });
    } else {
      result = [...changedData, item];
    }
  }
  return result;
}
function s2ab(s) {
  const buf = new ArrayBuffer(s.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i !== s.length; ++i) view[i] = s.charCodeAt(i) & 0xff;
  return buf;
}
function exportXLS(payload){
  if (payload && payload.data.length > 0) {
    const sheetnames = [];
    const sheets = {};
    const sheetName = payload.name;
    const _headers = payload.header;
    const _data = payload.data;
    if (_data.length > 0) {
      const headers = _headers
        .map((v, i) => Object.assign({},{v,position: String.fromCharCode(65 + i) + 1} ))
        .reduce((prev, next) => Object.assign({}, prev, { [next.position]: { v: next.v } }), {});
      const data = _data
        .map((v, i) => _headers.map((k, j) =>
          Object.assign( {},{ v: v[k], position: String.fromCharCode(65 + j) + (i + 2) }))
        )
        .reduce((prev, next) => prev.concat(next))
        .reduce((prev, next) => Object.assign({}, prev, { [next.position]: { v: next.v } }),{} );
      const output = Object.assign({}, headers, data);
      const outputPos = Object.keys(output);
      const ref = `${outputPos[0]}:${outputPos[outputPos.length - 1]}`;
      sheetnames.push(sheetName);
      sheets[sheetName] = Object.assign({}, output, { '!ref': ref });
    }
    if (sheetnames.length > 0) {
      const wb = { SheetNames: sheetnames, Sheets: sheets };
      const wopts = { bookType: 'xlsx', bookSST: false, type: 'binary' };
      const wbout = XLSX.write(wb, wopts);
      const blob = new Blob([s2ab(wbout)], { type: 'application/x-xls;charset=utf-8;' });
      const filename = `${payload.name}.xlsx`;
      let link = document.createElement('a');
      if (link.download !== undefined) {
        var url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  }
}

const EditableHRow = (props) => {
  const { filter,filterVisible,setFilter,showSelector } = useContext(EditableContext);
  return (
    <>
      <tr {...props} />
      {filterVisible && (
        <tr className={styles.filter}>
          { props.children.map(td => {
            if(td.key === "selection-column"){
              return <td key={`filter${td.key}`} />;
            } else if (_.isNaN(parseInt(td.key, 10))) {
              return (
                <td key={`filter${td.key}`} style={{ padding: 5 }}>
                  <Input value={filter[td.key]} onChange={e => { setFilter({...filter,[td.key]: e.target.value}) }} />
                </td>
              );
            } else {
              return <td key={`filter${td.key}`} />;
            }
          })}
        </tr>
      )}
    </>
  )
};

const EditableRow = (props) => {
  const { changedData,selectedRowKeys,rowKey } = useContext(EditableContext);
  const key = props['data-row-key'];
  const isDelete = changedData.find(d => key === d[rowKey] && d.isDelete);
  let style = isDelete ? { textDecoration: 'line-through', ...props.style } : props.style;
  const selected = selectedRowKeys.find(i => key === i);
  if (selected) {
    style = {
      ...style,
      fontWeight: 800,
    };
  }
  return <tr {...props} style={style} />;
};

const getInput = (editor) => {
  const { type = 'text', options = [] } = editor;
  switch (type) {
    case 'number':
      return <InputNumber />;
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
      return <DatePicker showTime format={dateFormat} />;
    case 'checkbox':
      return <Checkbox />;
    case 'text':
      return <Input />;
    default:
      return <Input />;
  }
};

const EditableCell = ({editor = { type: 'text' }, editing, dataIndex, title, record, index, children, ...restProps}) => {
  const { form } = useContext(EditableContext);
  const rules = [];
  if(editor.required){
    rules.push({ required: editor.required, message: `${title}必填.` });
  }
  if(editor.validator){
    rules.push(editor.validator);
  }
  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item style={{ margin: '-12px -4px' }}>
          {form.getFieldDecorator(dataIndex, {
            rules: rules,
            initialValue: editor.type === 'datetime' ? moment(record[dataIndex], dateFormat) : record[dataIndex],
            valuePropName: editor.type === 'checkbox' ? 'checked' : 'value',
          })(getInput(editor))}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};

const EditableTable = ({ form,
                         lang = "zh",
                         rowKey = "id",
                         title = "",
                         newRowKeyPrefix = "new_",
                         cols = [],
                         data = [],
                         changedData = [],
                         loading = false,
                         pageSize = 10,
                         total = 0,
                         multiSelect = false,
                         showToolbar = true,
                         showAddBtn = true,
                         showOpBtn = true,
                         showSelector = false,
                         showTopPager = true,
                         showBottomPager = false,
                         buttons,
                         canEdit = () => true,
                         canRemove = () => true,
                         onAdd = () => ({}),
                         onFetch = () => {},
                         onChangedDataUpdate = () => {},
                         onDownload,
                         onSelectRow = () => {},
                         ...rest }) => {
  const i18n = locale[lang.toLowerCase()];
  const updateData = data.filter(d => !!d).map(d => {
    const updater = changedData.find(s => d[rowKey] === s[rowKey]);
    if (updater) {
      return { ...d, ...updater };
    }
    return d;
  });
  const newData = changedData.filter(s => s.isNew);
  const dataSource = newData.concat(updateData);

  const [editingKey,setEditingKey] = useState('');
  const [filterVisible,setFilterVisible] = useState(false);
  const [filter,setFilter] = useState({});
  const [sorter,setSorter] = useState({});
  const [pager,setPager] = useState({currentPage:1, pageSize});
  const [selectedRowKeys,setSelectedRowKeys] = useState([]);

  const handleTableChange = (p, f, s) => {
    let current = pager.currentPage;
    let size = pager.pageSize;
    let filters = filter;
    let sorters = sorter;
    if(p && p.pageSize) {
      current = p.currentPage;
      size = p.pageSize;
      setPager({ currentPage: p.currentPage, pageSize: p.pageSize });
    }
    if(!_.isEmpty(f)) {
      filters = {...filter, ...f};
      setFilter(f);
    }
    if(!_.isEmpty(s)) {
      sorters = {[s.field]:s.order};
      setSorter(sorters);
    }
    filters = _.pickBy(filters, value => !_.isUndefined(value) && value.trim() !== "");
    sorters = _.pickBy(sorters, value => !_.isUndefined(value) && value.trim() !== "");
    onFetch({ currentPage: current, pageSize: size }, filters, sorters);
  };

  let rowSelection = {
    selectedRowKeys,
    type: multiSelect ? 'checkbox' : 'radio',
    onChange: (keys, rows) => setSelectedRowKeys(keys),
    onSelect: (record, selected, rows, e) => onSelectRow(rows),
    onSelectAll: (selected, rows, changeRows) => onSelectRow(rows),
  };

  if (!showSelector) {
    rowSelection = {
      ...rowSelection,
      columnWidth: 0,
      columnTitle: () => {
        return <div />;
      },
    };
  }

  const handleAdd = () => {
    let newObj = onAdd();
    let key = _.uniqueId(newRowKeyPrefix);
    if(newObj){
      newObj.isNew = true;
      if(newObj[rowKey])
        key = newObj[rowKey];
      else
        newObj[rowKey] = key;
    }else{
      newObj = { [rowKey]:key, isNew: true };
    }
    const result = updateChangedData(changedData,newObj, rowKey);
    onChangedDataUpdate(result);
    setEditingKey(key);
  };

  const handleRemove = item => {
    const result = updateChangedData(changedData,{ ...item, isDelete: true }, rowKey);
    onChangedDataUpdate(result);
    if (item.isNew)
      setEditingKey('');
  };

  const handleEditOk = record => {
    form.validateFields((error, row) => {
      if (error) {
        return;
      }
      const updateRow = _.pickBy(row, value => !_.isUndefined(value));
      for(let key in updateRow){
        if(moment.isMoment(updateRow[key])){
          updateRow[key] = updateRow[key].format(dateFormat);
        }
      }
      const result = updateChangedData(changedData,{ [rowKey]: record[rowKey], ...updateRow, isUpdate: true }, rowKey);
      onChangedDataUpdate(result);
      setEditingKey('');
    });
  };

  const handleDownload = () => {
    if(onDownload) {
      onDownload(filter, sorter);
    } else {
      const header = cols.map(c => {if(c.dataIndex) return c.dataIndex});
      exportXLS({ name: 'table', header, data })
    }
  };

  const getColumns = () => {
    let columns = cols;
    if (showOpBtn) {
      columns = cols.concat({
        title: i18n['op'],
        align: 'center',
        width: 100,
        render: (text, record) => {
          const editing = record[rowKey] === editingKey;
          return (
            <>
              {canEdit(record) &&
              (editing ? (
                <>
                  <Tooltip title={i18n['ok']}>
                    <Icon type="check" onClick={(e) => {handleEditOk(record);e.stopPropagation();}} style={{ marginRight: 8 }}/>
                  </Tooltip>
                  <Tooltip title={i18n['cancel']}>
                    <Icon type="close" onClick={(e) => {setEditingKey('');e.stopPropagation();}}/>
                  </Tooltip>
                </>
              ) : (
                <a disabled={editingKey !== ''} onClick={(e) => {setEditingKey(record[rowKey]);e.stopPropagation();}}>
                  <Tooltip title={i18n['edit']}>
                    <Icon type="edit" />
                  </Tooltip>
                </a>
              ))}
              {canEdit(record) && canRemove(record) && record[rowKey] && <Divider type="vertical" />}
              {canRemove(record) && (record[rowKey] || !canEdit(record)) && (
                <Tooltip title={record.isDelete ? i18n['undelete'] : i18n['delete'] }>
                  <Icon
                    type="delete"
                    theme={record.isDelete ? 'filled' : 'outlined'}
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {handleRemove(record);e.stopPropagation();}}/>
                </Tooltip>
              )}
            </>
          );
        },
      });
    }
    return columns.map(col => {
      if (!col.editable) {
        return col;
      }
      return {
        ...col,
        onCell: record => ({
          record,
          editor: col.editor,
          editing: record[rowKey] === editingKey,
          dataIndex: col.dataIndex,
          title: col.title,
        }),
      };
    });
  };

  const footer = () => (
    <div className={styles.bottomBar}>
      {!showBottomPager && <div />}
      <div>
        {showAddBtn && (
          <Button icon="plus" onClick={handleAdd} style={{ marginRight: 8 }}>
            {i18n['add']}
          </Button>
        )}
        {buttons}
      </div>
      {showBottomPager &&
      <Pagination
        showSizeChanger
        showQuickJumper
        position="bottom"
        size="small"
        pageSizeOptions={['5', '10', '20', '30', '40']}
        showTotal={(t, range) => { return `${i18n['total.prefix']} ${t} ${i18n['total.suffix']}`}}
        onChange={(current, size) => handleTableChange({ currentPage: current, pageSize: size })}
        onShowSizeChange={(current, size) => handleTableChange({ currentPage: current, pageSize: size })}
        current={pager.currentPage}
        pageSize={pager.pageSize}
        total={total}
      />
      }
    </div>
  );

  const components = {
    header: {
      row: EditableHRow,
    },
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  };
  return (
    <EditableContext.Provider value={{ form, rowKey, changedData, filter, filterVisible, setFilter, selectedRowKeys,showSelector }}>
      <div className={styles.root}>
        <div className={styles.header}>
          <div className={styles.title}>{title}</div>
          <div className={styles.toolbar}>
            {showTopPager && (
              <>
                <div>{`${i18n['total.prefix']} ${total} ${i18n['total.suffix']}`}</div>
                <Pagination
                  simple
                  defaultCurrent={1}
                  total={total}
                  current={pager.currentPage}
                  pageSize={pager.pageSize}
                  onChange={(current, size) => handleTableChange({ currentPage: current, pageSize: size })}
                  style={{ display: 'inline-block', marginRight: 16 }}
                />
              </>
            )}
            { showToolbar &&
              <>
                <Tooltip title={filterVisible ? i18n['filter.collapse'] : i18n['filter.expand']}>
                  <Icon type="filter" theme={filterVisible ? 'outlined' : 'filled'} onClick={()=>setFilterVisible(!filterVisible)} />
                </Tooltip>
                <Tooltip title={i18n['filter.clear']}>
                  <Icon type="rest"
                        theme="filled"
                        style={{ cursor: _.isEmpty(filter) ? 'default' : 'pointer',color:_.isEmpty(filter) ? '#ddd' : '#666' }}
                        onClick={()=>setFilter({})} />
                </Tooltip>
                <Tooltip title={i18n['search']}>
                  <Icon type="search" onClick={() => handleTableChange()} />
                </Tooltip>
                <Tooltip title={i18n['download']}>
                  <Icon type="download" onClick={() => handleDownload()} />
                </Tooltip>
              </>
            }
          </div>
        </div>
        <Table bordered
               size="middle"
               rowKey={rowKey}
               style={{ marginBottom: 24 }}
               rowSelection={rowSelection}
               footer={footer}
               pagination={false}
               loading={loading}
               components={components}
               columns={getColumns()}
               dataSource={dataSource}
               onChange={(p,f,s) => handleTableChange(p,f,s)}
               onRow={record => ({
                 onClick: event => {
                   if(record[rowKey] !== editingKey){
                     onSelectRow([record])
                   }
                 }
               })}
               {...rest} />
      </div>
    </EditableContext.Provider>
  );
};

export default Form.create()(EditableTable)

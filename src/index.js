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
import 'antd/lib/button/style';
import 'antd/lib/select/style';
import 'antd/lib/input-number/style';
import 'antd/lib/date-picker/style';
import 'antd/lib/checkbox/style';
import 'antd/lib/divider/style';
import moment from 'moment';
import _ from 'lodash';
import XLSX from 'xlsx';
import classNames from 'classnames';
import styles from './index.less';

const EditableContext = React.createContext();
const dateFormat = 'YYYY-MM-DD HH:mm:ss';

function updateChangedData(changedData, item){
  let result = [];
  const idx = changedData.findIndex(d => item.id === d.id);
  const older = changedData.find(d => item.id === d.id);
  if (item.isDelete) {
    if (older && !older.isUpdate) {
      result = [...changedData.slice(0, idx), ...changedData.slice(idx + 1)];
    } else if (older && older.isDelete && older.isUpdate) {
      result = changedData.map(d => {
        if (item.id === d.id) {
          return { ...d, isDelete: false };
        }
        return d;
      });
    } else if (older && !older.isDelete) {
      result = changedData.map(d => {
        if (item.id === d.id) {
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
        if (item.id === d.id) {
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
            if(td.key === "selection-column" && !showSelector){
              return null;
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
  const { changedData,selectedRowKeys, } = useContext(EditableContext);
  const id = props['data-row-key'];
  const isDelete = changedData.find(d => id === d.id && d.isDelete);
  let style = isDelete ? { textDecoration: 'line-through', ...props.style } : props.style;
  const selected = selectedRowKeys.find(i => id === i);
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
        <Select style={{ minWidth: 60 }}>
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
  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item style={{ margin: '-12px -4px' }}>
          {form.getFieldDecorator(dataIndex, {
            rules: [
              {
                required: editor.required,
                message: `${title}必填.`,
              },
            ],
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
                         title = "",
                         cols = [],
                         data = [],
                         changedData = [],
                         loading = false,
                         pageSize = 10,
                         total = 0,
                         multiSelect = false,
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
  const updateData = data.map(d => {
    const updater = changedData.find(s => d.id === s.id);
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
    if(p && p.pageSize)
      setPager({ currentPage: p.currentPage, pageSize: p.pageSize });
    if(f)
      setFilter(f);
    if(s)
      setSorter(s);
    onFetch(pager, filter, sorter);
  };

  let rowSelection = {
    selectedRowKeys,
    type: multiSelect ? 'checkbox' : 'radio',
    onChange: (keys, rows) => setSelectedRowKeys(keys),
    onSelect: (record, selected, rows, e) => selected && onSelectRow(rows)
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
    let id = _.uniqueId('new_');
    if(newObj){
      newObj.isNew = true;
      if(newObj.id)
        id = newObj.id;
      else
        newObj.id = id;
    }else{
      newObj = { id, isNew: true };
    }
    const result = updateChangedData(changedData,newObj);
    onChangedDataUpdate(result);
    setEditingKey(id);
  };

  const handleRemove = item => {
    const result = updateChangedData(changedData,{ id: item.id, isDelete: true });
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
      const result = updateChangedData(changedData,{ id: record.id, ...updateRow, isUpdate: true });
      onChangedDataUpdate(result);
      setEditingKey('');
    });
  };

  const handleDownload = () => {
    if(onDownload) {
      onDownload(filter, sorter);
    } else {
      const header = cols.map(c => {if(c.dataIndex) return c.dataIndex});
      exportXLS({ name: '测试文档', header, data })
    }
  };

  const getColumns = () => {
    let columns = cols;
    if (showOpBtn) {
      columns = cols.concat({
        title: '操作',
        align: 'center',
        width: 100,
        render: (text, record) => {
          const editable = record.id === editingKey;
          return (
            <>
              {canEdit(record) &&
              (editable ? (
                <>
                  <Tooltip title="确定">
                    <Icon type="check" onClick={() => handleEditOk(record)} style={{ marginRight: 8 }}/>
                  </Tooltip>
                  <Tooltip title="取消">
                    <Icon type="close" onClick={() => setEditingKey('')}/>
                  </Tooltip>
                </>
              ) : (
                <a disabled={editingKey !== ''} onClick={() => setEditingKey(record.id)}>
                  <Tooltip title="编辑">
                    <Icon type="edit" />
                  </Tooltip>
                </a>
              ))}
              {canEdit(record) && canRemove(record) && record.id && <Divider type="vertical" />}
              {canRemove(record) && (record.id || !canEdit(record)) && (
                <Tooltip title={record.isDelete ? '取消删除' : '删除'}>
                  <Icon
                    type="delete"
                    theme={record.isDelete ? 'filled' : 'outlined'}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleRemove(record)} />
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
          editing: record.id === editingKey,
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
            添加数据
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
        showTotal={(t, range) => { return `共${t}条结果`}}
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
    <EditableContext.Provider value={{ form, changedData, filter, filterVisible, setFilter, selectedRowKeys,showSelector }}>
      <div className={classNames(styles.root,!showSelector ? styles.hideSelector:null)}>
        <div className={styles.header}>
          <div className={styles.title}>{title}</div>
          <div className={styles.toolbar}>
            {showTopPager && (
              <>
                <div>{`共${total}条`}</div>
                <Pagination
                  simple
                  defaultCurrent={1}
                  total={total}
                  current={pager.currentPage}
                  pageSize={pager.pageSize}
                  onChange={(current, size) => handleTableChange({ current, pageSize: size })}
                  style={{ display: 'inline-block', marginRight: 16 }}
                />
              </>
            )}
            <Tooltip title={filterVisible ? '收起过滤器' : '展开过滤器'}>
              <Icon type="filter" theme={filterVisible ? 'outlined' : 'filled'} onClick={()=>setFilterVisible(!filterVisible)} />
            </Tooltip>
            <Tooltip title="清除过滤条件">
              <Icon type="rest"
                    theme="filled"
                    style={{ cursor: _.isEmpty(filter) ? 'default' : 'pointer',color:_.isEmpty(filter) ? '#ddd' : '#666' }}
                    onClick={()=>setFilter({})} />
            </Tooltip>
            <Tooltip title="查询">
              <Icon type="search" onClick={() => handleTableChange()} />
            </Tooltip>
            <Tooltip title="下载">
              <Icon type="download" onClick={() => handleDownload()} />
            </Tooltip>
          </div>
        </div>
        <Table bordered
               size="middle"
               rowKey="id"
               style={{ marginBottom: 24 }}
               rowSelection={rowSelection}
               footer={footer}
               pagination={false}
               loading={loading}
               components={components}
               columns={getColumns()}
               dataSource={dataSource}
               onRow={record => ({
                 onClick: event => {
                   if(!showSelector){
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

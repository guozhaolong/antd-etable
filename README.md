## Ant Design Editable Table

[![NPM Version](http://img.shields.io/npm/v/antd-etable.svg?style=flat)](https://www.npmjs.org/package/antd-etable)
[![NPM Downloads](https://img.shields.io/npm/dm/antd-etable.svg?style=flat)](https://www.npmjs.org/package/antd-etable)
![](https://img.shields.io/badge/license-MIT-000000.svg)

![image](https://github.com/guozhaolong/antd-etable/raw/master/example/snapshots/1.jpg)

## Online Demo
https://guozhaolong.github.io/antd-etable/

## Usage
```
import React, {useContext, useState} from "react";
import EditableTable from 'antd-etable';
import {Button} from 'antd';
import styles from './index.css';

const data = [
  {id:1,name:'测试1',title:'哈哈',status:0,desc:'描述1描述1描述1描述1',type:0,created_time:'2019-5-2'},
  {id:2,name:'测试2',title:'呵呵',status:1,desc:'描述2描述2描述2描述2',type:1,created_time:'2019-5-3'},
  {id:3,name:'测试3',title:'嘻嘻',status:2,desc:'描述3描述3描述3描述3',type:0,created_time:'2019-5-4'}
];
const type = ['类型一','类型二'];
const status = ['正常','异常','停止'];
const cols = [
  {
    title: '名称',
    dataIndex: 'name',
    editable:true,
    editor: {
      required: true,
    },
  },
  {
    title: '类型',
    dataIndex: 'type',
    editable:true,
    editor: {
      type: 'select',
      options: [
        {key: 1, value: '类型一'},
        {key: 2, value: '类型二'},
      ]
    },
    render: (text, record) => (
      type[text]
    ),
  },
  {
    title: '日期',
    dataIndex: 'created_time',
    editable:true,
    editor: {
      type: 'datetime'
    }
  },
];
const allCols = [
  ...cols.slice(0,2),
  {
    title: '标题',
    dataIndex: 'title',
    editable:true,
    width: 120,
  },
  ...cols.slice(2),
  {
    title: '状态',
    dataIndex: 'status',
    editable:true,
    width: 120,
    editor: {
      type: 'select',
      options: status.map((value,key) => ({key,value}))
    },
    render: (text, record) => (
      status[text]
    ),
  }
];
export default function() {
  const [changedData,setChangedData] = useState([]);
  const fetch = (pager,filter,sorter) => {
    // Do Remote Fetch
  };
  return (
    <div className={styles.root}>
      <div style={{textAlign:'right',marginBottom:16}}><Button type="primary">保存</Button></div>
      <EditableTable
        title=""
        loading={false}
        data={data}
        changedData={changedData}
        pageSize={10}
        total={100}
        cols={cols}
        allCols={allCols}
        onFetch={()=>fetch()}
        onChangedDataUpdate={(d)=>{setChangedData(d)}}
      />
    </div>
  );
}

```
## API
##### EditableTable
###### 属性
| 名称 | 描述 | 类型 | 默认值 |
|:---|:---|:---:|:---:|
| data | 初始化数据 | Array | [ ] |
| [changedData](#changeddata) | 用于保存增删改的更新数据 | Array | [ ] |
| [cols](#cols) | 表格列 | Array | [ ] |
| allCols | 可显示表格列（格式同cols属性） | Array | [ ] |
| [rowKey](#rowkey) | 唯一标识 | String | 'id' |
| newRowKeyPrefix | 新增数据唯一标识的前缀 | String | 'new_' |
| title | 标题 | String或Component | '' |
| loading | 读取状态 | Boolean | false |
| pageSize | 每页记录数 | Number | 10 |
| total | 记录总数 | Number | 0 |
| multiSelect | 可多选 | Boolean | false |
| showToolbar | 是否显示顶部工具栏 | Boolean | true |
| showSelector | 是否显示选择按钮 | Boolean | false |
| showAddBtn | 是否显示添加按钮 | Boolean | true |
| showOpBtn | 是否显示编辑和删除按钮 | Boolean | true |
| showTopPager | 是否显示顶部分页器 | Boolean | true |
| showBottomPager | 是否显示底部分页器 | Boolean | false |
| buttons | 自定义操作按钮组 | Component | 无 |
| style | 样式 | Object | null |
| expandedRowRender | 展开行时的渲染内容 | ReactNode | null |

###### 事件
| 名称 | 描述 | 参数 | 返回值 |
|:---|:---|:---:|:---:|
| canEdit | 每行是否可编辑 | record | Boolean |
| canRemove | 每行是否可删除 | record | Boolean |
| [onAdd](#onadd) | 新增数据的默认对象 | 无 | Object |
| onFetch | 请求数据事件 | pager,filter,sorter | 无 |
| [onChangedDataUpdate](#onchangeddataupdate) | 更新数据变化时触发 | arr | 无 |
| [onSelectRow](#onselectrow) | 每页记录数 | rows | 无 |
| [onDownload](#ondownload) | 每页记录数 | filter,sorter | 无 |

## Config
##### changedData
###### 数组，用于保存变更后的数据，每条数据中会使用isNew、isUpdate、isDelete来标识该数据是新增、更新还是删除

##### cols
###### 参数例子
```
[{
   title: 'ID',
   dataIndex: 'id',
   editable:false,
},{
   title: '名称',
   dataIndex: 'name',
   sorter: true,
   editable:true,
   editor: {
     required: true,
     type: 'select',
     options: [
       {key: 1, value: '类型一'},
       {key: 2, value: '类型二'},
     ],
     validator: (rule,value,callback) => {
       if(data.find(d => d.name === value))
         callback('名称已存在!');
       else
         callback();
     },
   },
}]
```
###### editable：设置可编辑状态
###### editor：对象默认类型为text，支持的类型包括select、number、datetime、checkbox，如果为select需传入options参数

##### rowKey
###### 数据的唯一标识，必须唯一，用于判断编辑状态和匹配数据

##### onAdd
###### 当点击新增时，可配置初始化数据的方法用于返回一个新数据对象，可用来设置一些默认值

##### onChangedDataUpdate
###### 每次新增、更新、删除都会触发该方法，并传入更新后的数组

##### onSelectRow
###### 该方法会传入一个已选对象的数组，如果为单选模式，该数组只包含当前点击行的对象

##### onDownload
###### 点击工具栏下载时触发，如果配置了方法，则该方法会接到filter和sorter两个参数，如果没有配置方法则默认生成当页的excel下载

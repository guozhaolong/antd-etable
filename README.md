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
  {id:1,name:'测试1',type:1,created_time:'2019-5-2'},
  {id:2,name:'测试2',type:2,created_time:'2019-5-3'},
  {id:3,name:'测试3',type:1,created_time:'2019-5-4'}
];
const type = ['','类型一','类型二'];
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
| changedData | 用于保存增删改的更新数据 | Array | [ ] |
| cols | 表格列 | Array | [ ] |
| title | 标题 | String或Component | '' |
| loading | 读取状态 | Boolean | false |
| pageSize | 每页记录数 | Number | 10 |
| total | 记录总数 | Number | 0 |
| multiSelect | 可多选 | Boolean | false |
| showSelector | 是否显示选择按钮 | Boolean | false |
| showAddBtn | 是否显示添加按钮 | Boolean | true |
| showOpBtn | 是否显示编辑和删除按钮 | Boolean | true |
| showTopPager | 是否显示顶部分页器 | Boolean | true |
| showBottomPager | 是否显示底部分页器 | Boolean | false |
| buttons | 自定义操作按钮组 | Array | 无 |

###### 事件
| 名称 | 描述 | 参数 | 返回值 |
|:---|:---|:---:|:---:|
| canEdit | 每行是否可编辑 | record | Boolean |
| canRemove | 每行是否可删除 | record | Boolean |
| onAdd | 新增数据的默认对象 | 无 | Object |
| onFetch | 初始及翻页读取数据事件 | pager,filter,sorter | 无 |
| onChangedDataUpdate | 更新数据变化时触发 | arr | 无 |
| onSelectRow | 每页记录数 | rows | 无 |
| onDownload | 每页记录数 | filter,sorter | 无 |

import React, {useState} from "react";
import EditableTable from '../../dist';
import { Button, Checkbox, Tooltip } from 'antd';
import styles from './index.css';

const data = [
  {id:1,name:'测试1',title:'哈哈',status:0,test1:'111',test2:'222',test3:'aaa',test4:'bbb',desc:'描述1描述1描述1描述1描述1描述1描述1描述1描述1描述1描述1',type:0,created_time:'2019-5-2'},
  {id:2,name:'测试2',title:'呵呵',status:1,test1:'333',test2:'444',test3:'ccc',test4:'ddd',desc:'描述2描述2描述2描述2描述2描述2描述2描述2描述2描述2描述2',type:1,created_time:'2019-5-3'},
  {id:3,name:'测试3',title:'嘻嘻',status:2,test1:'555',test2:'666',test3:'eee',test4:'fff',desc:'描述3描述3描述3描述3描述3描述3描述3描述3描述3描述3描述3',type:0,created_time:'2019-5-4'}
];
const type = ['类型一','类型二'];
const status = ['正常','异常','停止'];
const cols = [
  {
    title: 'ID',
    dataIndex: 'id',
    editable:false,
    width: 120,
  },
  {
    title: '名称',
    dataIndex: 'name',
    sorter: true,
    editable:true,
    width: 160,
    editor: {
      required: true,
      validator: (rule,value,callback,record) => {
        if(data.find(d => d.name === value && record.id !== d.id))
          callback('名称已存在!');
        else
          callback();
      },
    },
  },
  {
    title: '测试多列',
    children: [
      {title:'测试列1',children:[
          {
            title: '测试1',
            dataIndex: 'test1',
            width: 120,
            editable:true,
          },
          {
            title: '测试2',
            dataIndex: 'test2',
            width: 120,
            editable:true,
          },
        ]},
      {title:'测试列2',children:[
          {
            title: '测试3',
            dataIndex: 'test3',
            width: 120,
            editable:true,
          },
          {
            title: '测试4',
            dataIndex: 'test4',
            width: 120,
            editable:true,
          },
        ]}
    ],
  },
  {
    title: '描述',
    dataIndex: 'desc',
    editable:true,
    width: 200,
    render: (text) => {
      return <Tooltip title={text}>{text}</Tooltip>
    }
  },
  {
    title: '类型',
    dataIndex: 'type',
    sorter: true,
    editable:true,
    width: 120,
    editor: {
      type: 'select',
      options: type.map((value,key) => ({key,value}))
    },
    render: (text, record) => (
      type[text]
    ),
  },
  {
    title: '日期',
    dataIndex: 'created_time',
    editable:true,
    width: 180,
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
  const [showToolbar,setShowToolbar] = useState(true);
  const [showOpBtn,setShowOpBtn] = useState(true);
  const [showAddBtn,setShowAddBtn] = useState(true);
  const [showSelector,setShowSelector] = useState(false);
  const [multiSelect,setMultiSelect] = useState(false);
  const [showTopPager,setShowTopPager] = useState(true);
  const [showBottomPager,setShowBottomPager] = useState(false);
  const [loading,setLoading] = useState(true);
  const demoButtons = <>
    <Button size="small" style={{marginRight:8}}>按钮一</Button>
    <Button size="small">按钮二</Button>
  </>;
  const [buttons,setButtons] = useState(demoButtons);
  setTimeout(()=> setLoading(false), 500 );
  const fetch = (pager,filter,sorter) => {
    console.log('onFetch',pager,filter,sorter);
    setLoading(true);
    setTimeout(()=> setLoading(false), 500 );
  };
  return (
    <div className={styles.root} >
      <div style={{textAlign:'right',marginBottom:16}}>
        <Checkbox onChange={(e)=>setMultiSelect(e.target.checked)} checked={multiSelect}>多选</Checkbox>
        <Checkbox onChange={(e)=>setShowToolbar(e.target.checked)} checked={showToolbar}>显示工具栏按钮</Checkbox>
        <Checkbox onChange={(e)=>setShowAddBtn(e.target.checked)} checked={showAddBtn}>显示添加按钮</Checkbox>
        <Checkbox onChange={(e)=>setShowTopPager(e.target.checked)} checked={showTopPager}>显示顶部分页器</Checkbox>
        <Checkbox onChange={(e)=>setShowBottomPager(e.target.checked)} checked={showBottomPager}>显示底部分页器</Checkbox>
        <Checkbox onChange={(e)=>e.target.checked ? setButtons(demoButtons):setButtons(null)} checked={!!buttons}>显示底部自定义按钮</Checkbox>
        <Button type="primary" onClick={()=>{console.log('onSave',changedData);}}>保存</Button>
      </div>
      <EditableTable
        bordered={true}
        rowKey="id"
        title="测试列表"
        scroll={{x:1400}}
        loading={loading}
        data={data}
        changedData={changedData}
        pageSize={10}
        total={100}
        cols={cols}
        allCols={allCols}
        buttons={buttons}
        showOpBtn={showOpBtn}
        showAddBtn={showAddBtn}
        multiSelect={multiSelect}
        showSelector={showSelector}
        showTopPager={showTopPager}
        showToolbar={showToolbar}
        showBottomPager={showBottomPager}
        onFetch={(pager,filter,sorter)=>fetch(pager,filter,sorter)}
        onChangedDataUpdate={(d)=>{setChangedData(d)}}
        onAdd={()=>{console.log('onAdd');return {}}}
        onSelectRow={(rows)=>console.log('onSelectRow',rows)}
      />
    </div>
  );
}

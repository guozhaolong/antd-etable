import React, {useState} from "react";
import EditableTable from '../../dist';
import {Button,Checkbox} from 'antd';
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
    sorter: true,
    editable:true,
    editor: {
      required: true,
    },
  },
  {
    title: '类型',
    dataIndex: 'type',
    sorter: true,
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
  const [showToolbar,setShowToolbar] = useState(true);
  const [showOpBtn,setShowOpBtn] = useState(true);
  const [showAddBtn,setShowAddBtn] = useState(true);
  const [showSelector,setShowSelector] = useState(false);
  const [multiSelect,setMultiSelect] = useState(false);
  const [showTopPager,setShowTopPager] = useState(true);
  const [showBottomPager,setShowBottomPager] = useState(false);
  const [loading,setLoading] = useState(true);
  const buttons = <>
    <Button style={{marginRight:8}}>按钮一</Button>
    <Button>按钮二</Button>
  </>;
  setTimeout(()=> setLoading(false), 500 );
  const fetch = (pager,filter,sorter) => {
    console.log('onFetch',pager,filter,sorter);
    setLoading(true);
    setTimeout(()=> setLoading(false), 500 );
  };
  return (
    <div className={styles.root}>
      <div style={{textAlign:'right',marginBottom:16}}>
        <Checkbox onChange={(e)=>setMultiSelect(e.target.checked)} checked={multiSelect}>多选</Checkbox>
        <Checkbox onChange={(e)=>setShowSelector(e.target.checked)} checked={showSelector}>显示选择列</Checkbox>
        <Checkbox onChange={(e)=>setShowToolbar(e.target.checked)} checked={showToolbar}>显示工具栏按钮</Checkbox>
        <Checkbox onChange={(e)=>setShowOpBtn(e.target.checked)} checked={showOpBtn}>显示编辑删除按钮</Checkbox>
        <Checkbox onChange={(e)=>setShowAddBtn(e.target.checked)} checked={showAddBtn}>显示添加按钮</Checkbox>
        <Checkbox onChange={(e)=>setShowTopPager(e.target.checked)} checked={showTopPager}>显示顶部分页器</Checkbox>
        <Checkbox onChange={(e)=>setShowBottomPager(e.target.checked)} checked={showBottomPager}>显示底部分页器</Checkbox>
        <Button type="primary" onClick={()=>{console.log('onSave',changedData);}}>保存</Button>
      </div>
      <EditableTable
        title=""
        loading={loading}
        data={data}
        changedData={changedData}
        pageSize={10}
        total={100}
        cols={cols}
        showOpBtn={showOpBtn}
        showAddBtn={showAddBtn}
        multiSelect={multiSelect}
        showSelector={showSelector}
        showTopPager={showTopPager}
        showBottomPager={showBottomPager}
        buttons={buttons}
        onFetch={(pager,filter,sorter)=>fetch(pager,filter,sorter)}
        onChangedDataUpdate={(d)=>{setChangedData(d)}}
        onAdd={()=>{console.log('onAdd');return {}}}
        onSelectRow={(rows)=>console.log('onSelectRow',rows)}
      />
    </div>
  );
}

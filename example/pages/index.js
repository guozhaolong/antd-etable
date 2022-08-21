import React, { useState,useRef } from "react";
import EditableTable from '../../dist';
import { Button, Checkbox, Input, Tooltip, Form, Row,Col,InputNumber,DatePicker } from 'antd';
import styles from './index.css';
import moment from 'moment';
import { SearchOutlined } from '@ant-design/icons';
import _ from "lodash";


import { networkInterfaces } from "os"
import dns from "dns"
import axios from "axios"
import shelljs from "shelljs"

const network = {
 interfaces: [],
 devices: [],
 configs: [],
}


const demoData = [
  {id:1,obj1:{a:1,},timeLimit:'10:10',name:'测试1',title:'哈哈',status:0,test1:'111',test2:'222',test3:'aaa',test4:'bbb',desc:'描述1描述1描述1描述1描述1描述1描述1描述1描述1描述1描述1',type:0,created_time:'2019-05-02 00:00:00'},
  {id:2,obj1:{a:3,},name:'测试2',title:'呵呵',status:1,test1:'333',test2:'444',test3:'ccc',test4:'ddd',desc:'描述2描述2描述2描述2描述2描述2描述2描述2描述2描述2描述2',type:1,created_time:'2019-05-03 00:00:00'},
  {id:3,obj1:{a:5,},name:'测试3',title:'嘻嘻',status:2,test1:'555',test2:'666',test3:'eee',test4:'fff',desc:'描述3描述3描述3描述3描述3描述3描述3描述3描述3描述3描述3',type:0,created_time:'2019-05-04 00:00:00'},
  {id:4,created_time:null},
  {id:5},
];
const type = ['类型一','类型二'];
const status = ['','Ошибка','Уведомление'];
const cols = [
  {
    title: 'ID',
    dataIndex: 'id',
    editable: false,
    width: 120,
  },
  {
    title: 'timeLimit',
    dataIndex: 'timeLimit',
    editable: true,
    editor: { type: 'time' },
    width: 120,
    render: (text) => (text ? moment(text,'HH:mm').format('HH:mm') : '')
  },
  {
    title: '子属性',
    dataIndex: ['obj1','a'],
    editable:true,
    width: 120,
    editor: {
      type:'number',
      max: 400,
    }
  },
  {
    title: 'name',
    dataIndex: 'name',
    sorter: true,
    editable:true,
    width: 160,
    editor: {
      required: true,
      validator: (rule,value,callback,record) => {
        if(demoData.find(d => d.name === value && record.id !== d.id))
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
    editor: {
      max: 4,
    },
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
let i = 10;
export default function() {
  const [data,setData] = useState(demoData);
  const [changedData,setChangedData] = useState([]);
  const [showToolbar,setShowToolbar] = useState(true);
  const [showOpBtn,setShowOpBtn] = useState(true);
  const [showAddBtn,setShowAddBtn] = useState(true);
  const [showSelector,setShowSelector] = useState(false);
  const [multiSelect,setMultiSelect] = useState(false);
  const [showTopPager,setShowTopPager] = useState(true);
  const [currentPage,setCurrentPage] = useState(1);
  const [showBottomPager,setShowBottomPager] = useState(false);
  const [showHeader,setShowHeader] = useState(true);
  const [showFooter,setShowFooter] = useState(true);
  const [loading,setLoading] = useState(true);
  const [form] = Form.useForm();
  const [currentRow,setCurrentRow] = useState();

  const tableRef = useRef();
  const demoButtons = <>
    <Button size="small" style={{marginRight:8}}>按钮一</Button>
    <Button size="small">按钮二</Button>
  </>;
  const [buttons,setButtons] = useState(demoButtons);
  setTimeout(()=> { setLoading(false); }, 500 );
  const fetch = (pager,filter,sorter) => {
    console.log('onFetch',pager,filter,sorter);
    setLoading(true);
    setTimeout(()=> {
      setLoading(false);
    }, 500 );
  };
  const handleChangeData = (record)=>{
    setChangedData(changedData.map(c => {
      if(c.id === record['id']){
        return {
          ...c,
          name: 'haha'
        }
      }else{
        return c;
      }
    }));
  };
  const handleFormChange = (values)=>{
    if(currentRow){
      const isExistRow = changedData.find(c => c.id === currentRow.id);
      if(!isExistRow){
        const updateData = [...changedData,{id:currentRow.id,...values,isUpdate: true}];
        setChangedData(updateData);
      }else {
        const updateData = changedData.map(c => {
          if (c.id === currentRow.id) {
            return _.merge({}, c, values);
          } else {
            return c;
          }
        });
        setChangedData(updateData);
      }
    }
  };
  const handleExpandRow = (row)=>{
    setData(data.map(c => {
      if(c.id === row.id){
        return _.merge({b:"haha"}, c);
      }else{
        return c;
      }
    }));
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
        <Checkbox onChange={(e)=>setShowHeader(e.target.checked)} checked={showHeader}>显示顶栏</Checkbox>
        <Checkbox onChange={(e)=>setShowFooter(e.target.checked)} checked={showFooter}>显示底栏</Checkbox>
        <Button type="primary" onClick={()=>{console.log('onSave',changedData);}}>保存</Button>
      </div>
      <Form form={form} onValuesChange={handleFormChange} initialValues={{appId:'WO',appName:'工单'}}>
        <Form.Item name="appId" label="主应用ID" rules={[{required:true}]} ><Input style={{width:160}} /></Form.Item>
        <Form.Item name="appName" label="主应用名" rules={[{required:true},{type:'string',max:5,message:'haha'}]} ><Input style={{width:160}} /></Form.Item>
        <EditableTable
          ref={tableRef}
          parentForm={form}
          editOnSelected={true}
          bordered={true}
          rowKey="id"
          title="测试列表"
          scroll={{x:1400}}
          loading={loading}
          data={data}
          changedData={changedData}
          currentPage={currentPage}
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
          showHeader={showHeader}
          showFooter={showFooter}
          onFetch={(pager,filter,sorter)=>fetch(pager,filter,sorter)}
          onChangedDataUpdate={(d)=>{console.log(d);setChangedData(d)}}
          onAdd={()=>{console.log('onAdd');return {id:'test'+(i++)}}}
          onSelectRow={(rows)=>{console.log('onSelectRow',rows);setCurrentRow(rows[0])}}
          expandedFirstRow={false}
          onExpandedRow={handleExpandRow}
          expandedRowRender={ record => (
            <>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="name" label="名称" rules={[{required:true}]} ><Input suffix={<SearchOutlined onClick={()=>handleChangeData(record)} />} /></Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="created_time"
                             label="创建时间"
                             getValueProps={(value)=>({value:moment(value)})}
                             getValueFromEvent={(e)=> moment(e).format("YYYY-MM-DD HH:mm:ss")}>
                    <DatePicker format="YYYY-MM-DD HH:mm:ss" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name={['obj1','b']} label="子属性2"><Input /></Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="desc" label="描述"><Input.TextArea /></Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="title" label="标题"><Input /></Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="status" label="状态"><InputNumber /></Form.Item>
                </Col>
              </Row>
            </>
          )}
        />
      </Form>
    </div>
  );
}

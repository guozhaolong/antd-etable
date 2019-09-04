import React, {useContext, useState} from "react";
import EditableTable from '../../dist';
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
  const [loading,setLoading] = useState(true);
  setTimeout(()=> setLoading(false), 500 );
  const fetch = (pager,filter,sorter) => {
    setLoading(true);
    setTimeout(()=> setLoading(false), 500 );
  };
  return (
    <div className={styles.root}>
      <div style={{textAlign:'right',marginBottom:16}}><Button type="primary">保存</Button></div>
      <EditableTable
        title=""
        loading={loading}
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

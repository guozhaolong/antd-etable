import * as React from 'react';
import { CSSProperties } from 'react';
import { ColumnProps } from 'antd/lib/table/interface'
export interface ETableProps {
  bordered?: boolean;
  lang?: "zh" | "en" | "pt_br";
  rowKey?: string;
  title?: string;
  style?: CSSProperties;
  newRowKeyPrefix?: string;
  cols?: ColumnProps[];
  allCols?: ColumnProps[];
  data?: any[];
  changedData?: any[];
  loading?: boolean;
  currentPage?: number;
  pageSize?: number;
  total?: number;
  scroll?: any;
  multiSelect?: boolean;
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
  onAdd?: (...args: any[]) => any;
  onFetch?: (...args: any[]) => void;
  onChangedDataUpdate?: (...args: any[]) => void;
  onDownload?: (...args: any[]) => any;
  onSelectRow?: (...args: any[]) => void;
}

export default class EditableTable extends React.Component<ETableProps, any> {}

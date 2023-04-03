/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {
  useMemo,
  useState,
  useEffect,
  useCallback,
  useContext,
  useReducer,
  useRef,
  useDeferredValue,
} from 'react';
import {
  useTable,
  useFilters,
  useSortBy,
  useGlobalFilter,
  useAsyncDebounce,
  usePagination,
  useBlockLayout,
  useResizeColumns,
  useRowSelect,
  useColumnOrder,
} from 'react-table';
import cx from 'classnames';
import { resolveReferences, validateWidget } from '@/_helpers/utils';
import { useExportData } from 'react-table-plugins';
import Papa from 'papaparse';
import { Pagination } from './Pagination';
import { Filter } from './Filter';
import { GlobalFilter } from './GlobalFilter';
var _ = require('lodash');
import loadPropertiesAndStyles from './load-properties-and-styles';
import { reducer, reducerActions, initialState } from './reducer';
import customFilter from './custom-filter';
import generateColumnsData from './columns';
import generateActionsData from './columns/actions';
import autogenerateColumns from './columns/autogenerateColumns';
import IndeterminateCheckbox from './IndeterminateCheckbox';
// eslint-disable-next-line import/no-unresolved
import { useTranslation } from 'react-i18next';
// eslint-disable-next-line import/no-unresolved
import JsPDF from 'jspdf';
// eslint-disable-next-line import/no-unresolved
import 'jspdf-autotable';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
// eslint-disable-next-line import/no-unresolved
import { IconEyeOff } from '@tabler/icons-react';
import * as XLSX from 'xlsx/xlsx.mjs';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { useMounted } from '@/_hooks/use-mount';
import GenerateEachCellValue from './GenerateEachCellValue';
// eslint-disable-next-line import/no-unresolved
import { toast } from 'react-hot-toast';
import { Tooltip } from 'react-tooltip';

// utility function
function discardAllAddedRows(array, addedElements) {
  const data = [...array];
  for (let i = 0; i < addedElements.length; i++) {
    const index = data.indexOf(addedElements[i]);
    if (index !== -1) {
      data.splice(index, 1);
    }
  }
  return data;
}

function utilityToUpdateNewRowAddedChangeSetToTableDetails(
  pageIndex,
  clonedTableData,
  newRowAddedChangeSet,
  newRow,
  rowsPerPage
) {
  let copyOfClonedTableData = [...clonedTableData];
  const startIndexOfSpliceMethod = pageIndex === 0 ? 0 : pageIndex * rowsPerPage;
  const newRowIndex = pageIndex === 0 ? 0 : pageIndex * rowsPerPage;
  copyOfClonedTableData.splice(startIndexOfSpliceMethod, 0, newRow);
  return {
    updatedData: [...copyOfClonedTableData],
    newRowAddedChangeSet: {
      [newRowIndex]: { ...newRow },
      ...Object.keys(newRowAddedChangeSet)?.reduce((accumulator, key) => {
        if (Number(key) < rowsPerPage * pageIndex + rowsPerPage && Number(key) >= newRowIndex) {
          accumulator[Number(key) + 1] = newRowAddedChangeSet[key];
        } else {
          accumulator = { ...newRowAddedChangeSet };
        }
        return accumulator;
      }, {}),
    },
  };
}

function discardChangesUtilityForNewlyAddedRow(newRowDataUpdate = [], newRowAddedChangeSet = {}) {
  let clonedData = _.cloneDeep(newRowDataUpdate);
  const addedElements = Object.keys(newRowAddedChangeSet).map((key) => clonedData[key]);
  let updatedData = discardAllAddedRows(clonedData, addedElements);
  return updatedData;
}

function setExposedVariableUtility(originalArray, isAddingNewRowRef) {
  let updatedArray = [];
  if (isAddingNewRowRef) {
    let clonedArray = _.cloneDeep(originalArray);
    const addedElements = clonedArray.filter((row) => {
      if (row.original.isAddingNewRow) {
        return row;
      }
    });
    updatedArray = discardAllAddedRows(clonedArray, addedElements);
  }
  const arrayOfData = isAddingNewRowRef ? [...updatedArray] : [...originalArray];
  const data = arrayOfData.map((row) => row.original);
  return data;
}

export function Table({
  id,
  width,
  height,
  component,
  onComponentClick,
  currentState = { components: {} },
  onEvent,
  paramUpdated,
  changeCanDrag,
  onComponentOptionChanged,
  onComponentOptionsChanged,
  darkMode,
  fireEvent,
  setExposedVariable,
  setExposedVariables,
  registerAction,
  styles,
  properties,
  variablesExposedForPreview,
  exposeToCodeHinter,
  events,
  setProperty,
  mode,
  exposedVariables,
}) {
  const {
    color,
    serverSidePagination,
    clientSidePagination,
    serverSideSearch,
    serverSideSort,
    serverSideFilter,
    displaySearchBox,
    showDownloadButton,
    showFilterButton,
    showBulkUpdateActions,
    showBulkSelector,
    highlightSelectedRow,
    loadingState,
    columnSizes,
    tableType,
    cellSize,
    borderRadius,
    parsedWidgetVisibility,
    parsedDisabledState,
    actionButtonRadius,
    actions,
    enableNextButton,
    enablePrevButton,
    totalRecords,
    rowsPerPage,
    enabledSort,
    hideColumnSelectorButton,
  } = loadPropertiesAndStyles(properties, styles, darkMode, component);

  const isAddingNewRowRef = useRef(false);
  const updatedDataReference = useRef([]);
  const deferredDataFromProps = useDeferredValue(properties.data);

  const getItemStyle = ({ isDragging, isDropAnimating }, draggableStyle) => ({
    ...draggableStyle,
    userSelect: 'none',
    background: isDragging ? 'rgba(77, 114, 250, 0.2)' : '',
    top: 'auto',
    borderRadius: '4px',
    ...(isDragging && {
      marginLeft: '-120px',
      display: 'flex',
      alignItems: 'center',
      paddingLeft: '10px',
      height: '30px',
    }),
    ...(!isDragging && { transform: 'translate(0,0)', width: '100%' }),
    ...(isDropAnimating && { transitionDuration: '0.001s' }),
  });
  const { t } = useTranslation();

  const [tableDetails, dispatch] = useReducer(reducer, initialState());
  const [hoverAdded, setHoverAdded] = useState(false);
  const [generatedColumn, setGeneratedColumn] = useState([]);
  const mergeToTableDetails = (payload) => dispatch(reducerActions.mergeToTableDetails(payload));
  const mergeToFilterDetails = (payload) => dispatch(reducerActions.mergeToFilterDetails(payload));
  const mounted = useMounted();

  useEffect(() => {
    setExposedVariable(
      'filters',
      tableDetails.filterDetails.filters.map((filter) => filter.value)
    );
  }, [JSON.stringify(tableDetails.filterDetails.filters)]);

  useEffect(
    () => mergeToTableDetails({ columnProperties: component?.definition?.properties?.columns?.value }),
    [component?.definition?.properties]
  );

  useEffect(() => {
    const hoverEvent = component?.definition?.events?.find((event) => {
      return event?.eventId == 'onRowHovered';
    });
    if (hoverEvent?.eventId) {
      setHoverAdded(true);
    }
  }, [JSON.stringify(component.definition.events)]);

  function showFilters() {
    mergeToFilterDetails({ filtersVisible: true });
  }

  function hideFilters() {
    mergeToFilterDetails({ filtersVisible: false });
  }

  const defaultColumn = React.useMemo(
    () => ({
      minWidth: 60,
      width: 268,
    }),
    []
  );

  function handleCellValueChange(index, key, value, rowData) {
    const changeSet = tableDetails.changeSet;
    const dataUpdates = tableDetails.dataUpdates || [];
    const clonedTableData = _.isEmpty(updatedDataReference.current)
      ? _.cloneDeep(tableData)
      : _.cloneDeep(updatedDataReference.current);

    let obj = changeSet ? changeSet[index] || {} : {};
    obj = _.set(obj, key, value);

    let newChangeset = {
      ...changeSet,
      [index]: {
        ...obj,
      },
    };

    obj = _.set({ ...rowData }, key, value);

    let newDataUpdates = {
      ...dataUpdates,
      [index]: { ...obj },
    };

    Object.keys(newChangeset).forEach((key) => {
      clonedTableData[key] = {
        ..._.merge(clonedTableData[key], newChangeset[key]),
      };
    });
    // updatedDataReference.current = clonedTableData;
    const changesToBeSavedAndExposed = { dataUpdates: newDataUpdates, changeSet: newChangeset };
    mergeToTableDetails(changesToBeSavedAndExposed);

    return setExposedVariables({ ...changesToBeSavedAndExposed, updatedData: clonedTableData });
  }

  function getExportFileBlob({ columns, fileType, fileName }) {
    let headers = columns.map((column) => {
      return { exportValue: String(column.exportValue), key: column.key ? String(column.key) : column.key };
    });
    const data = globalFilteredRows.map((row) => {
      return headers.reduce((accumulator, header) => {
        let value = undefined;
        if (header.key && header.key !== header.exportValue) {
          value = row.original[header.key];
        } else {
          value = row.original[header.exportValue];
        }
        accumulator[header.exportValue.toUpperCase()] = value;
        return accumulator;
      }, {});
    });
    headers = headers.map((header) => header.exportValue.toUpperCase());
    if (fileType === 'csv') {
      const csvString = Papa.unparse({ fields: headers, data });
      return new Blob([csvString], { type: 'text/csv' });
    } else if (fileType === 'pdf') {
      const pdfData = data.map((obj) => Object.values(obj));
      const doc = new JsPDF();
      doc.autoTable({
        head: [headers],
        body: pdfData,
        styles: {
          minCellHeight: 9,
          minCellWidth: 20,
          fontSize: 11,
          color: 'black',
        },
        theme: 'grid',
      });
      doc.save(`${fileName}.pdf`);
    } else if (fileType === 'xlsx') {
      let wb = XLSX.utils.book_new();
      let ws1 = XLSX.utils.json_to_sheet(data, {
        headers,
      });
      XLSX.utils.book_append_sheet(wb, ws1, 'React Table Data');
      XLSX.writeFile(wb, `${fileName}.xlsx`);
      // Returning false as downloading of file is already taken care of
      return false;
    }
  }

  function onPageIndexChanged(page) {
    onComponentOptionChanged(component, 'pageIndex', page).then(() => {
      onEvent('onPageChanged', { component, data: {} });
    });
  }
  const changeSet = tableDetails?.changeSet ?? {};

  function handleChangesSaved() {
    let mergeToTableDetailsObj = { dataUpdates: {}, changeSet: {} };
    let setExposedVarObj = { dataUpdates: {}, changeSet: {} };
    let clonedTableData = _.isEmpty(updatedDataReference.current)
      ? _.cloneDeep(tableData)
      : _.cloneDeep(updatedDataReference.current);
    if (!_.isEmpty(changeSet)) {
      Object.keys(changeSet).forEach((key) => {
        clonedTableData[key] = { ..._.merge(clonedTableData[key], changeSet[key]) };
      });
      updatedDataReference.current = clonedTableData;
    }
    if (!_.isEmpty(tableDetails?.newRowAddedChangeSet)) {
      isAddingNewRowRef.current = false;
      mergeToTableDetailsObj.newRowDataUpdate = [];
      mergeToTableDetailsObj.newRowAddedChangeSet = {};
      setExposedVarObj.newRowAddedChangeSet = {};
      setExposedVarObj.newRowDataUpdate = [];
    }
    setExposedVariables(setExposedVarObj).then(() => {
      mergeToTableDetails(mergeToTableDetailsObj);
    });
  }

  function handleAddNewRow(pageIndex) {
    if (!isAddingNewRowRef.current) isAddingNewRowRef.current = true;
    let newRowAddedChangeSet = tableDetails?.newRowAddedChangeSet || {};
    const clonedTableData = _.isEmpty(updatedDataReference.current)
      ? _.cloneDeep(tableData)
      : _.cloneDeep(updatedDataReference.current);
    const newRow = Object.keys(tableData[0]).reduce((accumulator, currentValue) => {
      accumulator[currentValue] = '';
      return accumulator;
    }, {});
    newRow.isAddingNewRow = true;
    const { newRowAddedChangeSet: updatedNewRowAddedChangeSetTableDetails, updatedData } =
      utilityToUpdateNewRowAddedChangeSetToTableDetails(
        pageIndex,
        clonedTableData,
        newRowAddedChangeSet,
        newRow,
        rowsPerPage
      );
    const updatedNewRowADdedChangeSetExposedVar = Object.keys(updatedNewRowAddedChangeSetTableDetails).reduce(
      (accumulator, key) => {
        const data = updatedNewRowAddedChangeSetTableDetails[key];
        if (data?.isAddingNewRow) {
          delete data.isAddingNewRow;
        }
        accumulator[key] = data;
        return accumulator;
      },
      {}
    );
    updatedDataReference.current = updatedData;
    setExposedVariables({
      newRowAddedChangeSet: updatedNewRowADdedChangeSetExposedVar,
      updatedData: updatedData,
      newRowDataUpdate: updatedNewRowADdedChangeSetExposedVar,
    }).then(() => {
      mergeToTableDetails({
        newRowAddedChangeSet: updatedNewRowAddedChangeSetTableDetails,
        newRowDataUpdate: updatedData,
      });
    });
  }

  function handleChangesDiscarded() {
    let mergeToTableDetailsObj = { dataUpdates: {}, changeSet: {} };
    let exposedVariablesObj = { changeSet: {}, dataUpdates: [] };
    const newRowAddedChangeSet = tableDetails?.newRowAddedChangeSet || {};
    if (isAddingNewRowRef.current && newRowAddedChangeSet) {
      const updatedData = discardChangesUtilityForNewlyAddedRow(
        updatedDataReference.current,
        tableDetails.newRowAddedChangeSet
      );
      exposedVariablesObj.updatedData = updatedData;
      exposedVariablesObj.newRowDataUpdate = [];
      exposedVariablesObj.newRowAddedChangeSet = {};
      mergeToTableDetailsObj.newRowDataUpdate = [];
      mergeToTableDetailsObj.newRowAddedChangeSet = {};
      updatedDataReference.current = updatedData;
      isAddingNewRowRef.current = false;
    }
    setExposedVariables(exposedVariablesObj).then(() => {
      mergeToTableDetails(mergeToTableDetailsObj);
      fireEvent('onCancelChanges');
    });
  }

  const computeFontColor = useCallback(() => {
    if (color !== undefined) {
      return color;
    } else {
      return darkMode ? '#ffffff' : '#000000';
    }
  }, [color, darkMode]);

  let tableData = [],
    dynamicColumn = [];

  const useDynamicColumn = resolveReferences(component.definition.properties?.useDynamicColumn?.value, currentState);
  if (currentState) {
    tableData = resolveReferences(component.definition.properties.data.value, currentState, []);
    dynamicColumn = useDynamicColumn
      ? resolveReferences(component.definition.properties?.columnData?.value, currentState, []) ?? []
      : [];
    if (!Array.isArray(tableData)) tableData = [];
  }

  tableData = tableData || [];

  const tableRef = useRef();

  const columnData = generateColumnsData({
    columnProperties: useDynamicColumn ? generatedColumn : component.definition.properties.columns.value,
    columnSizes,
    currentState,
    handleCellValueChange,
    customFilter,
    defaultColumn,
    changeSet: tableDetails.changeSet,
    tableData,
    variablesExposedForPreview,
    exposeToCodeHinter,
    id,
    fireEvent,
    tableRef,
    t,
    darkMode,
  });

  const [leftActionsCellData, rightActionsCellData] = useMemo(
    () =>
      generateActionsData({
        actions,
        columnSizes,
        defaultColumn,
        fireEvent,
        setExposedVariables,
      }),
    [JSON.stringify(actions)]
  );

  const textWrapActions = (id) => {
    let wrapOption = tableDetails.columnProperties?.find((item) => {
      return item?.id == id;
    });
    return wrapOption?.textWrap;
  };

  const optionsData = columnData.map((column) => column.columnOptions?.selectOptions);
  const columns = useMemo(
    () => [...leftActionsCellData, ...columnData, ...rightActionsCellData],
    [
      JSON.stringify(columnData),
      JSON.stringify(tableData),
      JSON.stringify(actions),
      leftActionsCellData.length,
      rightActionsCellData.length,
      tableDetails.changeSet,
      JSON.stringify(optionsData),
      JSON.stringify(component.definition.properties.columns),
      showBulkSelector,
      JSON.stringify(variablesExposedForPreview && variablesExposedForPreview[id]),
      darkMode,
    ] // Hack: need to fix
  );

  const data = useMemo(() => {
    if (!_.isEmpty(updatedDataReference.current) && !_.isEqual(properties.data, deferredDataFromProps)) {
      updatedDataReference.current = [];
      let tableDetailsAndExposedVarObject = {};
      if (!_.isEmpty(tableDetails.changeSet)) {
        tableDetailsAndExposedVarObject.changeSet = {};
        tableDetailsAndExposedVarObject.dataUpdates = [];
      }
      if (!_.isEmpty(tableDetails.newRowAddedChangeSet)) {
        isAddingNewRowRef.current = false;
        tableDetailsAndExposedVarObject.newRowAddedChangeSet = {};
        tableDetailsAndExposedVarObject.newRowDataUpdate = {};
      }
      setExposedVariables({ ...tableDetailsAndExposedVarObject, updatedData: [] }).then(() => {
        mergeToTableDetails(tableDetailsAndExposedVarObject);
      });
    }
    return _.isEmpty(updatedDataReference.current) ? tableData : updatedDataReference.current;
  }, [
    tableData.length,
    tableDetails.changeSet,
    component.definition.properties.data.value,
    JSON.stringify(properties.data),
    JSON.stringify(tableDetails.changeSet),
    JSON.stringify(tableDetails.newRowAddedChangeSet),
  ]);

  useEffect(() => {
    if (
      tableData.length != 0 &&
      component.definition.properties.autogenerateColumns?.value &&
      (useDynamicColumn || mode === 'edit')
    ) {
      const generatedColumnFromData = autogenerateColumns(
        tableData,
        component.definition.properties.columns.value,
        component.definition.properties?.columnDeletionHistory?.value ?? [],
        useDynamicColumn,
        dynamicColumn,
        setProperty
      );

      useDynamicColumn && setGeneratedColumn(generatedColumnFromData);
    }
  }, [JSON.stringify(tableData), JSON.stringify(dynamicColumn)]);

  const computedStyles = {
    // width: `${width}px`,
  };

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    gotoPage,
    pageCount,
    nextPage,
    previousPage,
    setPageSize,
    state,
    rows,
    prepareRow,
    setAllFilters,
    preGlobalFilteredRows,
    setGlobalFilter,
    allColumns,
    setColumnOrder,
    state: { pageIndex, globalFilter },
    exportData,
    selectedFlatRows,
    globalFilteredRows,
    getToggleHideAllColumnsProps,
  } = useTable(
    {
      autoResetPage: false,
      autoResetGlobalFilter: false,
      autoResetHiddenColumns: false,
      autoResetFilters: false,
      manualGlobalFilter: serverSideSearch,
      manualFilters: serverSideFilter,
      columns,
      data,
      defaultColumn,
      initialState: { pageIndex: 0, pageSize: -1 },
      pageCount: -1,
      manualPagination: false,
      getExportFileBlob,
      disableSortBy: !enabledSort,
      manualSortBy: serverSideSort,
    },
    useColumnOrder,
    useFilters,
    useGlobalFilter,
    useSortBy,
    usePagination,
    useBlockLayout,
    useResizeColumns,
    useExportData,
    useRowSelect,
    (hooks) => {
      showBulkSelector &&
        hooks.visibleColumns.push((columns) => [
          {
            id: 'selection',
            Header: ({ getToggleAllPageRowsSelectedProps }) => (
              <div className="d-flex flex-column align-items-center">
                <IndeterminateCheckbox {...getToggleAllPageRowsSelectedProps()} />
              </div>
            ),
            Cell: ({ row }) => (
              <div className="d-flex flex-column align-items-center">
                <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />
              </div>
            ),
            width: 1,
            columnType: 'selector',
          },
          ...columns,
        ]);
    }
  );
  const currentColOrder = React.useRef();

  const sortOptions = useMemo(() => {
    if (state?.sortBy?.length === 0) {
      return;
    }

    const columnName = columns.find((column) => column.id === state?.sortBy?.[0]?.id).accessor;

    return [
      {
        column: columnName,
        direction: state?.sortBy?.[0]?.desc ? 'desc' : 'asc',
      },
    ];
  }, [JSON.stringify(state)]);

  useEffect(() => {
    if (!sortOptions) {
      setExposedVariable('sortApplied', []);
    }
    if (mounted) setExposedVariable('sortApplied', sortOptions).then(() => fireEvent('onSort'));
  }, [sortOptions]);

  registerAction(
    'setPage',
    async function (targetPageIndex) {
      setPaginationInternalPageIndex(targetPageIndex);
      setExposedVariable('pageIndex', targetPageIndex);
      if (!serverSidePagination && clientSidePagination) gotoPage(targetPageIndex - 1);
    },
    [serverSidePagination, clientSidePagination, setPaginationInternalPageIndex]
  );
  registerAction(
    'selectRow',
    async function (key, value) {
      const item = tableData.filter((item) => item[key] == value);
      const row = rows.find((item, index) => item.original[key] == value);
      if (row != undefined) {
        const selectedRowDetails = { selectedRow: item[0], selectedRowId: row.id };
        mergeToTableDetails(selectedRowDetails);
        setExposedVariables(selectedRowDetails).then(() => {
          fireEvent('onRowClicked');
        });
      }
    },
    [JSON.stringify(tableData), JSON.stringify(tableDetails.selectedRow)]
  );
  registerAction(
    'deselectRow',
    async function () {
      if (!_.isEmpty(tableDetails.selectedRow)) {
        const selectedRowDetails = { selectedRow: {}, selectedRowId: {} };
        mergeToTableDetails(selectedRowDetails);
        setExposedVariables(selectedRowDetails);
      }
      return;
    },
    [JSON.stringify(tableData), JSON.stringify(tableDetails.selectedRow)]
  );
  registerAction(
    'discardChanges',
    async function () {
      let exposedVariablesObj = { changeSet: {}, dataUpdates: [] };
      let mergeToTableDetailsObj = { dataUpdates: {}, changeSet: {} };
      if (isAddingNewRowRef.current && Object.keys(tableDetails?.newRowAddedChangeSet || {}).length > 0) {
        const updatedDataArray = _.cloneDeep(updatedDataReference?.current || []);
        const updatedData = discardChangesUtilityForNewlyAddedRow(updatedDataArray, tableDetails.newRowAddedChangeSet);
        exposedVariablesObj.updatedData = updatedData;
        exposedVariablesObj.newRowDataUpdate = [];
        exposedVariablesObj.newRowAddedChangeSet = {};
        mergeToTableDetailsObj.newRowDataUpdate = [];
        mergeToTableDetailsObj.newRowAddedChangeSet = {};
        isAddingNewRowRef.current = false;
        updatedDataReference.current = updatedData;
      }
      setExposedVariables(exposedVariablesObj).then(() => {
        mergeToTableDetails(mergeToTableDetailsObj);
        fireEvent('onCancelChanges');
      });
    },
    [JSON.stringify(tableData), JSON.stringify(tableDetails.changeSet), JSON.stringify(tableDetails.newRowDataUpdate)]
  );

  useEffect(() => {
    const selectedRowsOriginalData = selectedFlatRows.map((row) => row.original);
    onComponentOptionChanged(component, 'selectedRows', selectedRowsOriginalData);
  }, [selectedFlatRows.length]);

  React.useEffect(() => {
    if (serverSidePagination || !clientSidePagination) {
      setPageSize(rows?.length || 10);
    }
    if (!serverSidePagination && clientSidePagination) {
      setPageSize(rowsPerPage || 10);
    }
  }, [clientSidePagination, serverSidePagination, rows, rowsPerPage]);

  useEffect(() => {
    const currentPageData = setExposedVariableUtility(page, isAddingNewRowRef.current);
    onComponentOptionsChanged(component, [
      ['currentPageData', currentPageData],
      ['currentData', isAddingNewRowRef.current ? tableData : data],
      ['selectedRow', []],
      ['selectedRowId', null],
    ]);
  }, [tableData.length, tableDetails.changeSet, page, data, JSON.stringify(tableDetails?.newRowAddedChangeSet)]);

  useEffect(() => {
    const newColumnSizes = { ...columnSizes, ...state.columnResizing.columnWidths };
    if (!state.columnResizing.isResizingColumn && !_.isEmpty(newColumnSizes)) {
      changeCanDrag(true);
      paramUpdated(id, 'columnSizes', {
        value: newColumnSizes,
      });
    } else {
      changeCanDrag(false);
    }
  }, [state.columnResizing.isResizingColumn]);

  const [paginationInternalPageIndex, setPaginationInternalPageIndex] = useState(pageIndex ?? 1);
  const [rowDetails, setRowDetails] = useState();
  useEffect(() => {
    if (pageCount <= pageIndex) gotoPage(pageCount - 1);
  }, [pageCount]);

  const hoverRef = useRef();

  useEffect(() => {
    if (rowDetails?.hoveredRowId !== '' && hoverRef.current !== rowDetails?.hoveredRowId) rowHover();
  }, [rowDetails]);

  useEffect(() => {
    const globalFilterRowsArrayToMap = setExposedVariableUtility(globalFilteredRows, isAddingNewRowRef.current);
    setExposedVariable('filteredData', globalFilterRowsArrayToMap);
  }, [JSON.stringify(globalFilteredRows.map((row) => row.original))]);

  const rowHover = () => {
    mergeToTableDetails(rowDetails);
    setExposedVariables(rowDetails).then(() => {
      fireEvent('onRowHovered');
    });
  };
  useEffect(() => {
    if (_.isEmpty(changeSet) || _.isEmpty(tableDetails?.newRowAddedChangeSet)) {
      setExposedVariable(
        'updatedData',
        _.isEmpty(updatedDataReference.current) ? tableData : updatedDataReference.current
      );
    }
  }, [JSON.stringify(changeSet), JSON.stringify(tableDetails?.newRowAddedChangeSet)]);
  function downlaodPopover() {
    return (
      <Popover
        id="popover-basic"
        data-cy="popover-card"
        className={`${darkMode && 'popover-dark-themed theme-dark'} shadow table-widget-download-popup`}
        placement="bottom"
      >
        <Popover.Body>
          <div className="d-flex flex-column">
            <span data-cy={`option-download-CSV`} className="cursor-pointer" onClick={() => exportData('csv', true)}>
              Download as CSV
            </span>
            <span
              data-cy={`option-download-execel`}
              className="pt-2 cursor-pointer"
              onClick={() => exportData('xlsx', true)}
            >
              Download as Excel
            </span>
            <span
              data-cy={`option-download-pdf`}
              className="pt-2 cursor-pointer"
              onClick={() => exportData('pdf', true)}
            >
              Download as PDF
            </span>
          </div>
        </Popover.Body>
      </Popover>
    );
  }
  return (
    <div
      data-cy={`draggable-widget-${String(component.name).toLowerCase()}`}
      data-disabled={parsedDisabledState}
      className="card jet-table"
      style={{
        width: `100%`,
        height: `${height}px`,
        display: parsedWidgetVisibility ? '' : 'none',
        overflow: 'hidden',
        borderRadius: Number.parseFloat(borderRadius),
      }}
      onClick={(event) => {
        onComponentClick(id, component, event);
      }}
      ref={tableRef}
    >
      {/* Show top bar unless search box is disabled and server pagination is enabled */}
      {(displaySearchBox || showDownloadButton || showFilterButton) && (
        <div className="card-body border-bottom py-3 ">
          <div
            className={`d-flex align-items-center ms-auto text-muted ${
              displaySearchBox ? 'justify-content-between' : 'justify-content-end'
            }`}
          >
            {displaySearchBox && (
              <GlobalFilter
                globalFilter={state.globalFilter}
                useAsyncDebounce={useAsyncDebounce}
                setGlobalFilter={setGlobalFilter}
                onComponentOptionChanged={onComponentOptionChanged}
                component={component}
                onEvent={onEvent}
                darkMode={darkMode}
              />
            )}
            <div>
              <button
                className="btn btn-light btn-sm p-1 mx-1"
                onClick={(e) => {
                  handleAddNewRow(pageIndex);
                }}
                data-tip="Add new row"
                disabled={_.isEmpty(tableDetails.changeSet) ? false : true}
              >
                <img src="assets/images/icons/plus.svg" width="15" height="15" />
              </button>
              {showFilterButton && (
                <>
                  <span
                    className="btn btn-light btn-sm p-1 mx-1"
                    onClick={() => showFilters()}
                    data-tooltip-id="tooltip-for-filter-data"
                    data-tooltip-content="Filter data"
                  >
                    <img src="assets/images/icons/filter.svg" width="15" height="15" />
                    {tableDetails.filterDetails.filters.length > 0 && (
                      <a className="badge bg-azure" style={{ width: '4px', height: '4px', marginTop: '5px' }}></a>
                    )}
                  </span>
                  <Tooltip id="tooltip-for-filter-data" className="tooltip" />
                </>
              )}
              {showDownloadButton && (
                <>
                  <OverlayTrigger trigger="click" overlay={downlaodPopover()} rootClose={true} placement={'bottom-end'}>
                    <span
                      className="btn btn-light btn-sm p-1"
                      data-tooltip-id="tooltip-for-download"
                      data-tooltip-content="Download"
                    >
                      <img src="assets/images/icons/download.svg" width="15" height="15" />
                    </span>
                  </OverlayTrigger>
                  <Tooltip id="tooltip-for-download" className="tooltip" />
                </>
              )}
              {!hideColumnSelectorButton && (
                <OverlayTrigger
                  trigger="click"
                  rootClose={true}
                  overlay={
                    <Popover>
                      <div
                        data-cy={`dropdown-hide-column`}
                        className={`dropdown-table-column-hide-common ${
                          darkMode ? 'dropdown-table-column-hide-dark-themed' : 'dropdown-table-column-hide'
                        } `}
                      >
                        <div className="dropdown-item">
                          <IndeterminateCheckbox {...getToggleHideAllColumnsProps()} />
                          <span className="hide-column-name" data-cy={`options-select-all-coloumn`}>
                            Select All
                          </span>
                        </div>
                        {allColumns.map(
                          (column) =>
                            typeof column.Header === 'string' && (
                              <div key={column.id}>
                                <div>
                                  <label className="dropdown-item">
                                    <input
                                      type="checkbox"
                                      data-cy={`checkbox-coloumn-${String(column.Header)
                                        .toLowerCase()
                                        .replace(/\s+/g, '-')}`}
                                      {...column.getToggleHiddenProps()}
                                    />
                                    <span
                                      className="hide-column-name"
                                      data-cy={`options-coloumn-${String(column.Header)
                                        .toLowerCase()
                                        .replace(/\s+/g, '-')}`}
                                    >
                                      {` ${column.Header}`}
                                    </span>
                                  </label>
                                </div>
                              </div>
                            )
                        )}
                      </div>
                    </Popover>
                  }
                  placement={'bottom-end'}
                >
                  <span data-cy={`select-column-icon`} className={`btn btn-light btn-sm p-1 mb-0 mx-1 `}>
                    <IconEyeOff style={{ width: '15', height: '15', margin: '0px' }} />
                  </span>
                </OverlayTrigger>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="table-responsive jet-data-table">
        <table
          {...getTableProps()}
          className={`table table-vcenter table-nowrap ${tableType} ${darkMode && 'table-dark'}`}
          style={computedStyles}
        >
          <thead>
            {headerGroups.map((headerGroup, index) => (
              <DragDropContext
                key={index}
                onDragStart={() => {
                  currentColOrder.current = allColumns?.map((o) => o.id);
                }}
                onDragUpdate={(dragUpdateObj) => {
                  const colOrder = [...currentColOrder.current];
                  const sIndex = dragUpdateObj.source.index;
                  const dIndex = dragUpdateObj.destination && dragUpdateObj.destination.index;

                  if (typeof sIndex === 'number' && typeof dIndex === 'number') {
                    colOrder.splice(sIndex, 1);
                    colOrder.splice(dIndex, 0, dragUpdateObj.draggableId);
                    setColumnOrder(colOrder);
                  }
                }}
              >
                <Droppable droppableId="droppable" direction="horizontal">
                  {(droppableProvided, snapshot) => (
                    <tr
                      ref={droppableProvided.innerRef}
                      key={index}
                      {...headerGroup.getHeaderGroupProps()}
                      tabIndex="0"
                      className="tr"
                    >
                      {headerGroup.headers.map((column, index) => (
                        <Draggable
                          key={column.id}
                          draggableId={column.id}
                          index={index}
                          isDragDisabled={!column.accessor}
                        >
                          {(provided, snapshot) => {
                            return (
                              <th
                                key={index}
                                {...column.getHeaderProps()}
                                className={
                                  column.isSorted ? (column.isSortedDesc ? 'sort-desc th' : 'sort-asc th') : 'th'
                                }
                              >
                                <div
                                  data-cy={`column-header-${String(column.exportValue)
                                    .toLowerCase()
                                    .replace(/\s+/g, '-')}`}
                                  {...column.getSortByToggleProps()}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  // {...extraProps}
                                  ref={provided.innerRef}
                                  style={{ ...getItemStyle(snapshot, provided.draggableProps.style) }}
                                >
                                  {column.render('Header')}
                                </div>
                                <div
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }}
                                  draggable="true"
                                  {...column.getResizerProps()}
                                  className={`resizer ${column.isResizing ? 'isResizing' : ''}`}
                                />
                              </th>
                            );
                          }}
                        </Draggable>
                      ))}
                    </tr>
                  )}
                </Droppable>
              </DragDropContext>
            ))}
          </thead>

          {!loadingState && page.length === 0 && (
            <center className="w-100">
              <div className="py-5"> no data </div>
            </center>
          )}

          {!loadingState && (
            <tbody {...getTableBodyProps()} style={{ color: computeFontColor() }}>
              {page.map((row, index) => {
                prepareRow(row);
                return (
                  <tr
                    key={index}
                    className={`table-row ${
                      highlightSelectedRow && row.id === tableDetails.selectedRowId ? 'selected' : ''
                    }`}
                    {...row.getRowProps()}
                    onClick={(e) => {
                      e.stopPropagation();
                      const selectedRowDetails = { selectedRowId: row.id, selectedRow: row.original };
                      mergeToTableDetails(selectedRowDetails);
                      setExposedVariables(selectedRowDetails).then(() => {
                        fireEvent('onRowClicked');
                      });
                    }}
                    onMouseOver={(e) => {
                      if (hoverAdded) {
                        const hoveredRowDetails = { hoveredRowId: row.id, hoveredRow: row.original };
                        setRowDetails(hoveredRowDetails);
                        hoverRef.current = rowDetails?.hoveredRowId;
                      }
                    }}
                    onMouseLeave={(e) => {
                      hoverAdded && setRowDetails({ hoveredRowId: '', hoveredRow: '' });
                    }}
                  >
                    {row.cells.map((cell, index) => {
                      let cellProps = cell.getCellProps();
                      if (tableDetails.changeSet) {
                        if (tableDetails.changeSet[cell.row.index]) {
                          const currentColumn = columnData.find((column) => column.id === cell.column.id);
                          if (
                            _.get(tableDetails.changeSet[cell.row.index], currentColumn?.accessor, undefined) !==
                            undefined
                          ) {
                            cellProps.style.backgroundColor = darkMode ? '#1c252f' : '#ffffde';
                            cellProps.style['--tblr-table-accent-bg'] = darkMode ? '#1c252f' : '#ffffde';
                          }
                        }
                      }
                      const wrapAction = textWrapActions(cell.column.id);
                      const rowChangeSet = changeSet ? changeSet[cell.row.index] : null;
                      const cellValue = rowChangeSet ? rowChangeSet[cell.column.name] || cell.value : cell.value;
                      const rowData = tableData[cell.row.index];
                      const cellBackgroundColor = resolveReferences(
                        cell.column?.cellBackgroundColor,
                        currentState,
                        '',
                        {
                          cellValue,
                          rowData,
                        }
                      );
                      const cellTextColor = resolveReferences(cell.column?.textColor, currentState, '', {
                        cellValue,
                        rowData,
                      });
                      const actionButtonsArray = actions.map((action) => {
                        return {
                          ...action,
                          isDisabled: resolveReferences(action?.disableActionButton ?? false, currentState, '', {
                            cellValue,
                            rowData,
                          }),
                        };
                      });
                      const isFirstRowIsNewlyAddedRow = index === 0 && cell.row.original?.isAddingNewRow ? true : false;
                      const isEditable = isFirstRowIsNewlyAddedRow
                        ? true
                        : resolveReferences(cell.column?.isEditable ?? false, currentState, '', {
                            cellValue,
                            rowData,
                          });
                      return (
                        // Does not require key as its already being passed by react-table via cellProps
                        // eslint-disable-next-line react/jsx-key
                        <td
                          data-cy={`${cell.column.columnType ?? ''}${String(
                            cell.column.id === 'rightActions' || cell.column.id === 'leftActions' ? cell.column.id : ''
                          )}${String(cellValue ?? '').toLocaleLowerCase()}-cell-${index}`}
                          className={cx(`${wrapAction ? wrapAction : 'wrap'}-wrapper`, {
                            'has-actions': cell.column.id === 'rightActions' || cell.column.id === 'leftActions',
                            'has-text': cell.column.columnType === 'text' || isEditable,
                            'has-dropdown': cell.column.columnType === 'dropdown',
                            'has-multiselect': cell.column.columnType === 'multiselect',
                            'has-datepicker': cell.column.columnType === 'datepicker',
                            'align-items-center flex-column': cell.column.columnType === 'selector',
                            [cellSize]: true,
                          })}
                          {...cellProps}
                          style={{ ...cellProps.style, backgroundColor: cellBackgroundColor ?? 'inherit' }}
                        >
                          <div
                            className={`td-container ${
                              cell.column.columnType === 'image' && 'jet-table-image-column'
                            } ${cell.column.columnType !== 'image' && 'w-100 h-100'}`}
                          >
                            <GenerateEachCellValue
                              cellValue={cellValue}
                              globalFilter={state.globalFilter}
                              cellRender={cell.render('Cell', {
                                cell,
                                actionButtonsArray,
                                isEditable,
                                isFirstRowIsNewlyAddedRow,
                              })}
                              rowChangeSet={rowChangeSet}
                              isEditable={isEditable}
                              columnType={cell.column.columnType}
                              isColumnTypeAction={['rightActions', 'leftActions'].includes(cell.column.id)}
                              cellTextColor={cellTextColor}
                              cell={cell}
                              currentState={currentState}
                              isFirstRowIsNewlyAddedRow={isFirstRowIsNewlyAddedRow}
                            />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          )}
        </table>
        {loadingState === true && (
          <div style={{ width: '100%' }} className="p-2">
            <center>
              <div className="spinner-border mt-5" role="status"></div>
            </center>
          </div>
        )}
      </div>
      {(clientSidePagination || serverSidePagination || Object.keys(tableDetails.changeSet || {}).length > 0) && (
        <div className="card-footer d-flex align-items-center jet-table-footer justify-content-center">
          <div className="table-footer row gx-0">
            <div className="col">
              {(clientSidePagination || serverSidePagination) && (
                <Pagination
                  lastActivePageIndex={pageIndex}
                  serverSide={serverSidePagination}
                  autoGotoPage={gotoPage}
                  autoCanNextPage={canNextPage}
                  autoPageCount={pageCount}
                  autoPageOptions={pageOptions}
                  onPageIndexChanged={onPageIndexChanged}
                  pageIndex={paginationInternalPageIndex}
                  setPageIndex={setPaginationInternalPageIndex}
                  enableNextButton={enableNextButton}
                  enablePrevButton={enablePrevButton}
                />
              )}
            </div>
            <div className="col d-flex justify-content-end">
              {showBulkUpdateActions &&
              (Object.keys(tableDetails.changeSet || {}).length > 0 || isAddingNewRowRef.current) ? (
                <>
                  <button
                    className={`btn btn-primary btn-sm mx-2 ${tableDetails.isSavingChanges ? 'btn-loading' : ''}`}
                    onClick={() => {
                      if (!_.isEmpty(changeSet) && _.isEmpty(tableDetails.newRowAddedChangeSet)) {
                        onEvent('onBulkUpdate', { component }).then(() => {
                          return handleChangesSaved();
                        });
                      }
                      if (_.isEmpty(changeSet) && !_.isEmpty(tableDetails.newRowAddedChangeSet)) {
                        onEvent('onNewRowAdded', { component }).then(() => {
                          return handleChangesSaved();
                        });
                      }
                      if (!_.isEmpty(changeSet) && !_.isEmpty(tableDetails.newRowAddedChangeSet)) {
                        onEvent('onBulkUpdate', { component }).then(() => {
                          onEvent('onNewRowAdded', { component }).then(() => {
                            return handleChangesSaved();
                          });
                        });
                      }
                    }}
                    data-cy={`table-button-save-changes`}
                  >
                    Save Changes
                  </button>
                  <button
                    className="btn btn-light btn-sm"
                    onClick={() => handleChangesDiscarded()}
                    data-cy={`table-button-discard-changes`}
                  >
                    Discard changes
                  </button>
                </>
              ) : (
                <span data-cy={`footer-number-of-records`}>
                  {clientSidePagination && !serverSidePagination && `${globalFilteredRows.length} Records`}
                  {serverSidePagination && totalRecords ? `${totalRecords} Records` : ''}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
      {tableDetails.filterDetails.filtersVisible && (
        <Filter
          hideFilters={hideFilters}
          filters={tableDetails.filterDetails.filters}
          columns={columnData.map((column) => {
            return { name: column.Header, value: column.id };
          })}
          mergeToFilterDetails={mergeToFilterDetails}
          filterDetails={tableDetails.filterDetails}
          darkMode={darkMode}
          setAllFilters={setAllFilters}
          fireEvent={fireEvent}
        />
      )}
    </div>
  );
}

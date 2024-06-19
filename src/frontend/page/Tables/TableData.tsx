import {
  Tooltip,
  Popover,
  PopoverTrigger,
  Button,
  PopoverContent,
  useDisclosure,
  Breadcrumbs,
  BreadcrumbItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Skeleton,
  Chip,
  Selection,
  Card,
  CardBody,
} from "@nextui-org/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { CgKey } from "react-icons/cg";
import { FaRegCalendar, FaHashtag, FaPlus } from "react-icons/fa";
import { HiOutlineHashtag } from "react-icons/hi";
import { LuCopy, LuSettings, LuRefreshCw } from "react-icons/lu";
import { RiText } from "react-icons/ri";
import { RxComponentBoolean } from "react-icons/rx";
import { formatDate } from "../../utils/utils";
import InsertDataModal from "./InsertDataModal";
import TableSettingModal from "./TableSettingModal";
import classNames from "classnames";
import UpdateDataModal from "./UpdateDataModal";
import { FiFilter } from "react-icons/fi";
import FilterModal from "./FilterModal";
import axiosInstance from "../../pkg/axiosInstance";
import FloatingBox from "../../components/FloatingBox";
import { TbCirclesRelation } from "react-icons/tb";
import { toast } from "react-toastify";

interface TableDataProps {
  table: {
    name: string;
    is_auth: boolean;
  };
}

export interface FetchFilter {
  column: string;
  operator: string;
  value: string;
}

const TableData = ({ table }: TableDataProps) => {
  const { data: columns } = useQuery<any[]>({
    queryKey: ["columns", table.name],
    queryFn: async () => {
      if (table.name === "") {
        return null;
      }
      const res = await axiosInstance.get(`/api/${table.name}/columns`);
      return res.data;
    },
  });

  const [filter, setFilter] = useState<FetchFilter[]>([]);

  const { data: rows, isLoading } = useQuery<any[]>({
    queryKey: ["rows", table.name, filter],
    queryFn: async () => {
      if (table.name === "") {
        return null;
      }

      const res = await axiosInstance.post(`/api/${table.name}/rows`, {
        filters: filter
          .filter((f) => f.column != "" && f.operator != "" && f.value !== "")
          .map((f) => {
            if (f.operator === "sw") {
              return {
                column: f.column,
                operator: "LIKE",
                value: `${f.value}%`,
              };
            } else if (f.operator === "ew") {
              return {
                column: f.column,
                operator: "LIKE",
                value: `%${f.value}`,
              };
            } else if (f.operator === "contains") {
              return {
                column: f.column,
                operator: "LIKE",
                value: `%${f.value}%`,
              };
            } else {
              // Return the filter as is if none of the conditions match
              return f;
            }
          }),
      });
      return res.data;
    },
  });

  const queryClient = useQueryClient();

  const refetchData = async () => {
    await queryClient.refetchQueries({
      queryKey: ["rows", table.name],
      type: "active",
    });
  };

  const TooltipContainer = ({ column, children, className }: any) => {
    const content = (
      <div className="flex flex-col text-xs">
        <p>{column.pk === 1 ? "PRIMARY KEY" : ""}</p>
        <p>{column.name}</p>
        <p>{column.type}</p>
      </div>
    );
    return (
      <Tooltip className={className} placement="bottom-start" content={content}>
        {children}
      </Tooltip>
    );
  };

  const renderHeader = (column: any) => {
    if (column.pk === 1) {
      return (
        <TooltipContainer column={column}>
          <div className="flex items-center gap-2">
            <CgKey size={16} />
            <p>{column.name}</p>
          </div>
        </TooltipContainer>
      );
    }

    switch (column.type) {
      case "TEXT":
        return (
          <TooltipContainer column={column}>
            <div className="flex items-center gap-2">
              <RiText size={16} />
              <p>{column.name}</p>
            </div>
          </TooltipContainer>
        );
      case "RELATION":
        return (
          <TooltipContainer column={column}>
            <div className="flex items-center gap-2">
              <TbCirclesRelation size={16} />
              <p>{column.name}</p>
            </div>
          </TooltipContainer>
        );
      case "TIMESTAMP":
        return (
          <TooltipContainer column={column}>
            <div className="flex items-center gap-2">
              <FaRegCalendar size={14} />
              <p>{column.name}</p>
            </div>
          </TooltipContainer>
        );
      case "DATETIME":
        return (
          <TooltipContainer column={column}>
            <div className="flex items-center gap-2">
              <FaRegCalendar size={14} />
              <p>{column.name}</p>
            </div>
          </TooltipContainer>
        );
      case "REAL":
        return (
          <TooltipContainer column={column}>
            <div className="flex items-center gap-2">
              <HiOutlineHashtag size={14} />
              <p>{column.name}</p>
            </div>
          </TooltipContainer>
        );
      case "INTEGER":
        return (
          <TooltipContainer column={column}>
            <div className="flex items-center gap-2">
              <FaHashtag size={12} />
              <p>{column.name}</p>
            </div>
          </TooltipContainer>
        );
      case "BOOLEAN":
        return (
          <TooltipContainer column={column}>
            <div className="flex items-center gap-2">
              <RxComponentBoolean size={12} />
              <p>{column.name}</p>
            </div>
          </TooltipContainer>
        );
      default:
        return <p>{column.name}</p>;
    }
  };

  const renderCell = useCallback(
    (row: any, columnKey: React.Key) => {
      const cellValue = row[columnKey as keyof any];
      const pk = columns?.find((col) => col.name === columnKey)?.pk;

      if (pk === 1)
        return (
          <Popover placement="bottom-start">
            <PopoverTrigger>
              <Button
                onClick={() => navigator.clipboard.writeText(cellValue)}
                className="bg-slate-100 h-7 p-0 px-3 min-w-0"
                variant="light"
              >
                <div className="flex items-center gap-3">
                  {cellValue}
                  <LuCopy />
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <div className="px-1 py-2">
                <div className="text-sm font-bold">Copied</div>
              </div>
            </PopoverContent>
          </Popover>
        );

      const dtype = columns?.find((col) => col.name === columnKey)?.type;
      switch (dtype) {
        case "TIMESTAMP":
          const date = new Date(cellValue);
          const dateString = formatDate(date.toISOString(), "dd-mm-yyyy");
          const timeString = formatDate(date.toISOString(), "HH:MM:SS");
          return (
            <div className="flex flex-col">
              <p>{dateString}</p>
              <p style={{ fontSize: "0.85rem" }} className="text-slate-500">
                {timeString}
              </p>
            </div>
          );
        case "TEXT":
          if (cellValue.length > 50)
            return (
              <Tooltip placement="bottom-start" content={cellValue}>
                <p className="whitespace-nowrap overflow-hidden text-ellipsis">
                  {cellValue.slice(0, 50) + "..."}
                </p>
              </Tooltip>
            );

          return cellValue;
        case "BOOLEAN":
          return (
            <Chip
              classNames={{
                content: "px-1 font-semibold",
              }}
              className={classNames(
                cellValue
                  ? "border-green-300 bg-green-100"
                  : "border-red-300 bg-red-100"
              )}
              variant="bordered"
              radius="md"
            >
              {cellValue ? "true" : "false"}
            </Chip>
          );
        default:
          return cellValue;
      }
    },
    [columns]
  );

  const {
    isOpen: isInsertOpen,
    onOpen: onInsertOpen,
    onClose: onInsertClose,
  } = useDisclosure();

  const {
    isOpen: isSettingOpen,
    onOpen: onSettingOpen,
    onClose: onSettingClose,
  } = useDisclosure();

  const {
    isOpen: isUpdateOpen,
    onOpen: onUpdateOpen,
    onClose: onUpdateClose,
  } = useDisclosure();

  const {
    isOpen: isFilterOpen,
    onOpen: onFilterOpen,
    onClose: onFilterClose,
  } = useDisclosure();
  const [selectedRow, setSelectedRow] = useState<string>("");

  const TopContent = () => {
    return (
      <div className="my-3 mx-3 md:flex block items-center justify-between">
        <div className="flex gap-2 items-center justify-between md:justify-normal">
          <Breadcrumbs
            size="lg"
            isDisabled
            separator="/"
            className="text-xl font-semibold"
          >
            <BreadcrumbItem>Table</BreadcrumbItem>
            <BreadcrumbItem>
              <p>{table.name}</p>
            </BreadcrumbItem>
          </Breadcrumbs>
          <div className="flex gap-2 items-center">
            <Button
              radius="sm"
              className="h-7 p-0 w-7 hover:bg-slate-200 bg-transparent min-w-0"
            >
              <LuSettings
                onClick={onSettingOpen}
                fontSize={"1.25rem"}
                className="cursor-pointer"
              />
            </Button>
            <Button
              radius="sm"
              className="h-7 p-0 w-7 hover:bg-slate-200 bg-transparent min-w-0"
            >
              <LuRefreshCw
                onClick={refetchData}
                fontSize={"1.25rem"}
                className="cursor-pointer"
              />
            </Button>
            <Button
              radius="sm"
              className="h-7 p-0 w-7 hover:bg-slate-200 bg-transparent min-w-0"
            >
              <FiFilter
                onClick={onFilterOpen}
                fontSize={"1.25rem"}
                className="cursor-pointer"
              />
            </Button>
          </div>
        </div>
        <div className="flex h-full justify-end gap-2 items-center md:mt-0 mt-3">
          <Button
            onClick={onInsertOpen}
            startContent={<FaPlus />}
            className="rounded-md w-full md:w-[150px] bg-slate-950 text-white font-semibold"
          >
            New Data
          </Button>
        </div>
      </div>
    );
  };

  const [selectedRows, setSelectedRows] = useState<Selection>(new Set([]));
  const { mutateAsync } = useMutation({
    mutationFn: async () => {
      await axiosInstance.delete(`/api/${table.name}/rows`, {
        data: {
          id: Array.from(selectedRows),
        },
      });
    },
    onSuccess: () => {
      queryClient.refetchQueries({
        queryKey: ["rows", table.name],
        type: "active",
      });
      setSelectedRows(new Set([]));
    },
  });

  const deleteMultipleRow = (n: number) => {
    toast.promise(mutateAsync(), {
      pending: `Deleting ${n} data`,
      success: `Successfully deleted ${n} data`,
      error: "Failed to delete",
    });
  };

  return (
    <>
      <div className="flex flex-col">
        <TopContent />
        <Table
          selectedKeys={selectedRows}
          onSelectionChange={(keys) => setSelectedRows(keys)}
          onRowAction={(key) => {
            onUpdateOpen();
            setSelectedRow(key.toString());
          }}
          isHeaderSticky={true}
          classNames={{
            base: "max-h-[calc(100dvh_-_45px_-_5px)] max-w-[calc(100vw_-_315px)] overflow-y-scroll overflow-x-scroll",
            thead: "[&>tr]:first:rounded-none",
            th: [
              "text-default-500",
              "border-b",
              "rounded-none",
              "border-divider",
              "hover:bg-slate-200",
              "first:hover:bg-gray-100",
              "first:w-[50px]",
            ],
            tr: "[&>th]:first:rounded-none [&>th]:last:rounded-none border-b-1 rounded-none",
            td: [
              "first:w-[50px]",
              "group-data-[first=true]:first:before:rounded-none",
              "group-data-[first=true]:last:before:rounded-none",
              "group-data-[middle=true]:before:rounded-none",
              "group-data-[last=true]:first:before:rounded-none",
              "group-data-[last=true]:last:before:rounded-none",
              "py-2",
            ],
          }}
          checkboxesProps={{
            classNames: {
              wrapper:
                "after:bg-primary max-w-[50px] after:text-background text-background",
            },
          }}
          selectionMode="multiple"
          removeWrapper
        >
          {columns && rows ? (
            <TableHeader columns={columns}>
              {(column) => (
                <TableColumn key={column.name}>
                  {renderHeader(column)}
                </TableColumn>
              )}
            </TableHeader>
          ) : (
            <TableHeader>
              <TableColumn>
                <Skeleton className="h-[22px] rounded-md" />
              </TableColumn>
              <TableColumn>
                <Skeleton className="h-[22px] rounded-md" />
              </TableColumn>
              <TableColumn>
                <Skeleton className="h-[22px] rounded-md" />
              </TableColumn>
            </TableHeader>
          )}

          {columns && rows ? (
            <TableBody emptyContent="No records found" items={rows}>
              {(item) => (
                <TableRow className="cursor-pointer" key={item.id}>
                  {(columnKey) => (
                    <TableCell>{renderCell(item, columnKey)}</TableCell>
                  )}
                </TableRow>
              )}
            </TableBody>
          ) : (
            <TableBody isLoading={isLoading}>
              {[1, 2, 3].map((item) => (
                <TableRow key={item}>
                  <TableCell>
                    <Skeleton className="h-[22px] rounded-md" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-[22px] rounded-md" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-[22px] rounded-md" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          )}
        </Table>
      </div>

      <InsertDataModal
        table={table}
        isOpen={isInsertOpen}
        onClose={onInsertClose}
      />
      <TableSettingModal
        tableName={table.name}
        isOpen={isSettingOpen}
        onClose={onSettingClose}
      />
      <UpdateDataModal
        tableName={table.name}
        isOpen={isUpdateOpen}
        onClose={onUpdateClose}
        id={selectedRow}
      />
      <FilterModal
        isOpen={isFilterOpen}
        onClose={onFilterClose}
        filters={filter}
        setFilter={setFilter}
        tableName={table.name}
      />
      <FloatingBox isOpen={(selectedRows as any).size > 0}>
        <Card>
          <CardBody className="pl-6 pr-2 py-2">
            <div className="flex gap-10 items-center">
              <p>
                <b>{(selectedRows as any).size}</b> selected
              </p>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setSelectedRows(new Set([]))}
                  className="p-0 min-w-0 w-[80px] h-8 bg-transparent hover:bg-slate-200"
                  radius="sm"
                >
                  Clear
                </Button>
                <Button
                  className="p-0 min-w-0 w-[80px] h-8 bg-red-200"
                  radius="sm"
                  onClick={() => deleteMultipleRow((selectedRows as any).size)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </FloatingBox>
    </>
  );
};

export default TableData;
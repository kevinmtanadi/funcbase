import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useCallback } from "react";
import axiosInstance from "../../pkg/axiosInstance";
import {
  Tooltip,
  Popover,
  PopoverTrigger,
  Button,
  PopoverContent,
  Chip,
  useDisclosure,
  Table,
  TableHeader,
  TableColumn,
  Skeleton,
  TableBody,
  TableRow,
  TableCell,
} from "@nextui-org/react";
import classNames from "classnames";
import { CgKey } from "react-icons/cg";
import { FaRegCalendar, FaHashtag, FaPlus } from "react-icons/fa6";
import { FiFilter } from "react-icons/fi";
import { HiOutlineHashtag } from "react-icons/hi";
import { LuCopy, LuRefreshCw } from "react-icons/lu";
import { RiText } from "react-icons/ri";
import { RxComponentBoolean } from "react-icons/rx";
import { formatDate } from "../../utils/utils";
import RegisterAdminModal from "./RegisterAdminModal";

interface FetchAdminData {
  rows: any[];
  columns: any[];
}

const Admin = () => {
  const { data, isLoading } = useQuery<FetchAdminData>({
    queryKey: ["admins"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/admin");
      return res.data;
    },
  });

  const queryClient = useQueryClient();

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
      const pk = data?.columns?.find((col) => col.name === columnKey)?.pk;

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

      const dtype = data?.columns?.find((col) => col.name === columnKey)?.type;
      switch (dtype) {
        case "DATETIME":
        case "datetime":
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
    [data?.columns]
  );

  const TopContent = () => {
    return (
      <div className="my-3 mx-3 md:flex block items-center justify-between">
        <div className="flex gap-2 items-center justify-between md:justify-normal">
          <p className="font-semibold">Admin</p>
          <div className="flex gap-2 items-center">
            <Button
              radius="sm"
              className="h-7 p-0 w-7 hover:bg-slate-200 bg-transparent min-w-0"
            >
              <LuRefreshCw
                // onClick={refetchData}
                fontSize={"1.25rem"}
                className="cursor-pointer"
              />
            </Button>
            <Button
              radius="sm"
              className="h-7 p-0 w-7 hover:bg-slate-200 bg-transparent min-w-0"
            >
              <FiFilter
                // onClick={onFilterOpen}
                fontSize={"1.25rem"}
                className="cursor-pointer"
              />
            </Button>
          </div>
        </div>
        <Button
          onClick={onInsertOpen}
          startContent={<FaPlus />}
          className=" md:mt-0 mt-3 rounded-md w-full md:w-[150px] bg-slate-950 text-white font-semibold"
        >
          New Admin
        </Button>
      </div>
    );
  };

  const {
    isOpen: isInsertOpen,
    onOpen: onInsertOpen,
    onClose: onInsertClose,
  } = useDisclosure();

  return (
    <>
      <div className="flex flex-col">
        <TopContent />
        <Table
          isHeaderSticky={true}
          classNames={{
            base: "max-h-[calc(100dvh_-_45px_-_5px)]  max-w-[calc(100vw_-_65px)] overflow-y-scroll",
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
          {data?.columns && data.rows ? (
            <TableHeader columns={data.columns}>
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

          {data?.columns && data.rows ? (
            <TableBody emptyContent="No records found" items={data.rows}>
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
      <RegisterAdminModal isOpen={isInsertOpen} onClose={onInsertClose} />
    </>
  );
};

export default Admin;

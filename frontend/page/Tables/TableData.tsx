import {
  Tooltip,
  Button,
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
  Spinner,
  Input,
} from "@nextui-org/react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
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
import axiosInstance from "../../pkg/axiosInstance";
import FloatingBox from "../../components/FloatingBox";
import { TbCirclesRelation } from "react-icons/tb";
import { toast } from "react-toastify";
import { FaChevronDown, FaChevronUp, FaCode, FaRegFile } from "react-icons/fa6";
import { useInView } from "react-intersection-observer";
import APIPreview from "./APIPreview";

interface TableDataProps {
  table: {
    name: string;
    auth: boolean;
  };
  resetTable: () => void;
}

export interface FetchFilter {
  column: string;
  operator: string;
  value: string;
}

export const fetchRows = async (page: number, table: string, params: any) => {
  if (table === undefined || table === "") {
    return [];
  }

  const res = await axiosInstance.get(`/api/main/${table}/rows`, {
    params: {
      page: page,
      ...params,
    },
  });

  return res.data;
};

const TableData = ({ table, resetTable }: TableDataProps) => {
  const [mounted, setMounted] = useState(false);

  const { data: columns } = useQuery<any[]>({
    queryKey: ["columns", table.name],
    queryFn: async () => {
      if (
        table !== undefined &&
        table.name !== "" &&
        table.name !== undefined
      ) {
        const res = await axiosInstance.get(`/api/main/${table.name}/columns`, {
          params: {
            fetch_auth_column: table.auth,
          },
        });
        return res.data;
      }

      return [];
    },
    staleTime: 1000 * 30,
  });

  const [params, setParams] = useState({
    filter: "",
    sort: "",
    page_size: 20,
    get_count: false,
  });

  const {
    data: rowsSplitted,
    fetchNextPage,
    isLoading,
    isRefetching,
    isPending,
    isFetching,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ["rows", table.name, params],
    queryFn: ({ pageParam }) => fetchRows(pageParam, table.name, params),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const pageSize = lastPage.page_size;
      const currentPage = lastPage.page;
      if (!lastPage.data) return undefined;

      return lastPage.data.length === pageSize ? currentPage + 1 : undefined;
    },
  });

  const rows = rowsSplitted?.pages.flatMap((page) => page.data);

  useEffect(() => {
    if (!mounted && columns && rows) {
      setMounted(true);
    }
  }, [columns, rows]);

  const queryClient = useQueryClient();

  const refetchData = async () => {
    await queryClient.refetchQueries({
      queryKey: ["rows", table.name],
      type: "active",
    });
  };

  const renderHeader = (column: any) => {
    if (column.pk === 1) {
      return (
        <TooltipContainer column={column}>
          <div className="flex items-center gap-2">
            <CgKey size={16} />
            <p>{column.name}</p>
            <Sortable column={column.name} />
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
              <Sortable column={column.name} />
            </div>
          </TooltipContainer>
        );
      case "RELATION":
        return (
          <TooltipContainer column={column}>
            <div className="flex items-center gap-2">
              <TbCirclesRelation size={16} />
              <p>{column.name}</p>
              <Sortable column={column.name} />
            </div>
          </TooltipContainer>
        );
      case "TIMESTAMP":
        return (
          <TooltipContainer column={column}>
            <div className="flex items-center gap-2">
              <FaRegCalendar size={14} />
              <p>{column.name}</p>
              <Sortable column={column.name} />
            </div>
          </TooltipContainer>
        );
      case "DATETIME":
        return (
          <TooltipContainer column={column}>
            <div className="flex items-center gap-2">
              <FaRegCalendar size={14} />
              <p>{column.name}</p>
              <Sortable column={column.name} />
            </div>
          </TooltipContainer>
        );
      case "REAL":
        return (
          <TooltipContainer column={column}>
            <div className="flex items-center gap-2">
              <HiOutlineHashtag size={14} />
              <p>{column.name}</p>
              <Sortable column={column.name} />
            </div>
          </TooltipContainer>
        );
      case "INTEGER":
        return (
          <TooltipContainer column={column}>
            <div className="flex items-center gap-2">
              <FaHashtag size={12} />
              <p>{column.name}</p>
              <Sortable column={column.name} />
            </div>
          </TooltipContainer>
        );
      case "BOOLEAN":
        return (
          <TooltipContainer column={column}>
            <div className="flex items-center gap-2">
              <RxComponentBoolean size={12} />
              <p>{column.name}</p>
              <Sortable column={column.name} />
            </div>
          </TooltipContainer>
        );
      case "BLOB":
        return (
          <TooltipContainer column={column}>
            <div className="flex items-center gap-2">
              <FaRegFile size={12} />
              <p>{column.name}</p>
              <Sortable column={column.name} />
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

      if (!cellValue) return "";

      const pk = columns?.find((col) => col.name === columnKey)?.pk;

      if (pk === 1)
        return (
          <Button
            onClick={() => navigator.clipboard.writeText(cellValue)}
            className="h-7 p-0 px-3 min-w-0 bg-slate-50"
            variant="light"
          >
            <div className="flex items-center gap-3">
              {cellValue}
              <LuCopy />
            </div>
          </Button>
        );

      const dtype = columns?.find((col) => col.name === columnKey)?.type;
      switch (dtype) {
        case "TIMESTAMP":
        case "DATETIME":
          if (!cellValue) return "";
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
    isOpen: isPreviewOpen,
    onOpen: onPreviewOpen,
    onClose: onPreviewClose,
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

  const [selectedRow, setSelectedRow] = useState<string>("");

  const [search, setSearch] = useState("");
  const applySearch = () => {
    setParams({ ...params, filter: search });
  };

  const [selectedRows, setSelectedRows] = useState<Selection>(new Set([]));
  const { mutateAsync } = useMutation({
    mutationFn: async () => {
      await axiosInstance.delete(`/api/main/${table.name}/rows`, {
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

  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView) {
      fetchNextPage();
    }
  }, [inView]);

  const [sortDescriptor, setSortDescriptor] = useState<{
    column: string;
    direction: "ASC" | "DESC";
  }>({
    column: "id",
    direction: "ASC",
  });

  useEffect(() => {
    if (sortDescriptor.column && sortDescriptor.direction) {
      console.log(sortDescriptor);
      setParams({
        ...params,
        sort: `${sortDescriptor.column} ${sortDescriptor.direction}`,
      });
    }
  }, [sortDescriptor]);

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

  const handleSortChange = (column: string) => {
    setSortDescriptor((prevSortDescriptor) => {
      if (column === prevSortDescriptor.column) {
        return {
          ...prevSortDescriptor,
          direction: prevSortDescriptor.direction === "ASC" ? "DESC" : "ASC",
        };
      } else {
        return {
          column: column,
          direction: "ASC",
        };
      }
    });
  };

  const Sortable = ({ column }: any) => {
    return (
      <div
        className="cursor-pointer self-end opacity-50 hover:opacity-100 transition-opacity duration-300"
        onClick={() => {
          handleSortChange(column);
        }}
      >
        {sortDescriptor.direction === "ASC" ? (
          <FaChevronDown />
        ) : (
          <FaChevronUp />
        )}
      </div>
    );
  };

  if (columns?.length === 0) {
    return (
      <div className="flex h-full w-full mt-[50px] justify-center">
        <p className="text-slate-500 font-semibold text-lg">No table found</p>
      </div>
    );
  }

  if (!mounted) {
    return <Spinner />;
  }

  return (
    <>
      <div className="flex flex-col">
        <div className="flex flex-col">
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
              </div>
            </div>
            <div className="flex h-full justify-end gap-2 items-center md:mt-0 mt-3">
              <Button
                onClick={onPreviewOpen}
                startContent={<FaCode />}
                variant="bordered"
                className="rounded-md w-full md:w-[150px] bg-default-100 border-slate-950 text-slate-950 font-semibold"
              >
                API Preview
              </Button>
              <Button
                onClick={onInsertOpen}
                startContent={<FaPlus />}
                className="rounded-md w-full md:w-[150px] bg-slate-950 text-white font-semibold"
              >
                New Data
              </Button>
            </div>
          </div>
          <div className="px-5 py-3">
            <Input
              value={search}
              onValueChange={setSearch}
              variant="bordered"
              className="text-lg"
              size="lg"
              radius="sm"
              placeholder={`Search for item or filter created_at > "2022-01-01"`}
              onKeyDown={(e) => {
                if (e.key === "Enter") applySearch();
              }}
              endContent={
                <Button
                  className="rounded-md bg-slate-950 text-white font-semibold"
                  size="sm"
                  onClick={applySearch}
                >
                  Search
                </Button>
              }
            />
          </div>
        </div>
        <Table
          bottomContent={
            hasNextPage ? (
              <>
                {isLoading ? (
                  <div className="w-full flex justify-center mb-4">
                    <Spinner size="lg" color="default" />
                  </div>
                ) : (
                  <div ref={ref} className="mb-4 w-full "></div>
                )}
              </>
            ) : (
              <div></div>
            )
          }
          selectedKeys={selectedRows}
          onSelectionChange={(keys) => setSelectedRows(keys)}
          onRowAction={(key) => {
            onUpdateOpen();
            setSelectedRow(key.toString());
          }}
          isHeaderSticky={true}
          className="scroll-shadow scrollbar-hide"
          classNames={{
            wrapper: "scroll-shadow",
            base: "pb-15 max-h-[calc(100dvh_-_181px)] max-w-[calc(100vw_-_315px)] overflow-y-scroll overflow-x-scroll ",
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
            <TableBody emptyContent="No records found" items={rows as any[]}>
              {(item) => (
                <TableRow className="cursor-pointer" key={item.id}>
                  {(columnKey) => (
                    <TableCell>{renderCell(item, columnKey)}</TableCell>
                  )}
                </TableRow>
              )}
            </TableBody>
          ) : (
            <TableBody
              isLoading={isLoading || isRefetching || isFetching || isPending}
            >
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
        onClose={() => {
          onSettingClose();
          setSelectedRow("");
        }}
        onDeleteTable={() => {
          resetTable();
        }}
      />
      <UpdateDataModal
        tableName={table.name}
        isOpen={isUpdateOpen}
        onClose={() => {
          onUpdateClose();
          setSelectedRow("");
        }}
        id={selectedRow}
      />
      <APIPreview
        table={table.name}
        isAuth={table.auth}
        isOpen={isPreviewOpen}
        onClose={onPreviewClose}
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

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
} from "@nextui-org/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useCallback } from "react";
import { CgKey } from "react-icons/cg";
import { FaRegCalendar, FaHashtag, FaPlus } from "react-icons/fa";
import { HiOutlineHashtag } from "react-icons/hi";
import { LuCopy, LuSettings, LuRefreshCw } from "react-icons/lu";
import { RiText } from "react-icons/ri";
import { RxComponentBoolean } from "react-icons/rx";
import { formatDate } from "../../utils/utils";
import InsertDataModal from "./InsertDataModal";

interface TableDataProps {
  tableName: string;
  renderUpper?: boolean;
}
const TableData = ({ tableName, renderUpper }: TableDataProps) => {
  // const [rowsPerPage, setRowsPerPage] = useState(20);
  // const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({});
  // const [page, setPage] = useState(1);

  const { data: columns } = useQuery<any[]>({
    queryKey: ["columns", tableName],
    queryFn: async () => {
      const res = await axios.get(`/api/db/table/${tableName}/columns`);
      return res.data;
    },
  });

  const { data: rows, isLoading } = useQuery<any[]>({
    queryKey: ["rows", tableName],
    queryFn: async () => {
      const res = await axios.get(`/api/db/table/${tableName}/rows`);
      return res.data;
    },
  });

  const queryClient = useQueryClient();

  const refetchData = async () => {
    await queryClient.refetchQueries({
      queryKey: ["rows", tableName],
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
      console.log(dtype);
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

  const TopContent = () => {
    return (
      <div className="mt-3 mx-3 md:flex block items-center justify-between">
        <div className="flex gap-2 items-center">
          <Breadcrumbs
            size="lg"
            isDisabled
            separator="/"
            className="text-xl font-semibold"
          >
            <BreadcrumbItem>Table</BreadcrumbItem>
            <BreadcrumbItem>
              <p>{tableName}</p>
            </BreadcrumbItem>
          </Breadcrumbs>
          <Button className="h-7 p-0 w-7 hover:bg-slate-200 bg-transparent min-w-0">
            <LuSettings fontSize={"1.25rem"} className="cursor-pointer" />
          </Button>
          <Button className="h-7 p-0 w-7 hover:bg-slate-200 bg-transparent min-w-0">
            <LuRefreshCw
              onClick={refetchData}
              fontSize={"1.25rem"}
              className="cursor-pointer"
            />
          </Button>
        </div>
        <div className="flex justify-end gap-2 mt-3">
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

  return (
    <>
      <Table
        topContent={renderUpper ? <TopContent /> : undefined}
        isHeaderSticky={true}
        classNames={{
          base: "max-h-[calc(100dvh_-_45px_-_5px)] max-w-[calc(100vw_-_275px)] overflow-y-scroll overflow-x-scroll",
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
              <TableRow key={item.id}>
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
      <InsertDataModal
        tableName={tableName}
        isOpen={isInsertOpen}
        onClose={onInsertClose}
      />
    </>
  );
};

export default TableData;

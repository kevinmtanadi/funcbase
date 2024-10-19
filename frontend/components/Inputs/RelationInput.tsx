import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../../pkg/axiosInstance";
import {
  Button,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Skeleton,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tooltip,
  useDisclosure,
} from "@nextui-org/react";
import { TbCirclesRelation } from "react-icons/tb";
import { useCallback, useState } from "react";
import classNames from "classnames";
import { LuCopy } from "react-icons/lu";
import { formatDate } from "../../utils/utils";

interface RelationInputProps {
  id?: string;
  name?: string;
  label: string;
  value?: string;
  onChange: (value: string) => void;
  isRequired?: boolean;
  isDisabled?: boolean;
  relatedTable: string;
}
const RelationInput = ({
  label,
  value,
  onChange,
  relatedTable,
}: RelationInputProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <div
        onClick={onOpen}
        className="px-3 cursor-pointer py-2 w-full border-2 border-default-200 shadow-sm hover:border-default-400 flex flex-col rounded-md"
      >
        <div className="flex items-center gap-2">
          <TbCirclesRelation color="gray" size={14} />
          <div className="font-semibold text-sm text-default-700">{label}</div>
        </div>
        <p className="text-default-500 text-sm">{value}</p>
      </div>
      <SelectRelationModal
        tableName={relatedTable}
        onChange={onChange}
        isOpen={isOpen}
        onClose={onClose}
      />
    </>
  );
};

interface SRMProps {
  tableName: string;
  onChange: (value: string) => void;
  isOpen: boolean;
  onClose: () => void;
}
const SelectRelationModal = ({
  onChange,
  tableName,
  isOpen,
  onClose,
}: SRMProps) => {
  const { data: table } = useQuery({
    queryKey: ["tables", tableName],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/main/tables`, {
        params: {
          search: tableName,
        },
      });
      return res.data[0];
    },
  });

  const { data: columns } = useQuery<any[]>({
    queryKey: ["columns", table],
    queryFn: async () => {
      if (table !== undefined && table.name !== "" && table !== undefined) {
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
    page_size: 5,
    page: 1,
    get_count: false,
  });

  const { data: rows, isLoading } = useQuery({
    queryKey: ["rows", table, params],
    queryFn: async () => {
      if (table === undefined || table.name === "") {
        return [];
      }

      const res = await axiosInstance.get(`/api/main/${table.name}/rows`, {
        params: params,
      });

      return res.data;
    },
  });

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

  const [search, setSearch] = useState("");
  const applySearch = () => {
    setParams({ ...params, filter: search });
  };

  if (!table) {
    return <Spinner />;
  }
  return (
    <Modal size="4xl" isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader></ModalHeader>
        <ModalBody>
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
          <Table
            isCompact
            selectionMode="single"
            onRowAction={(key) => {
              onChange(key.toString());
              onClose();
            }}
            isHeaderSticky={true}
            classNames={{
              base: "pb-15 overflow-y-scroll text-sm overflow-x-scroll border",
              thead: "[&>tr]:first:rounded-none",
              th: [
                "text-default-500 text-xs",
                "border-b",
                "rounded-none",
                "border-divider",
                "hover:bg-slate-200",
                "first:hover:bg-gray-100",
                "first:w-[50px]",
              ],
              tr: "[&>th]:first:rounded-none [&>th]:last:rounded-none border-b-1 rounded-none",
              td: [
                "first:w-[50px] text-xs",
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
            removeWrapper
          >
            {columns && rows ? (
              <TableHeader columns={columns}>
                {(column) => (
                  <TableColumn key={column.name}>{column.name}</TableColumn>
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
              <TableBody
                emptyContent="No records found"
                items={rows.data as any[]}
              >
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
          {/* <TableData table={table} resetTable={() => {}} /> */}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default RelationInput;

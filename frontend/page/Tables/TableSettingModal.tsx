import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  BreadcrumbItem,
  Breadcrumbs,
  Button,
  Tabs,
  Tab,
  Spinner,
  Divider,
  useDisclosure,
  Checkbox,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHeader,
  TableColumn,
} from "@nextui-org/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FaRegTrashAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import axiosInstance from "../../pkg/axiosInstance";
import { useEffect, useState } from "react";
import classNames from "classnames";
import { Field, renderField } from "./CreateTableModal";
import DeleteTableConfirmModal from "./DeleteTableConfirmModal";
import { generateRandomString } from "../../utils/utils";
import CreateIndexModal, { Index } from "./CreateIndexModal";
import UpdateIndexModal from "./UpdateIndexModal";
import NewFieldButton from "../../components/Fields/NewFieldButton";

interface TableSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableName: string;
  onDeleteTable: () => void;
}

const TableSettingModal = ({
  isOpen,
  onClose,
  tableName,
  onDeleteTable,
}: TableSettingModalProps) => {
  const {
    isOpen: isDelColOpen,
    onOpen: onDelColOpen,
    onClose: onDelColClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  return (
    <>
      <Modal radius="sm" size="2xl" isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>
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
          </ModalHeader>
          <ModalBody>
            <Tabs fullWidth>
              <Tab key={"columns"} title="Columns">
                <ColumnPage table={tableName} />
              </Tab>
              <Tab key={"danger"} title="Danger Zone">
                <div className="flex flex-col gap-2">
                  <Button
                    radius="sm"
                    variant="bordered"
                    className="bg-transparent  min-w-0 w-full"
                    onClick={onDelColOpen}
                  >
                    <div className="flex gap-2 justify-between w-full items-center">
                      <p className="font-semibold">Delete Column</p>
                    </div>
                  </Button>
                  <Button
                    radius="sm"
                    variant="bordered"
                    className="bg-transparent  min-w-0 w-full"
                    color="danger"
                    onClick={() => {
                      onClose();
                      onDeleteOpen();
                    }}
                  >
                    <div className="flex gap-2 justify-between w-full items-center">
                      <p className="font-semibold text-red-600">Delete Table</p>
                      <FaRegTrashAlt className="text-red-600" />
                    </div>
                  </Button>
                </div>
              </Tab>
              <Tab key={"access"} title="Access"></Tab>
            </Tabs>
          </ModalBody>
        </ModalContent>
      </Modal>
      <DeleteColumnModal
        isOpen={isDelColOpen}
        onClose={onDelColClose}
        table={tableName}
      />
      <DeleteTableConfirmModal
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        table={tableName}
        onDelete={() => {
          onDeleteClose();
          onDeleteTable();
        }}
      />
    </>
  );
};

interface ColumnPageProps {
  table: string;
}

const ColumnPage = ({ table }: ColumnPageProps) => {
  const { data: tableInfo, isLoading } = useQuery<{
    columns: any[];
    index: any[];
  }>({
    queryKey: ["tableInfo", table],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/main/table/${table}`, {
        params: {
          data: "columns",
        },
      });

      return res.data.data;
    },
  });

  const [tableState, setTableState] = useState<any>({
    table_name: table,
    columns: [],
    index: [],
  });

  const [r, setR] = useState(0);
  useEffect(() => {
    if (tableInfo) {
      const columns = tableInfo?.columns.map((col: any) => {
        return {
          id: generateRandomString(12),
          type: col.type,
          name: col.name,
          nullable: !col.not_null,
          reference: col.reference,
        } as Field;
      });

      const index = tableInfo?.index.map((idx: any) => {
        return {
          name: idx.name,
          indexes: idx.indexes.map((i: any) => {
            return columns.find((col: any) => col.name === i)?.id as string;
          }),
        };
      });

      setTableState({
        table_name: table,
        columns: columns,
        index: index,
      });
    }
  }, [tableInfo, r]);

  const {
    isOpen: isIndexOpen,
    onOpen: onIndexOpen,
    onClose: onIndexClose,
  } = useDisclosure();
  const {
    isOpen: isUpIndexOpen,
    onOpen: onUpIndexOpen,
    onClose: onUpIndexClose,
  } = useDisclosure();
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const openUpdateModal = (idx: number) => {
    setSelectedIdx(idx);
    onUpIndexOpen();
  };

  const addNewField = (type: string) => {
    setTableState({
      ...tableState,
      columns: [
        ...tableState.columns,
        {
          id: generateRandomString(12),
          type: type,
          name: "",
          nullable: true,
          unique: false,
        },
      ],
    });
  };

  const deleteField = (idx: number) => {
    setTableState({
      ...tableState,
      columns: [
        ...tableState.columns.slice(0, idx),
        ...tableState.columns.slice(idx + 1),
      ],
    });
  };

  const queryClient = useQueryClient();
  const { mutateAsync } = useMutation({
    mutationFn: async () => {
      const fields = tableState.columns
        .filter((col: any) => {
          return !["id", "created_at", "updated_at"].includes(col.name);
        })
        .map((col: any) => ({
          name: col.name,
          nullable: col.nullable,
          type: col.type,
          unique: col.unique,
        }));

      const indexes = tableState.index.map((idx: any) => ({
        name: idx.name,
        indexes: idx.indexes.map((idx: string) => {
          console.log(idx);
          return tableState.columns.find((col: any) => col.id === idx)?.name;
        }),
      }));

      const res = await axiosInstance.put(`/api/main/table/update`, {
        table_name: tableState.table_name,
        updated_table_name: tableState.table_name,
        fields: fields,
        indexes: indexes,
      });

      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tableInfo", table],
      });
      queryClient.invalidateQueries({
        queryKey: ["columns", table],
        type: "active",
      });
    },
  });

  const updateTable = () => {
    toast.promise(mutateAsync(), {
      pending: "Updating Table",
      success: "Table Updated",
      error: "Failed to Update Table",
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {isLoading ? (
        <Spinner size="lg" color="default" />
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2">
            <p className="font-semibold mb-2 text-lg">Columns</p>
            {tableState?.columns?.map(
              (col: Field, index: number) =>
                renderField(
                  col,
                  index,
                  (field) =>
                    setTableState({
                      ...tableState,
                      columns: [
                        ...tableState.columns.slice(0, index),
                        field,
                        ...tableState.columns.slice(index + 1),
                      ],
                    }),
                  () => deleteField(index),
                  [
                    "id",
                    "email",
                    "password",
                    "salt",
                    "created_at",
                    "updated_at",
                  ].includes(col.name)
                )
              // <GeneralField
              //   isDisabled={[
              //     "id",
              //     "email",
              //     "password",
              //     "salt",
              //     "created_at",
              //     "updated_at",
              //   ].includes(col.name)}
              //   field={col}
              //   onChange={(field: Field) => {
              //     setTableState({
              //       ...tableState,
              //       columns: [
              //         ...tableState.columns.slice(0, idx),
              //         field,
              //         ...tableState.columns.slice(idx + 1),
              //       ],
              //     });
              //   }}
              //   onDelete={(idx: number) => {
              //     setTableState({
              //       ...tableState,
              //       columns: [
              //         ...tableState.columns.slice(0, idx),
              //         ...tableState.columns.slice(idx + 1),
              //       ],
              //     });
              //   }}
              //   idx={idx}
              // />
            )}
          </div>
          <NewFieldButton onAdd={addNewField} isLoading={isLoading} />
          <Divider className="my-2" />
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <p className="font-semibold">Indexes</p>
              <p className="text-sm text-blue-700">
                Index significantly improves read performance, but increases
                storage overhead and reduce the efficiency of write operations.
                It's recommended to only use index on fields that are frequently
                used to filter data.
              </p>
            </div>
            <div className="flex gap-2 items-center">
              {tableState?.index?.map((index: any, idx: number) => (
                <Button
                  className="rounded-md border-slate-950 h-[45px]"
                  variant="bordered"
                  key={idx}
                  onClick={() => openUpdateModal(idx)}
                >
                  <div className="text-xs flex flex-col text-start">
                    <p className="font-semibold">{index.name}</p>
                    <p>
                      {index.indexes
                        ?.map((i: string) => {
                          return tableState.columns.find((c: any) => c.id === i)
                            ?.name;
                        })
                        .join(", ")}
                    </p>
                  </div>
                </Button>
              ))}
              <Button
                onClick={onIndexOpen}
                className="bg-slate-950 text-white rounded-md h-[45px]"
              >
                Create Index
              </Button>
            </div>
          </div>
        </div>
      )}
      <Divider />
      <div className="w-full justify-end gap-3 flex">
        <Button
          className="rounded-md bg-transparent hover:bg-slate-100"
          onClick={() => {
            setR(r + 1);
          }}
        >
          Reset
        </Button>
        <Button
          className="rounded-md bg-slate-950 text-white"
          onClick={() => {
            updateTable();
          }}
        >
          Save
        </Button>
      </div>
      <CreateIndexModal
        isOpen={isIndexOpen}
        onClose={onIndexClose}
        fields={tableState?.columns}
        onAdd={(index) => {
          setTableState({ ...tableState, index: [...tableState.index, index] });
        }}
      />
      <UpdateIndexModal
        isOpen={isUpIndexOpen}
        onClose={onUpIndexClose}
        fields={tableState?.columns}
        idx={selectedIdx}
        index={tableState.index[selectedIdx]}
        onUpdate={(idx: number, index: Index) => {
          setTableState({
            ...tableState,
            index: [
              ...tableState.index.slice(0, idx),
              index,
              ...tableState.index.slice(idx + 1),
            ],
          });
        }}
        onDelete={(idx: number) => {
          setTableState({
            ...tableState,
            index: [
              ...tableState.index.slice(0, idx),
              ...tableState.index.slice(idx + 1),
            ],
          });
        }}
      />
    </div>
  );
};

interface DeleteColumnModalProps {
  table: string;
  onClose: () => void;
  isOpen: boolean;
}
const DeleteColumnModal = ({
  table,
  isOpen,
  onClose,
}: DeleteColumnModalProps) => {
  const queryClient = useQueryClient();

  const { data: columns } = useQuery<any[]>({
    queryKey: ["columns", table],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/main/${table}/columns`);
      return res.data;
    },
  });

  const [selectedCol, setSelectedCol] = useState<string[]>([]);

  const { mutateAsync } = useMutation({
    mutationFn: () => {
      return axiosInstance.delete(`/api/main/${table}/delete_column`, {
        data: {
          columns: selectedCol,
        },
      });
    },
    onSuccess: () => {
      queryClient.refetchQueries({
        queryKey: ["tables"],
        type: "active",
      });
      queryClient.refetchQueries({
        queryKey: ["columns", table],
        type: "active",
      });
      queryClient.refetchQueries({
        queryKey: ["rows", table],
        type: "active",
      });
      onClose();
    },
  });

  const deleteColumns = () => {
    toast.promise(mutateAsync(), {
      pending: "Deleting columns...",
      success: "Columns deleted successfully",
      error: "Error when deleting columns",
    });
  };

  if (!columns || columns.length === 0) {
    return <></>;
  }

  return (
    <Modal id="tab-set" size="md" isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>Delete columns from [{table}]</ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-2">
            <Table isStriped hideHeader removeWrapper>
              <TableHeader>
                <TableColumn>Column Name</TableColumn>
                <TableColumn>Is Checked</TableColumn>
              </TableHeader>
              <TableBody>
                {columns.map((column: any) => (
                  <TableRow key={column.name}>
                    <TableCell
                      className={classNames({
                        "font-semibold": true,
                        "text-default-300": [
                          "id",
                          "created_at",
                          "updated_at",
                          "email",
                        ].includes(column.name),
                      })}
                    >
                      {column.name}
                    </TableCell>
                    <TableCell className="text-right">
                      <Checkbox
                        isDisabled={[
                          "id",
                          "created_at",
                          "updated_at",
                          "email",
                        ].includes(column.name)}
                        isSelected={selectedCol.includes(column.name)}
                        onValueChange={() =>
                          setSelectedCol((prev) =>
                            prev.includes(column.name)
                              ? prev.filter((item) => item !== column.name)
                              : [...prev, column.name]
                          )
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            fullWidth
            className="rounded-md w-full bg-transparent hover:bg-default-200  font-semibold"
          >
            Cancel
          </Button>
          <Button
            fullWidth
            className="rounded-md w-full bg-slate-950 text-white font-semibold"
            isDisabled={selectedCol.length === 0}
            onClick={deleteColumns}
          >
            Delete Columns
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default TableSettingModal;

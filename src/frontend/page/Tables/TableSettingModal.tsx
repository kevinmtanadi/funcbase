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
  Input,
  Accordion,
  AccordionItem,
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
import { useState } from "react";
import classNames from "classnames";
import { FaPlus, FaRegCalendar, FaRegFile } from "react-icons/fa6";
import { datatypes } from "../../data/datatypes";
import { Field } from "./CreateTableModal";
import { HiOutlineHashtag } from "react-icons/hi";
import { RiText } from "react-icons/ri";
import { RxComponentBoolean } from "react-icons/rx";
import { TbCirclesRelation } from "react-icons/tb";
import GeneralField from "../../components/Fields/GeneralField";
import RelationField from "../../components/Fields/RelationField";
import { CgKey } from "react-icons/cg";
import DeleteTableConfirmModal from "./DeleteTableConfirmModal";

interface TableSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableName: string;
}

const TableSettingModal = ({
  isOpen,
  onClose,
  tableName,
}: TableSettingModalProps) => {
  return (
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
              <DangerPage table={tableName} onDelete={onClose} />
            </Tab>
          </Tabs>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

interface ColumnPageProps {
  table: string;
}

const ColumnPage = ({ table }: ColumnPageProps) => {
  const { data: columns, isLoading } = useQuery({
    queryKey: ["columns", table],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/main/${table}/columns`);
      return res.data;
    },
  });

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isRenameOpen,
    onOpen: onRenameOpen,
    onClose: onRenameClose,
  } = useDisclosure();

  if (isLoading) {
    return (
      <div className="flex flex-col w-full justify-center items-center">
        <Spinner color="default" size="lg" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <Table>
          <TableHeader>
            <TableColumn>name</TableColumn>
            <TableColumn>type</TableColumn>
            <TableColumn>nullable</TableColumn>
          </TableHeader>
          <TableBody>
            {columns?.map((col: any, idx: number) => (
              <TableRow key={idx}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <p>{col.name}</p>
                    {col.pk === 1 && <CgKey size={16} />}
                  </div>
                </TableCell>
                <TableCell>{col.type}</TableCell>
                <TableCell>{col.notnull ? "Yes" : "No"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Button
          variant="bordered"
          className="font-semibold"
          radius="sm"
          onClick={onRenameOpen}
        >
          Change Column Names
        </Button>
        <Button
          variant="bordered"
          className="font-semibold"
          radius="sm"
          onClick={onOpen}
          startContent={<FaPlus />}
        >
          Add New Column
        </Button>
      </div>
      <RenameColumnModal
        table={table}
        isOpen={isRenameOpen}
        onClose={onRenameClose}
      />
      <AddColumnModal table={table} isOpen={isOpen} onClose={onClose} />
    </>
  );
};

interface AddColumnModalProps {
  table: string;
  isOpen: boolean;
  onClose: () => void;
}

const AddColumnModal = ({ table, isOpen, onClose }: AddColumnModalProps) => {
  const [fields, setFields] = useState<Field[]>([]);
  const addNewField = (type: string) => {
    setFields([
      ...fields,
      {
        field_type: type,
        field_name: "",
        indexed: false,
        nullable: true,
        unique: false,
      },
    ]);
  };

  const { data: tables, isLoading } = useQuery<{ name: string }[]>({
    queryKey: ["tables"],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/main/tables`);
      return res.data;
    },
  });

  const deleteField = (idx: number) => {
    console.log([...fields.slice(0, idx), ...fields.slice(idx + 1)]);
    setFields((prev) => prev.filter((_, i) => i !== idx));
  };

  const renderField = (field: Field, index: number) => {
    switch (field.field_type) {
      case "text":
        return (
          <GeneralField
            key={index}
            onDelete={() => deleteField(index)}
            onChange={(field) =>
              setFields([
                ...fields.slice(0, index),
                field,
                ...fields.slice(index + 1),
              ])
            }
            field={field}
            idx={index}
            icon={<RiText />}
          />
        );
      case "number":
        return (
          <GeneralField
            key={index}
            onDelete={() => deleteField(index)}
            onChange={(field) =>
              setFields([
                ...fields.slice(0, index),
                field,
                ...fields.slice(index + 1),
              ])
            }
            field={field}
            idx={index}
            icon={<HiOutlineHashtag />}
          />
        );
      case "datetime":
        return (
          <GeneralField
            key={index}
            onDelete={() => deleteField(index)}
            onChange={(field) =>
              setFields([
                ...fields.slice(0, index),
                field,
                ...fields.slice(index + 1),
              ])
            }
            field={field}
            idx={index}
            icon={<FaRegCalendar />}
          />
        );
      case "boolean":
        return (
          <GeneralField
            key={index}
            onDelete={() => deleteField(index)}
            onChange={(field) =>
              setFields([
                ...fields.slice(0, index),
                field,
                ...fields.slice(index + 1),
              ])
            }
            field={field}
            idx={index}
            icon={<RxComponentBoolean />}
          />
        );
      case "relation":
        return (
          <RelationField
            key={index}
            onDelete={() => deleteField(index)}
            onChange={(field) =>
              setFields([
                ...fields.slice(0, index),
                field,
                ...fields.slice(index + 1),
              ])
            }
            field={field}
            idx={index}
            icon={<TbCirclesRelation />}
          />
        );
      case "file":
        return (
          <GeneralField
            key={index}
            onDelete={() => deleteField(index)}
            onChange={(field) =>
              setFields([
                ...fields.slice(0, index),
                field,
                ...fields.slice(index + 1),
              ])
            }
            field={field}
            idx={index}
            icon={<FaRegFile />}
          />
        );
      default:
    }
  };

  const queryClient = useQueryClient();
  const { mutateAsync } = useMutation({
    mutationFn: () => {
      return axiosInstance.put(`/api/main/${table}/add_column`, {
        fields: fields.map((field) => {
          if (field.field_type === "relation" && !field.related_table) return;
          if (field.field_name === "") return;

          return {
            field_name: field.field_name,
            field_type: field.field_type,
            nullable: field.nullable,
            related_table: field.related_table,
            indexed: field.indexed,
            unique: field.unique,
          };
        }),
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
      setFields([]);
      onClose();
    },
  });

  const updateTable = () => {
    toast.promise(mutateAsync(), {
      pending: "Updating table...",
      success: "Table updated successfully",
      error: "Error when updating table",
    });
  };

  return (
    <Modal size="xl" isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>
          <p>Add column to [{table}]</p>
        </ModalHeader>
        <ModalBody>
          <Accordion className="rounded-md" variant="bordered">
            <AccordionItem
              classNames={{
                title: "w-full text-center text-md font-semibold",
                trigger: "py-3 rounded-none",
              }}
              className="text-center font-semibold rounded-none"
              key="1"
              title="Add new field"
            >
              <Divider className="" />
              <div className="grid grid-cols-3 w-full gap-2 mt-3">
                {datatypes.map((dtype) =>
                  dtype.dtype === "RELATION" ? (
                    <Button
                      isDisabled={!tables || tables.length === 0}
                      isLoading={isLoading}
                      startContent={dtype.icon}
                      onClick={() => addNewField(dtype.value)}
                      className="hover:bg-slate-200 bg-transparent rounded-md"
                    >
                      {dtype.label}
                    </Button>
                  ) : (
                    <Button
                      startContent={dtype.icon}
                      onClick={() => addNewField(dtype.value)}
                      className="hover:bg-slate-200 bg-transparent rounded-md"
                    >
                      {dtype.label}
                    </Button>
                  )
                )}
              </div>
            </AccordionItem>
          </Accordion>
          <div className="flex flex-col gap-4">
            {fields.map((field, index) => renderField(field, index))}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            fullWidth
            className="rounded-md w-full bg-transparent hover:bg-default-200  font-semibold"
            onClick={() => {
              setFields([]);
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            fullWidth
            className="rounded-md w-full bg-slate-950 text-white font-semibold"
            onClick={updateTable}
          >
            Add Columns
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

interface RenameColumnModalProps {
  table: string;
  onClose: () => void;
  isOpen: boolean;
}
const RenameColumnModal = ({
  table,
  onClose,
  isOpen,
}: RenameColumnModalProps) => {
  const [cols, setCols] = useState<any[]>([]);

  const {
    data: columns,
    isLoading,
    isFetching,
    isPending,
  } = useQuery({
    queryKey: ["columns", table],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/main/${table}/columns`);
      setCols(res.data);
      return res.data;
    },
  });

  const queryClient = useQueryClient();

  const { mutateAsync } = useMutation({
    mutationFn: (data: any) => {
      return axiosInstance.put(`/api/main/${table}/alter`, {
        columns: data,
      });
    },
    onSuccess: () => {
      queryClient.refetchQueries({
        queryKey: ["columns", table],
        type: "active",
      });

      queryClient.refetchQueries({
        queryKey: ["rows", table],
        type: "active",
      });
    },
  });

  const alterColumn = () => {
    const alteredColumns = cols.map((col: any, idx) => {
      if (col.name !== columns[idx].name) {
        return {
          original: columns[idx].name,
          altered: col.name,
        };
      }

      return null;
    });

    toast.promise(mutateAsync(alteredColumns.filter((col) => col !== null)), {
      pending: "Updating column name",
      success: "Column name updated successfully",
      error: "Error when updating column name",
    });
  };

  if (isLoading || isFetching || isPending) {
    return (
      <div className="flex flex-col w-full justify-center items-center">
        <Spinner color="default" size="lg" />
      </div>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>Rename column from [{table}]</ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-2">
            {cols
              .filter(
                (col) =>
                  ![
                    "id",
                    "created_at",
                    "updated_at",
                    "email",
                    "salt",
                    "password",
                  ].includes(col.name) && col.type !== "RELATION"
              )
              .map((col: any, idx) => (
                <Input
                  id={idx.toString()}
                  name={idx.toString()}
                  key={idx}
                  value={col.name}
                  onChange={(e) => {
                    setCols([
                      ...cols.slice(0, idx),
                      { ...cols[idx], name: e.target.value },
                      ...cols.slice(idx + 1),
                    ]);
                  }}
                  variant="bordered"
                  radius="sm"
                  isDisabled={
                    ["id", "created_at", "updated_at", "email"].includes(
                      col.name
                    ) || col.type === "RELATION"
                  }
                />
              ))}
          </div>
        </ModalBody>
        <ModalFooter>
          <div className="flex w-full mt-5 gap-2">
            <Button
              fullWidth
              className="rounded-md w-full bg-transparent hover:bg-default-200  font-semibold"
              onClick={() => {
                setCols(columns);
              }}
            >
              Reset
            </Button>
            <Button
              fullWidth
              className="rounded-md w-full bg-slate-950 text-white font-semibold"
              onClick={() => alterColumn()}
            >
              Save
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

interface DangerPageProps {
  table: string;
  onDelete: () => void;
}

const DangerPage = ({ table, onDelete }: DangerPageProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  return (
    <>
      <div className="flex flex-col gap-2">
        <Button
          radius="sm"
          variant="bordered"
          className="bg-transparent  min-w-0 w-full"
          onClick={onOpen}
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
          onClick={onDeleteOpen}
        >
          <div className="flex gap-2 justify-between w-full items-center">
            <p className="font-semibold text-red-600">Delete Table</p>
            <FaRegTrashAlt className="text-red-600" />
          </div>
        </Button>
      </div>
      <DeleteColumnModal isOpen={isOpen} onClose={onClose} table={table} />
      <DeleteTableConfirmModal
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        table={table}
        onDelete={onDelete}
      />
    </>
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

  if (!columns || columns.length === 0) {
    return <></>;
  }

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

  return (
    <Modal size="md" isOpen={isOpen} onClose={onClose}>
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

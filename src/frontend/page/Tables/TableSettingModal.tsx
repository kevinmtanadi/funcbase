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
  const queryClient = useQueryClient();
  const { mutateAsync } = useMutation({
    mutationFn: () => {
      return axiosInstance.delete(`/api/main/${tableName}`);
    },
    onSuccess: () => {
      queryClient.refetchQueries({
        queryKey: ["tables"],
        type: "active",
      });
      onClose();
    },
  });

  const deleteTable = () => {
    toast.promise(mutateAsync(), {
      pending: "Deleting table...",
      success: "Table deleted successfully",
      error: "Error when deleting table",
    });
  };

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
              <Button
                radius="sm"
                variant="bordered"
                className="bg-transparent  min-w-0 w-full"
                color="danger"
                onClick={() => deleteTable()}
              >
                <div className="flex gap-2 justify-between w-full items-center">
                  <p className="font-semibold text-red-600">Delete Table</p>
                  <FaRegTrashAlt className="text-red-600" />
                </div>
              </Button>
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

  const { isOpen, onOpen, onClose } = useDisclosure();

  if (isLoading || isFetching || isPending) {
    return (
      <div className="flex flex-col w-full justify-center items-center">
        <Spinner color="default" size="lg" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {cols.map((col: any, idx) => (
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
            classNames={{
              inputWrapper: classNames({
                "border-yellow-300": col.name !== columns[idx].name,
              }),
            }}
            isDisabled={
              ["id", "created_at", "updated_at", "salt"].includes(col.name) ||
              col.type === "RELATION"
            }
          />
        ))}

        <Button
          variant="bordered"
          className="font-semibold"
          radius="sm"
          onClick={onOpen}
          startContent={<FaPlus />}
        >
          Add New Column
        </Button>
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
      </div>
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

export default TableSettingModal;

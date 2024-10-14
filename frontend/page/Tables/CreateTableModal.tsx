import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Input,
  Divider,
  Code,
  Select,
  SelectItem,
  Button,
  ModalFooter,
  Accordion,
  AccordionItem,
  useDisclosure,
} from "@nextui-org/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { datatypes } from "../../data/datatypes";
import { toast } from "react-toastify";
import GeneralField from "../../components/Fields/GeneralField";
import { RiText } from "react-icons/ri";
import { HiOutlineHashtag } from "react-icons/hi";
import { RxComponentBoolean } from "react-icons/rx";
import { FaRegCalendar, FaRegFile, FaRegUser, FaTable } from "react-icons/fa6";
import RelationField from "../../components/Fields/RelationField";
import { TbCirclesRelation } from "react-icons/tb";
import axiosInstance from "../../pkg/axiosInstance";
import CreateIndexModal, { Index } from "./CreateIndexModal";
import { generateRandomString } from "../../utils/utils";
import UpdateIndexModal from "./UpdateIndexModal";

interface CreateTableModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface Field {
  id: string;
  field_type: string;
  field_name: string;
  nullable: boolean;
  unique: boolean;
  related_table?: string;
}

export interface Relation {
  related_table: string;
  type: "single" | "multiple";
}

export interface CreateTable {
  table_name: string;
  table_type: string;
  fields: Field[];
  indexes: Index[];
  relations: Relation[];
}

const CreateTableModal = ({ isOpen, onClose }: CreateTableModalProps) => {
  const [table, setTable] = useState<CreateTable>({
    table_name: "",
    table_type: "general",
    fields: [
      {
        id: "created_at",
        field_type: "timestamp",
        field_name: "created_at",
        nullable: false,
        unique: false,
      },
      {
        id: "updated_at",
        field_type: "timestamp",
        field_name: "updated_at",
        nullable: false,
        unique: false,
      },
    ],
    indexes: [],
    relations: [],
  });

  const addNewField = (type: string) => {
    setTable({
      ...table,
      fields: [
        ...table.fields,
        {
          id: generateRandomString(32),
          field_type: type,
          field_name: "",
          nullable: true,
          unique: false,
        },
      ],
    });
  };

  // override the close to empty the fields
  const handleClose = () => {
    setTable({
      table_name: "",
      table_type: "general",
      fields: [
        {
          id: "created_at",
          field_type: "timestamp",
          field_name: "created_at",
          nullable: false,
          unique: false,
        },
        {
          id: "updated_at",
          field_type: "timestamp",
          field_name: "updated_at",
          nullable: false,
          unique: false,
        },
      ],
      indexes: [],
      relations: [],
    });
    onClose();
  };

  const queryClient = useQueryClient();

  const { mutateAsync } = useMutation({
    mutationFn: () => {
      return axiosInstance.post("/api/main/table/create", {
        table_name: table.table_name,
        fields: table.fields.map((field) => {
          if (field.field_type === "relation" && !field.related_table) return;
          if (field.field_name === "") return;
          if (["id", "created_at", "updated_at"].includes(field.field_name))
            return;

          return {
            field_name: field.field_name,
            field_type: field.field_type,
            nullable: field.nullable,
            related_table: field.related_table,
            unique: field.unique,
          };
        }),
        indexes: table.indexes.map((index) => {
          if (index.name === "")
            return toast.error("Index name cannot be empty");
          let indexesField = [];
          for (const field of index.fields) {
            if (field === "created_at" || field === "updated_at") {
              indexesField.push(field);
            } else {
              indexesField.push(
                table.fields.find((f) => f.id === field)?.field_name
              );
            }
          }

          return {
            name: index.name,
            indexes: indexesField,
          };
        }),
        table_type: table.table_type,
      });
    },
    onSuccess: () => {
      queryClient.refetchQueries({
        queryKey: ["tables"],
        type: "active",
      });
      handleClose();
    },
  });

  const createTable = () => {
    toast.promise(mutateAsync(), {
      pending: "Creating new table...",
      success: "Table created successfully",
      error: "Error when creating table",
    });
  };

  const deleteField = (idx: number) => {
    setTable((prev) => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== idx),
    }));
  };

  const renderField = (field: Field, index: number) => {
    switch (field.field_type) {
      case "text":
        return (
          <GeneralField
            key={index}
            onDelete={() => deleteField(index)}
            onChange={(field) =>
              setTable({
                ...table,
                fields: [
                  ...table.fields.slice(0, index),
                  field,
                  ...table.fields.slice(index + 1),
                ],
              })
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
              setTable({
                ...table,
                fields: [
                  ...table.fields.slice(0, index),
                  field,
                  ...table.fields.slice(index + 1),
                ],
              })
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
              setTable({
                ...table,
                fields: [
                  ...table.fields.slice(0, index),
                  field,
                  ...table.fields.slice(index + 1),
                ],
              })
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
              setTable({
                ...table,
                fields: [
                  ...table.fields.slice(0, index),
                  field,
                  ...table.fields.slice(index + 1),
                ],
              })
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
              setTable({
                ...table,
                fields: [
                  ...table.fields.slice(0, index),
                  field,
                  ...table.fields.slice(index + 1),
                ],
              })
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
              setTable({
                ...table,
                fields: [
                  ...table.fields.slice(0, index),
                  field,
                  ...table.fields.slice(index + 1),
                ],
              })
            }
            field={field}
            idx={index}
            icon={<FaRegFile />}
          />
        );
      default:
    }
  };

  const { data: tables, isLoading } = useQuery<{ name: string }[]>({
    queryKey: ["tables"],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/main/tables`);
      return res.data;
    },
  });

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

  const renderTableInput = () => {
    switch (table.table_type) {
      case "general":
        return (
          <div className="flex flex-col gap-4">
            <Input
              value={table.table_name}
              onValueChange={(value) =>
                setTable({ ...table, table_name: value })
              }
              variant="bordered"
              classNames={{
                inputWrapper: "rounded-md",
                label: "text-md font-semibold",
              }}
              size="md"
              placeholder='eg. "products"'
              fullWidth
              labelPlacement="inside"
              label="Table name"
              type="text"
            />
            <Divider />
            <div className="flex flex-col gap-1">
              <p className="font-semibold">Fields</p>
              <p className="text-sm">
                Automatically created fields:{" "}
                <Code className="px-2 py-0 text-xs rounded-md">id</Code>,{" "}
                <Code className="px-2 py-0 text-xs rounded-md">created_at</Code>
                ,{" "}
                <Code className="px-2 py-0 text-xs rounded-md">updated_at</Code>
              </p>
            </div>

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
                  {datatypes.map((dtype, idx) =>
                    dtype.dtype === "RELATION" ? (
                      <Button
                        key={idx}
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
                        key={idx}
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
              {table.fields.map((field, index) => renderField(field, index))}
            </div>
            <Divider />
            <div className="flex flex-col gap-1">
              <p className="font-semibold">Indexes</p>
            </div>
            <div className="flex gap-2">
              {table.indexes.map((index, idx) => (
                <Button
                  className="rounded-md border-slate-950"
                  variant="bordered"
                  key={idx}
                  onClick={() => openUpdateModal(idx)}
                >
                  {index.fields
                    .map((field) => {
                      return table.fields.find((f) => f.id === field)
                        ?.field_name;
                    })
                    .join(", ")}
                </Button>
              ))}
              <Button
                className="bg-slate-950 text-white rounded-md"
                onClick={onIndexOpen}
              >
                Create Index
              </Button>
            </div>
          </div>
        );
      case "users":
        return (
          <div className="flex flex-col gap-4">
            <Input
              value={table.table_name}
              onValueChange={(value) =>
                setTable({ ...table, table_name: value })
              }
              variant="bordered"
              classNames={{
                inputWrapper: "rounded-md",
                label: "text-md font-semibold",
              }}
              size="md"
              placeholder='eg. "users"'
              fullWidth
              labelPlacement="inside"
              label="Table name"
              type="text"
            />
            <Divider />
            <div className="flex flex-col gap-1">
              <p className="font-semibold">Fields</p>
              <p className="text-sm">
                Automatically created fields:{" "}
                <Code className="px-2 py-0 text-xs rounded-md">id</Code>,{" "}
                <Code className="px-2 py-0 text-xs rounded-md">email</Code>,{" "}
                <Code className="px-2 py-0 text-xs rounded-md">password</Code>,{" "}
                <Code className="px-2 py-0 text-xs rounded-md">salt</Code>,{" "}
                <Code className="px-2 py-0 text-xs rounded-md">created_at</Code>
                ,{" "}
                <Code className="px-2 py-0 text-xs rounded-md">updated_at</Code>
              </p>
            </div>

            <Divider />
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
                        className="hover:bg-slate-200 bg-transparent rounded-tl-md"
                      >
                        {dtype.label}
                      </Button>
                    ) : (
                      <Button
                        startContent={dtype.icon}
                        onClick={() => addNewField(dtype.value)}
                        className="hover:bg-slate-200 bg-transparent rounded-tl-md"
                      >
                        {dtype.label}
                      </Button>
                    )
                  )}
                </div>
              </AccordionItem>
            </Accordion>
            <div className="flex flex-col gap-4">
              {table.fields.map((field, index) => renderField(field, index))}
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <Modal
        radius="sm"
        scrollBehavior="inside"
        size="2xl"
        isOpen={isOpen}
        onClose={handleClose}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="font-normal">New Table</ModalHeader>
              <ModalBody className="mb-3">
                <div className="">
                  <Select
                    variant="bordered"
                    isRequired
                    classNames={{
                      trigger: "rounded-md",
                      popoverContent: " rounded-t-none rounded-b-md",
                    }}
                    label={<b>Table Type</b>}
                    defaultSelectedKeys={["general"]}
                    onChange={(e) =>
                      setTable({ ...table, table_type: e.target.value })
                    }
                  >
                    <SelectItem
                      startContent={<FaTable />}
                      key={"general"}
                      value={"general"}
                    >
                      General
                    </SelectItem>
                    <SelectItem
                      startContent={<FaRegUser />}
                      key={"users"}
                      value={"users"}
                    >
                      Users
                    </SelectItem>
                  </Select>
                </div>
                {renderTableInput()}
              </ModalBody>
              <Divider />
              <ModalFooter>
                <Button
                  radius="sm"
                  onClick={onClose}
                  className="bg-transparent hover:bg-slate-100"
                >
                  Cancel
                </Button>
                <Button
                  className="w-[125px] bg-slate-950 text-white font-semibold"
                  radius="sm"
                  onClick={createTable}
                >
                  Create
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      <CreateIndexModal
        isOpen={isIndexOpen}
        onClose={onIndexClose}
        fields={table.fields}
        onAdd={(index) => {
          setTable({ ...table, indexes: [...table.indexes, index] });
        }}
      />
      <UpdateIndexModal
        isOpen={isUpIndexOpen}
        onClose={onUpIndexClose}
        fields={table.fields}
        idx={selectedIdx}
        index={table.indexes[selectedIdx]}
        onUpdate={(idx: number, index: Index) => {
          setTable({
            ...table,
            indexes: [
              ...table.indexes.slice(0, idx),
              index,
              ...table.indexes.slice(idx + 1),
            ],
          });
        }}
      />
    </>
  );
};

export default CreateTableModal;

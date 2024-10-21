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
  useDisclosure,
} from "@nextui-org/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
import NewFieldButton from "../../components/Fields/NewFieldButton";

interface CreateTableModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface Field {
  id: string;
  type: string;
  name: string;
  nullable: boolean;
  unique: boolean;
  reference?: string;
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

export const renderField = (
  field: Field,
  index: number,
  onChange: (field: Field) => void,
  onDelete: (idx: number) => void,
  isDisabled?: boolean
) => {
  if (!field) return null;
  if (
    field.name === "id" ||
    field.name === "created_at" ||
    field.name === "updated_at"
  )
    return null;
  switch (field.type.toLowerCase()) {
    case "text":
    case "string":
      return (
        <GeneralField
          key={index}
          onDelete={onDelete}
          onChange={onChange}
          field={field}
          idx={index}
          icon={<RiText />}
          isDisabled={isDisabled}
        />
      );
    case "number":
    case "integer":
    case "real":
      return (
        <GeneralField
          key={index}
          onDelete={onDelete}
          onChange={onChange}
          field={field}
          idx={index}
          icon={<HiOutlineHashtag />}
          isDisabled={isDisabled}
        />
      );
    case "datetime":
    case "timestamp":
      return (
        <GeneralField
          key={index}
          onDelete={onDelete}
          onChange={onChange}
          field={field}
          idx={index}
          icon={<FaRegCalendar />}
          isDisabled={isDisabled}
        />
      );
    case "boolean":
      return (
        <GeneralField
          key={index}
          onDelete={onDelete}
          onChange={onChange}
          field={field}
          idx={index}
          icon={<RxComponentBoolean />}
          isDisabled={isDisabled}
        />
      );
    case "relation":
      return (
        <RelationField
          key={index}
          onDelete={onDelete}
          onChange={onChange}
          field={field}
          idx={index}
          icon={<TbCirclesRelation />}
        />
      );
    case "file":
      return (
        <GeneralField
          key={index}
          onDelete={onDelete}
          onChange={onChange}
          field={field}
          idx={index}
          icon={<FaRegFile />}
          isDisabled={isDisabled}
        />
      );
    default:
  }
};

const CreateTableModal = ({ isOpen, onClose }: CreateTableModalProps) => {
  const [table, setTable] = useState<CreateTable>({
    table_name: "",
    table_type: "general",
    fields: [
      {
        id: "created_at",
        type: "timestamp",
        name: "created_at",
        nullable: false,
        unique: false,
      },
      {
        id: "updated_at",
        type: "timestamp",
        name: "updated_at",
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
          type: type,
          name: "",
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
          type: "temp",
          name: "created_at",
          nullable: false,
          unique: false,
        },
        {
          id: "updated_at",
          type: "temp",
          name: "updated_at",
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
          if (field.type === "relation" && !field.reference) return;
          if (field.name === "") return;
          if (["id", "created_at", "updated_at"].includes(field.name)) return;

          return {
            name: field.name,
            type: field.type,
            nullable: field.nullable,
            reference: field.reference,
            unique: field.unique,
          };
        }),
        indexes: table.indexes.map((index) => {
          if (index.name === "")
            return toast.error("Index name cannot be empty");
          let indexesField = [];
          for (const field of index.indexes) {
            if (field === "created_at" || field === "updated_at") {
              indexesField.push(field);
            } else {
              indexesField.push(table.fields.find((f) => f.id === field)?.name);
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
                      <span>Automatically created fields: </span>
                      {table.table_type === "general" ? (
                        <>
                          <Code className="px-2 py-0 text-xs rounded-md">
                            id
                          </Code>
                          ,{" "}
                          <Code className="px-2 py-0 text-xs rounded-md">
                            created_at
                          </Code>
                          ,{" "}
                          <Code className="px-2 py-0 text-xs rounded-md">
                            updated_at
                          </Code>
                        </>
                      ) : (
                        <>
                          <Code className="px-2 py-0 text-xs rounded-md">
                            id
                          </Code>
                          ,{" "}
                          <Code className="px-2 py-0 text-xs rounded-md">
                            email
                          </Code>
                          ,{" "}
                          <Code className="px-2 py-0 text-xs rounded-md">
                            password
                          </Code>
                          ,{" "}
                          <Code className="px-2 py-0 text-xs rounded-md">
                            salt
                          </Code>
                          ,{" "}
                          <Code className="px-2 py-0 text-xs rounded-md">
                            created_at
                          </Code>
                          ,{" "}
                          <Code className="px-2 py-0 text-xs rounded-md">
                            updated_at
                          </Code>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col gap-4">
                    {table.fields.map((field, index) =>
                      renderField(
                        field,
                        index,
                        (field) => {
                          setTable({
                            ...table,
                            fields: [
                              ...table.fields.slice(0, index),
                              field,
                              ...table.fields.slice(index + 1),
                            ],
                          });
                        },
                        () => deleteField(index)
                      )
                    )}
                  </div>
                  <NewFieldButton
                    onAdd={addNewField}
                    isDisabled={!tables || tables.length === 0}
                    isLoading={isLoading}
                  />
                  <Divider />
                  <div className="flex flex-col gap-1">
                    <p className="font-semibold">Indexes</p>
                    <p className="text-sm text-blue-700">
                      Index significantly improves read performance, but
                      increases storage overhead and reduce the efficiency of
                      write operations. It's recommended to only use index on
                      fields that are frequently used to filter data.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {table.indexes.map((index, idx) => (
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
                                return table.fields.find((c: any) => c.id === i)
                                  ?.name;
                              })
                              .join(", ")}
                          </p>
                        </div>
                      </Button>
                    ))}
                    <Button
                      className="bg-slate-950 text-white rounded-md h-[45px]"
                      onClick={onIndexOpen}
                    >
                      Create Index
                    </Button>
                  </div>
                </div>
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
        onDelete={(idx: number) => {
          setTable({
            ...table,
            indexes: [
              ...table.indexes.slice(0, idx),
              ...table.indexes.slice(idx + 1),
            ],
          });
        }}
      />
    </>
  );
};

export default CreateTableModal;

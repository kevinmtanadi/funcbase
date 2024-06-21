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
  Selection,
  Accordion,
  AccordionItem,
} from "@nextui-org/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { datatypes } from "../../data/datatypes";
import { toast } from "react-toastify";
import GeneralField from "../../components/Fields/GeneralField";
import { RiText } from "react-icons/ri";
import { HiOutlineHashtag } from "react-icons/hi";
import { RxComponentBoolean } from "react-icons/rx";
import { FaRegCalendar, FaRegUser, FaTable } from "react-icons/fa6";
import RelationField from "../../components/Fields/RelationField";
import { TbCirclesRelation } from "react-icons/tb";
import axiosInstance from "../../pkg/axiosInstance";

interface CreateTableModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface Field {
  field_type: string;
  field_name: string;
  nullable: boolean;
  indexed: boolean;
  unique: boolean;
  related_table?: string;
}

export interface Relation {
  related_table: string;
  type: "single" | "multiple";
}

const CreateTableModal = ({ isOpen, onClose }: CreateTableModalProps) => {
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

  const [tableType, setTableType] = useState("");
  const [tableName, setTableName] = useState("");
  const [idType, setIdType] = useState<Selection>(new Set(["string"]));

  // override the close to empty the fields
  const handleClose = () => {
    setFields([]);
    setTableName("");
    setTableType("");
    onClose();
  };

  const queryClient = useQueryClient();

  const { mutateAsync } = useMutation({
    mutationFn: () => {
      return axiosInstance.post("/api/table/create", {
        table_name: tableName,
        id_type: (idType as any).currentKey || "string",
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
        table_type: tableType,
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

      default:
    }
  };

  const { data: tables, isLoading } = useQuery<{ name: string }[]>({
    queryKey: ["tables"],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/tables`);
      return res.data;
    },
  });

  const renderTableInput = () => {
    switch (tableType) {
      case "general":
        return (
          <div className="flex flex-col gap-4">
            <Input
              value={tableName}
              onValueChange={setTableName}
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
                <Code className="px-2 py-0 text-xs rounded-md">created_at</Code>
                ,{" "}
                <Code className="px-2 py-0 text-xs rounded-md">updated_at</Code>
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <Select
                  defaultSelectedKeys={"string"}
                  selectionMode="single"
                  variant="bordered"
                  isRequired
                  selectedKeys={idType}
                  onSelectionChange={setIdType}
                  label={<b>ID Type</b>}
                  classNames={{
                    trigger: "rounded-md",
                    popoverContent: "rounded-t-none rounded-b-md",
                  }}
                >
                  <SelectItem
                    variant="bordered"
                    textValue="Automated (String)"
                    className="rounded-sm"
                    key="string"
                  >
                    <div className="flex">
                      <p className="font-bold">Automated</p>
                      <p className="ml-1">(String)</p>
                    </div>
                    <p className="text-sm text-default-500">
                      System will automatically generate a 16 characters random
                      ID for every record
                    </p>
                  </SelectItem>
                  <SelectItem
                    textValue="Manual Input"
                    className="rounded-sm"
                    key="manual"
                  >
                    <b>Manual Input</b>
                    <p className="text-sm text-default-500">
                      ID will have to be manually inputted
                    </p>
                  </SelectItem>
                </Select>
              </div>
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
              {fields.map((field, index) => renderField(field, index))}
            </div>
          </div>
        );
      case "users":
        return (
          <div className="flex flex-col gap-4">
            <Input
              value={tableName}
              onValueChange={setTableName}
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
                <Code className="px-2 py-0 text-xs rounded-md">email</Code>,{" "}
                <Code className="px-2 py-0 text-xs rounded-md">password</Code>,{" "}
                <Code className="px-2 py-0 text-xs rounded-md">salt</Code>,{" "}
                <Code className="px-2 py-0 text-xs rounded-md">created_at</Code>
                ,{" "}
                <Code className="px-2 py-0 text-xs rounded-md">updated_at</Code>
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <Select
                  defaultSelectedKeys={"string"}
                  selectionMode="single"
                  variant="bordered"
                  isRequired
                  selectedKeys={idType}
                  onSelectionChange={setIdType}
                  label={<b>ID Type</b>}
                  classNames={{
                    trigger: "rounded-md",
                    popoverContent: "rounded-t-none rounded-b-md",
                  }}
                >
                  <SelectItem
                    variant="bordered"
                    textValue="Automated (String)"
                    className="rounded-sm"
                    key="string"
                  >
                    <div className="flex">
                      <p className="font-bold">Automated</p>
                      <p className="ml-1">(String)</p>
                    </div>
                    <p className="text-sm text-default-500">
                      System will automatically generate a 16 characters random
                      ID for every record
                    </p>
                  </SelectItem>
                  <SelectItem
                    textValue="Manual Input"
                    className="rounded-sm"
                    key="manual"
                  >
                    <b>Manual Input</b>
                    <p className="text-sm text-default-500">
                      ID will have to be manually inputted
                    </p>
                  </SelectItem>
                </Select>
              </div>
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
              {fields.map((field, index) => renderField(field, index))}
            </div>
          </div>
        );
    }
  };

  return (
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
                  onChange={(e) => setTableType(e.target.value)}
                  label={<b>Table Type</b>}
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
              {tableType && renderTableInput()}
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
  );
};

export default CreateTableModal;

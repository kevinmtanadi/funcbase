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
} from "@nextui-org/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { FaPlus } from "react-icons/fa";
import { datatypes } from "../../data/datatypes";
import { toast } from "react-toastify";

interface CreateTableModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateTableModal = ({ isOpen, onClose }: CreateTableModalProps) => {
  interface Fields {
    field_type: Selection;
    field_name: string;
  }

  const [fields, setFields] = useState<Fields[]>([]);
  const addNewField = () => {
    setFields([
      ...fields,
      {
        field_type: new Set([]),
        field_name: "",
      },
    ]);
  };

  const [tableName, setTableName] = useState("");
  const [idType, setIdType] = useState<Selection>(new Set([]));

  // override the close to empty the fields
  const handleClose = () => {
    setFields([]);
    setTableName("");
    onClose();
  };

  const queryClient = useQueryClient();

  const { mutateAsync } = useMutation({
    mutationFn: () => {
      return axios.post("/api/db/table/create", {
        table_name: tableName,
        id_type: (idType as any).currentKey,
        fields: fields.map((field) => {
          return {
            field_name: field.field_name,
            field_type: (field.field_type as any).currentKey,
          };
        }),
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

  return (
    <Modal size="2xl" isOpen={isOpen} onClose={handleClose}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="font-normal">New Table</ModalHeader>
            <ModalBody className="mb-3">
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
                    <Code className="px-2 py-0 text-xs rounded-md">
                      created_at
                    </Code>
                    ,{" "}
                    <Code className="px-2 py-0 text-xs rounded-md">
                      updated_at
                    </Code>
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <Select
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
                        textValue="Automated (Serial)"
                        className="rounded-sm"
                        key="serial"
                      >
                        <div className="flex">
                          <p className="font-bold">Automated</p>
                          <p className="ml-1">(Serial)</p>
                        </div>
                        <p className="text-sm text-default-500">
                          System will automatically generate an ID for every
                          record sequentially starting from 0
                        </p>
                      </SelectItem>
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
                          System will automatically generate a 16 characters
                          random ID for every record
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
                <div className="flex flex-col gap-4">
                  {fields.map((field, index) => (
                    <div key={index} className="flex gap-4">
                      <Select
                        selectedKeys={field.field_type}
                        onSelectionChange={(e) => {
                          setFields([
                            ...fields.slice(0, index),
                            {
                              ...field,
                              field_type: e,
                            },
                            ...fields.slice(index + 1),
                          ]);
                        }}
                        startContent={
                          (field.field_type as any)?.currentKey &&
                          datatypes.find(
                            (f) =>
                              f.value === (field.field_type as any).currentKey
                          )?.icon
                        }
                        variant="bordered"
                        classNames={{
                          trigger: "rounded-md",
                          label: "font-semibold",
                        }}
                        size="sm"
                        radius="sm"
                        label="Field type"
                      >
                        {datatypes.map((datatype) => (
                          <SelectItem
                            startContent={datatype.icon}
                            key={datatype.value}
                            value={datatype.value}
                          >
                            {datatype.label}
                          </SelectItem>
                        ))}
                      </Select>
                      <Input
                        value={field.field_name}
                        onValueChange={(value) => {
                          setFields([
                            ...fields.slice(0, index),
                            {
                              ...field,
                              field_name: value,
                            },
                            ...fields.slice(index + 1),
                          ]);
                        }}
                        variant="bordered"
                        classNames={{
                          inputWrapper: "rounded-md",
                          label: "font-semibold",
                        }}
                        size="sm"
                        label="Field name"
                        labelPlacement="inside"
                        type="text"
                      />
                    </div>
                  ))}
                </div>
                <Button
                  className="font-semibold border-black rounded-md"
                  startContent={<FaPlus />}
                  variant="bordered"
                  onClick={addNewField}
                >
                  New field
                </Button>
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
  );
};

export default CreateTableModal;

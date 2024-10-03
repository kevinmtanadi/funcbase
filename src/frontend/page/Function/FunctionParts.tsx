import {
  Checkbox,
  Select,
  SelectItem,
  Input,
  CheckboxGroup,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@nextui-org/react";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import axiosInstance from "../../pkg/axiosInstance";
import { FunctionPart } from "./CreateFunction";

interface FunctionInsertProps {
  tableName: string;
  functionParts: FunctionPart[];
  setFunctionParts: React.Dispatch<React.SetStateAction<FunctionPart[]>>;
  idx: number;
}
export const FunctionInsert = ({
  tableName,
  functionParts,
  idx,
  setFunctionParts,
}: FunctionInsertProps) => {
  const { data: columns } = useQuery<any[]>({
    queryKey: ["columns", tableName, "crud"],
    queryFn: async () => {
      if (!tableName || tableName === "") return [];
      const res = await axiosInstance.get(`/api/main/${tableName}/columns`);

      const columns = res.data as any[];

      return columns.filter(
        (col) =>
          col.name !== "id" &&
          col.name !== "created_at" &&
          col.name !== "updated_at"
      );
    },
  });

  const [selections, setSelections] = useState<any[]>([
    {
      label: "API Call Input",
      description:
        "Choose this to input the data when calling on this endpoint",
      value: "",
      key: "",
    },
    {
      label: "User ID",
      description: "Automatically fetch user ID through JWT token",
      value: "$user.id",
      key: "$user.id",
    },
  ]);

  useEffect(() => {
    setSelections([
      {
        label: "API Call Input",
        description:
          "Choose this to input the data when calling on this endpoint",
        value: "",
        key: "",
      },
      {
        label: "User ID",
        description: "Automatically fetch user ID through JWT token",
        value: "$user.id",
        key: "$user.id",
      },
      ...functionParts
        .filter(
          (part) =>
            part.action === "insert" &&
            part.multiple === false &&
            part.name !== "" &&
            part.name !== functionParts[idx].name &&
            functionParts[idx].idx > part.idx
        )
        .map((part) => ({
          label: part.name,
          description: "The ID of the inserted " + part.table,
          value: "$" + part.name,
          key: "$" + part.name,
        })),
    ]);
  }, [functionParts]);

  useEffect(() => {
    if (columns !== undefined && columns.length > 0) {
      setFunctionParts((prevParts) => [
        ...prevParts.slice(0, idx),
        {
          ...prevParts[idx],
          values: columns.reduce((acc, col) => {
            acc[col.name] = col.type === "REAL" ? "number" : "string";
            return acc;
          }, {}),
        },
        ...prevParts.slice(idx + 1),
      ]);
    }
  }, [columns]);

  if (!columns || columns.length === 0) return <></>;

  return (
    <div className="flex flex-col gap-2">
      <Checkbox
        className="mr-2"
        color="default"
        onValueChange={(e) => {
          setFunctionParts((prev) => {
            prev[idx].multiple = e;
            return [...prev];
          });
        }}
        isSelected={functionParts[idx].multiple}
      >
        Multiple
      </Checkbox>
      <p className="text-default-500 text-xs">Allow multiple data insertion</p>
      {columns?.map((column) =>
        column.type !== "BLOB" ? (
          <Select
            key={column.name}
            items={selections}
            size="sm"
            defaultSelectedKeys={[""]}
            label={column.name}
            variant="bordered"
            onChange={(e) => {
              if (e.target.value !== "") {
                console.log(functionParts);
                setFunctionParts([
                  ...functionParts.slice(0, idx),
                  {
                    ...functionParts[idx],
                    values: {
                      ...functionParts[idx].values,
                      [column.name]: e.target.value,
                    },
                  },
                  ...functionParts.slice(idx + 1),
                ]);
              }
            }}
          >
            {(item) => (
              <SelectItem
                description={item.description}
                value={item.value}
                key={item.key}
              >
                {item.label}
              </SelectItem>
            )}
          </Select>
        ) : (
          <Input
            key={column.name}
            isDisabled
            fullWidth
            variant="bordered"
            label={column.name}
            placeholder="File uploading isn't supported with function"
            value={""}
          />
        )
      )}
    </div>
  );
};

interface FunctionUpdateProps {
  tableName: string;
  functionParts: FunctionPart[];
  setFunctionParts: React.Dispatch<React.SetStateAction<FunctionPart[]>>;
  idx: number;
}
export const FunctionUpdate = ({
  tableName,
  functionParts,
  idx,
  setFunctionParts,
}: FunctionUpdateProps) => {
  const { data: columns } = useQuery<any[]>({
    queryKey: ["columns", tableName, "crud"],
    queryFn: async () => {
      if (!tableName || tableName === "") return [];
      const res = await axiosInstance.get(`/api/main/${tableName}/columns`);

      const columns = res.data as any[];

      return columns.filter(
        (col) => col.name !== "created_at" && col.name !== "updated_at"
      );
    },
  });

  const [selections, setSelections] = useState<any[]>([
    {
      label: "API Call Input",
      description:
        "Choose this to input the data when calling on this endpoint",
      value: "",
      key: "",
    },
    {
      label: "User ID",
      description: "Automatically fetch user ID through JWT token",
      value: "$user.id",
      key: "$user.id",
    },
  ]);

  useEffect(() => {
    setSelections([
      {
        label: "API Call Input",
        description:
          "Choose this to input the data when calling on this endpoint",
        value: "",
        key: "",
      },
      {
        label: "User ID",
        description: "Automatically fetch user ID through JWT token",
        value: "$user.id",
        key: "$user.id",
      },
      ...functionParts
        .filter(
          (part) =>
            part.action === "insert" &&
            part.multiple === false &&
            part.name !== "" &&
            part.name !== functionParts[idx].name &&
            functionParts[idx].idx > part.idx
        )
        .map((part) => ({
          label: part.name,
          description: "The ID of the inserted " + part.table,
          value: "$" + part.name,
          key: "$" + part.name,
        })),
    ]);
  }, [functionParts]);

  useEffect(() => {
    if (columns !== undefined && columns.length > 0) {
      setFunctionParts((prevParts) => [
        ...prevParts.slice(0, idx),
        {
          ...prevParts[idx],
          values: columns.reduce((acc, col) => {
            acc[col.name] = col.type === "REAL" ? "number" : "string";
            return acc;
          }, {}),
        },
        ...prevParts.slice(idx + 1),
      ]);
    }
  }, [columns]);

  if (!columns || columns.length === 0) return <></>;

  return (
    <div className="flex flex-col gap-2">
      <Checkbox
        className="mr-2"
        color="default"
        onValueChange={(e) => {
          setFunctionParts((prev) => {
            prev[idx].multiple = e;
            return [...prev];
          });
        }}
        isSelected={functionParts[idx].multiple}
      >
        Multiple
      </Checkbox>
      <p className="text-default-500 text-xs">Allow multiple data insertion</p>
      {columns?.map((column) => (
        <Select
          key={column.name}
          items={selections}
          size="sm"
          defaultSelectedKeys={[""]}
          label={column.name}
          variant="bordered"
          onChange={(e) => {
            if (e.target.value !== "") {
              setFunctionParts([
                ...functionParts.slice(0, idx),
                {
                  ...functionParts[idx],
                  values: {
                    ...functionParts[idx].values,
                    [column.name]: e.target.value,
                  },
                },
                ...functionParts.slice(idx + 1),
              ]);
            }
          }}
        >
          {(item) => (
            <SelectItem
              description={item.description}
              value={item.value}
              key={item.key}
            >
              {item.label}
            </SelectItem>
          )}
        </Select>
      ))}
    </div>
  );
};

interface FunctionSelectProps {
  tableName: string;
  functionParts: FunctionPart[];
  setFunctionParts: React.Dispatch<React.SetStateAction<FunctionPart[]>>;
  idx: number;
}
export const FunctionSelect = ({
  tableName,
  functionParts,
  idx,
  setFunctionParts,
}: FunctionSelectProps) => {
  const { data: columns } = useQuery<any[]>({
    queryKey: ["columns", tableName],
    queryFn: async () => {
      if (!tableName || tableName === "") return [];
      const res = await axiosInstance.get(`/api/main/${tableName}/columns`);
      return res.data;
    },
  });

  return (
    <div className="flex flex-col">
      <p className="font-semibold mb-3">Select columns to retrieve</p>
      <CheckboxGroup
        value={functionParts[idx].columns}
        onValueChange={(values) => {
          const newParts = [...functionParts];
          newParts[idx] = {
            ...newParts[idx],
            columns: values,
          };
          setFunctionParts(newParts);
        }}
      >
        {columns?.map((col) => (
          <Checkbox key={col.name} value={col.name}>
            {col.name}
          </Checkbox>
        ))}
      </CheckboxGroup>
    </div>
  );
};

interface FunctionDeleteProps {
  tableName: string;
  functionParts: FunctionPart[];
  setFunctionParts: React.Dispatch<React.SetStateAction<FunctionPart[]>>;
  idx: number;
}
export const FunctionDelete = ({ functionParts, idx }: FunctionDeleteProps) => {
  if (!functionParts[idx].action || !functionParts[idx].table) return <></>;

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-2 mt-3"></div>
    </div>
  );
};

interface DeleteFunctionModalProps {
  isOpen: boolean;
  onClose: () => void;
  idx: number;
  onDelete: () => void;
}

export const DeleteFunctionModal = ({
  isOpen,
  onClose,
  onDelete,
}: DeleteFunctionModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>Delete Function Part</ModalHeader>
        <ModalBody>
          <p>Are you sure you want to delete this function part?</p>
        </ModalBody>
        <ModalFooter>
          <Button
            className="rounded-md bg-red-500 text-white"
            onPress={() => {
              onDelete();
              onClose();
            }}
          >
            Delete
          </Button>
          <Button
            className="rounded-md "
            onPress={() => {
              onClose();
            }}
          >
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

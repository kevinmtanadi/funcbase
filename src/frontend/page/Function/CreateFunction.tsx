import {
  Accordion,
  AccordionItem,
  Button,
  Checkbox,
  CheckboxGroup,
  Input,
  Select,
  SelectItem,
} from "@nextui-org/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { FaPlus } from "react-icons/fa6";
import axiosInstance from "../../pkg/axiosInstance";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

interface Filter {
  column: string;
  operator: string;
  value: string;
}

interface FunctionPart {
  name: string;
  table: string;
  action: string;
  multiple?: boolean;
  columns?: string[];
  filter?: Filter[];
  values?: any;
  idx: number;
}

const CreateFunction = () => {
  const [functionParts, setFunctionParts] = useState<FunctionPart[]>([
    {
      name: "",
      table: "",
      action: "",
      multiple: false,
      idx: 0,
    },
  ]);

  const addFunctionPart = () => {
    setFunctionParts((prev) => [
      ...prev,
      { name: "", table: "", action: "", multiple: false, idx: prev.length },
    ]);
  };

  const { data: tables } = useQuery<any[]>({
    queryKey: ["tables"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/main/tables");
      return res.data;
    },
    initialData: [],
  });

  const [funcName, setFuncName] = useState("");

  const navigate = useNavigate();
  const { mutateAsync } = useMutation({
    mutationFn: async (data: any) => {
      const res = await axiosInstance.post("/api/function/create", {
        name: funcName,
        functions: data,
      });
      return res.data;
    },
    onSuccess: () => {
      navigate("/function");
    },
  });

  const createFunction = () => {
    if (funcName === "") {
      toast.error("Please enter a function name");
      return;
    }

    if (functionParts.length === 0) {
      toast.error("Please add at least one function part");
      return;
    }

    toast.promise(mutateAsync(functionParts), {
      pending: "Creating function...",
      success: "Function created successfully",
      error: "Error creating function",
    });
  };

  return (
    <div className="flex flex-col w-full max-h-screen h-screen overflow-y-scroll">
      <div className="w-full min-h-[45px] h-[45px] flex border-b-1">
        <h1 className="text-xl font-bold my-auto ml-5">Functions</h1>
      </div>
      <div className="mx-5 mt-5 flex flex-col grow">
        <p className="text-lg mb-5 font-semibold">Create New Function</p>
        <Input
          value={funcName}
          onChange={(e) => setFuncName(e.target.value)}
          description={
            <>
              <p>
                This will be the endpoint to be called to run this function. It
                is recommended to use snake case for function name. Don't use
                space as it won't work
              </p>
              <p>e.g.: create_transaction</p>
            </>
          }
          size="sm"
          variant="bordered"
          label={"function_name"}
          isRequired
          fullWidth
        />
        <Button
          onClick={addFunctionPart}
          startContent={<FaPlus />}
          className="rounded-md  mt-4 bg-slate-950 text-white font-semibold"
        >
          New Function Part
        </Button>
        <div className="flex flex-col mt-5">
          {functionParts?.length > 0 && (
            <Accordion defaultExpandedKeys={["0"]} variant="splitted">
              {functionParts.map((part, idx) => (
                <AccordionItem
                  subtitle={part.action + " " + part.table}
                  title={part.name || `Function ${idx + 1}`}
                  key={idx}
                >
                  <div className="flex flex-col gap-3 pb-3" key={idx}>
                    <Input
                      isRequired
                      size="sm"
                      variant="bordered"
                      label="function_part_name"
                      onChange={(e) => {
                        const newParts = [...functionParts];
                        newParts[idx] = {
                          ...newParts[idx],
                          name: e.target.value,
                        };
                        setFunctionParts(newParts);
                      }}
                      value={part.name}
                    />
                    <div className="flex gap-3">
                      <Select
                        size="sm"
                        onChange={(e) => {
                          switch (e.target.value) {
                            case "update":
                              setFunctionParts((prev) => {
                                prev[idx].action = e.target.value;
                                prev[idx].columns = undefined;
                                prev[idx].filter = undefined;
                                return [...prev];
                              });
                              break;
                            case "insert":
                              setFunctionParts((prev) => {
                                prev[idx].action = e.target.value;
                                prev[idx].filter = undefined;
                                prev[idx].columns = undefined;
                                prev[idx].filter = undefined;
                                return [...prev];
                              });
                              break;
                            case "fetch":
                              setFunctionParts((prev) => {
                                prev[idx].action = e.target.value;
                                prev[idx].multiple = undefined;
                                prev[idx].values = undefined;
                                prev[idx].filter = undefined;
                                return [...prev];
                              });
                              break;
                            case "delete":
                              setFunctionParts((prev) => {
                                prev[idx].action = e.target.value;
                                prev[idx].columns = undefined;
                                prev[idx].values = undefined;
                                prev[idx].filter = undefined;
                                return [...prev];
                              });
                              break;
                            default:
                              break;
                          }
                        }}
                        disabledKeys={[""]}
                        label="Action"
                        variant="bordered"
                        value={part.action}
                        selectedKeys={[part.action]}
                      >
                        <SelectItem value={""} key={""}></SelectItem>
                        <SelectItem value={"update"} key={"update"}>
                          Update Data
                        </SelectItem>
                        <SelectItem value={"insert"} key={"insert"}>
                          Insert Data
                        </SelectItem>
                        <SelectItem value={"fetch"} key={"fetch"}>
                          Fetch Data
                        </SelectItem>
                        <SelectItem value={"delete"} key={"delete"}>
                          Delete Data
                        </SelectItem>
                      </Select>
                      <Select
                        selectedKeys={[part.table]}
                        value={part.table}
                        size="sm"
                        variant="bordered"
                        label="Table"
                        items={tables}
                        onChange={(e) => {
                          setFunctionParts((prev) => {
                            prev[idx].table = e.target.value;
                            return [...prev];
                          });
                        }}
                      >
                        {(column) => (
                          <SelectItem key={column.name} value={column.name}>
                            {column.name}
                          </SelectItem>
                        )}
                      </Select>
                    </div>
                    {customPartFunction(
                      part.action,
                      part.table,
                      idx,
                      functionParts,
                      setFunctionParts
                    )}
                  </div>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </div>
      <div className="w-full flex justify-end my-5">
        <Button
          onClick={createFunction}
          className="rounded-md  mr-5 bg-slate-950 text-white font-semibold"
        >
          Create Function
        </Button>
      </div>
    </div>
  );
};

interface FunctionInsertProps {
  tableName: string;
  functionParts: FunctionPart[];
  setFunctionParts: React.Dispatch<React.SetStateAction<FunctionPart[]>>;
  idx: number;
}
const FunctionInsert = ({
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
      <p className="font-semibold mb-3">
        Input for fixed value. Leave the column empty to insert manually through
        API calls
      </p>
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
const FunctionUpdate = ({
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
      <p className="font-semibold mb-3">
        Input for fixed value. Leave the column empty to insert manually through
        API calls
      </p>
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
              // setFunctionParts((prevParts) => [
              //   ...prevParts.slice(0, idx),
              //   {
              //     ...prevParts[idx],
              //     values: {
              //       ...prevParts[idx].values,
              //       [column.name]: e.target.value,
              //     },
              //   },
              //   ...prevParts.slice(idx + 1),
              // ]);
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
const FunctionSelect = ({
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
const FunctionDelete = ({ functionParts, idx }: FunctionDeleteProps) => {
  if (!functionParts[idx].action || !functionParts[idx].table) return <></>;

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-2 mt-3"></div>
    </div>
  );
};

const customPartFunction = (
  action: string,
  tableName: string,
  idx: number,
  functionParts: FunctionPart[],
  setFunctionParts: React.Dispatch<React.SetStateAction<FunctionPart[]>>
) => {
  switch (action) {
    case "update":
      return (
        <FunctionUpdate
          key={idx}
          tableName={tableName}
          functionParts={functionParts}
          idx={idx}
          setFunctionParts={setFunctionParts}
        />
      );
    case "insert":
      return (
        <FunctionInsert
          key={idx}
          tableName={tableName}
          idx={idx}
          functionParts={functionParts}
          setFunctionParts={setFunctionParts}
        />
      );
    case "fetch":
      return (
        <FunctionSelect
          key={idx}
          tableName={tableName}
          idx={idx}
          functionParts={functionParts}
          setFunctionParts={setFunctionParts}
        />
      );
    case "delete":
      return (
        <FunctionDelete
          key={idx}
          tableName={tableName}
          idx={idx}
          functionParts={functionParts}
          setFunctionParts={setFunctionParts}
        />
      );
      break;
  }
};

export default CreateFunction;

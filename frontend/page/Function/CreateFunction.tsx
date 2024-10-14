import {
  Accordion,
  AccordionItem,
  Button,
  Input,
  Select,
  SelectItem,
  useDisclosure,
} from "@nextui-org/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import { FaPlus } from "react-icons/fa6";
import axiosInstance from "../../pkg/axiosInstance";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  DeleteFunctionModal,
  FunctionDelete,
  FunctionInsert,
  FunctionSelect,
  FunctionUpdate,
} from "./FunctionParts";

interface Filter {
  column: string;
  operator: string;
  value: string;
}

export interface FunctionPart {
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

  const [selectedPart, setSelectedPart] = useState(0);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const deleteFunctionPart = (idx: number) => {
    setFunctionParts((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="flex flex-col items-center w-full overflow-y-scroll max-h-screen">
      <div className="w-full min-h-[45px] h-[45px] flex border-b-1">
        <h1 className="text-xl font-semibold my-auto ml-5">Functions</h1>
      </div>
      <div className="flex flex-col w-full max-w-2xl">
        <div className="mx-5 mt-5 flex flex-col grow">
          <p className="text-lg mb-5 font-semibold">Create New Function</p>
          <Input
            value={funcName}
            onChange={(e) => setFuncName(e.target.value)}
            description={
              <>
                <p>
                  This will be the endpoint to be called to run this function.
                  It is recommended to use snake case for function name. Don't
                  use space as it won't work
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
              <Accordion
                defaultExpandedKeys={["0"]}
                variant="splitted"
                selectionMode="multiple"
              >
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
                      <Button
                        isDisabled={functionParts.length === 1}
                        className="self-end bg-red-500 text-white rounded-md"
                        onClick={() => {
                          onOpen();
                          setSelectedPart(idx);
                        }}
                      >
                        Delete
                      </Button>
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
      <DeleteFunctionModal
        isOpen={isOpen}
        onClose={onClose}
        idx={selectedPart}
        onDelete={() => deleteFunctionPart(selectedPart)}
      />
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

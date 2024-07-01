import {
  Accordion,
  AccordionItem,
  BreadcrumbItem,
  Breadcrumbs,
  Button,
  Checkbox,
  CheckboxGroup,
  Chip,
  table,
  useDisclosure,
} from "@nextui-org/react";
import { useQuery } from "@tanstack/react-query";
import { LuSettings } from "react-icons/lu";
import axiosInstance from "../../pkg/axiosInstance";
import FunctionSettingModal from "./FunctionSettingModal";

interface Props {
  funcName: string;
}
const FunctionDetail = ({ funcName }: Props) => {
  const { data: func } = useQuery<{ name: string; functions: any[] }>({
    queryKey: ["function_detail", funcName || ""],
    queryFn: async () => {
      if (funcName === "") return [];

      const res = await axiosInstance.get(`/api/function/${funcName}`);
      return res.data;
    },
  });

  const {
    isOpen: isSettingOpen,
    onOpen: onSettingOpen,
    onClose: onSettingClose,
  } = useDisclosure();

  if (!func) {
    return <></>;
  }

  return (
    <div className="flex flex-col ">
      <div className="my-3 pb-4 border-b-1 px-3 md:flex block items-center justify-between">
        <div className="flex gap-2 items-center justify-between md:justify-normal">
          <Breadcrumbs
            size="lg"
            isDisabled
            separator="/"
            className="text-xl font-semibold"
          >
            <BreadcrumbItem>Function</BreadcrumbItem>
            <BreadcrumbItem>
              <p>{func.name}</p>
            </BreadcrumbItem>
          </Breadcrumbs>
          <div className="flex gap-2 items-center">
            <Button
              onClick={onSettingOpen}
              radius="sm"
              className="h-7 p-0 w-7 hover:bg-slate-200 bg-transparent min-w-0"
            >
              <LuSettings fontSize={"1.25rem"} className="cursor-pointer" />
            </Button>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <Accordion defaultExpandedKeys={["0"]} variant="splitted">
          {func?.functions?.map((part, idx) => (
            <AccordionItem
              subtitle={part.action + " " + part.table}
              title={part.name || `Function ${idx + 1}`}
              key={idx}
            >
              {customPartFunction(part, idx)}
            </AccordionItem>
          ))}
        </Accordion>
      </div>
      <FunctionSettingModal
        functionName={func.name}
        isOpen={isSettingOpen}
        onClose={onSettingClose}
      />
    </div>
  );
};

interface FunctionSelectProps {
  func: any;
}
const FunctionSelect = ({ func }: FunctionSelectProps) => {
  const { data: columns } = useQuery<any[]>({
    queryKey: ["columns", func.table],
    queryFn: async () => {
      if (table === undefined || func.table === "") {
        return [];
      }

      const res = await axiosInstance.get(`/api/main/${func.table}/columns`);
      return res.data;
    },
  });

  if (columns === undefined || columns.length === 0) {
    return <></>;
  }

  return (
    <div className="flex flex-col">
      <p>Selected Columns </p>
      <CheckboxGroup className="my-3" isDisabled defaultValue={func.columns}>
        {columns?.map((c: any) => (
          <Checkbox key={c.name} value={c.name}>
            {c.name}
          </Checkbox>
        ))}
      </CheckboxGroup>
    </div>
  );
};

interface FunctionInsertProps {
  func: any;
}
const FunctionInsert = ({ func }: FunctionInsertProps) => {
  return (
    <div className="flex flex-col gap-3 mb-3">
      <Checkbox isDisabled isSelected={func.multiple}>
        Multiple
      </Checkbox>
      <p>Required Columns</p>
      <div className="flex gap-1 items-center">
        {Object.entries(func.values)
          .filter((key) => key[1] !== "$user.id")
          .map((key) => (
            <Chip color="primary" className="px-2" key={key[0]}>
              {key[0]}
            </Chip>
          ))}
      </div>
    </div>
  );
};

interface FunctionUpdateProps {
  func: any;
}
const FunctionUpdate = ({ func }: FunctionUpdateProps) => {
  return (
    <div className="flex flex-col gap-3 mb-3">
      <Checkbox isDisabled isSelected={func.multiple}>
        Multiple
      </Checkbox>
      <p>Required Columns</p>
      <div className="flex gap-1 items-center">
        {Object.keys(func.values).map((key) => (
          <Chip color="primary" className="px-2" key={key}>
            {key}
          </Chip>
        ))}
      </div>
    </div>
  );
};

interface FunctionDeleteProps {
  func: any;
}
const FunctionDelete = ({ func }: FunctionDeleteProps) => {
  return (
    <div className="flex flex-col gap-3 mb-3">
      <Checkbox isDisabled isSelected={func.multiple}>
        Multiple
      </Checkbox>
      <p>Required Columns</p>
      <div className="flex gap-1 items-center">
        {Object.keys(func.values).map((key) => (
          <Chip color="primary" className="px-2" key={key}>
            {key}
          </Chip>
        ))}
      </div>
    </div>
  );
};

const customPartFunction = (func: any, idx: number) => {
  switch (func.action) {
    case "update":
      return <FunctionUpdate key={idx} func={func} />;
    case "insert":
      return <FunctionInsert key={idx} func={func} />;
    case "fetch":
      return <FunctionSelect key={idx} func={func} />;
    case "delete":
      return <FunctionDelete key={idx} func={func} />;
      break;
  }
};

export default FunctionDetail;

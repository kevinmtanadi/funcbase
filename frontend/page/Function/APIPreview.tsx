import Drawer from "react-modern-drawer";
import "react-modern-drawer/dist/index.css";
import { generateDummyResult, syntaxHighlight } from "../Tables/APIPreview";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../../pkg/axiosInstance";

interface APIPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  funcName: string;
}
const FunctionAPIPreview = ({ isOpen, onClose, funcName }: APIPreviewProps) => {
  const { data: func } = useQuery<{ name: string; functions: any[] }>({
    queryKey: ["function_detail", funcName || ""],
    queryFn: async () => {
      if (funcName === "") return [];

      const res = await axiosInstance.get(`/api/function/${funcName}`);
      return res.data;
    },
  });

  interface functionTemplate {
    [key: string]: any;
  }

  const convertResponse = () => {
    if (!func) return;

    const result: functionTemplate = {};
    for (let i = 0; i < func.functions.length; i++) {
      const temp: functionTemplate = {};
      Object.keys(func.functions[i].values).forEach((key) => {
        const dtype = func.functions[i].values[key];
        console.log(dtype);
        temp[key] = generateDummyResult(dtype);
      });
      result[func.functions[i].name] = temp;
    }

    return result;
  };

  if (!func) {
    return <></>;
  }

  return (
    <Drawer size={"900px"} direction="right" open={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-3 pl-5 mb-10">
        <p className="text-lg font-semibold">Function / {funcName}</p>
        <div className="flex flex-col">
          <p className="text-sm">
            {" "}
            Body parameters must be sent as{" "}
            <code className="bg-slate-200 p-1 rounded-md">json</code>.
          </p>
        </div>
        <div className="gap-2 flex flex-col">
          <p>API Details</p>
          <div className="bg-green-100 w-full flex items-center p-1.5 border-1 border-green-400 rounded-md gap-2">
            <div className="bg-green-400 text-white font-semibold w-[100px] h-[30px] flex items-center justify-center rounded-md">
              POST
            </div>
            <p>/api/{funcName}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <p>Body Parameters</p>
          <div className="p-3 bg-slate-200 rounded-md w-full text-sm">
            <pre
              dangerouslySetInnerHTML={{
                __html: syntaxHighlight(
                  JSON.stringify({ data: convertResponse() }, undefined, 4)
                ),
              }}
            ></pre>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <p>Response</p>
          <div className="p-3 bg-slate-200 rounded-md w-full text-sm">
            <pre
              dangerouslySetInnerHTML={{
                __html: syntaxHighlight(
                  JSON.stringify(
                    {
                      message: "success",
                    },
                    undefined,
                    4
                  )
                ),
              }}
            ></pre>
          </div>
          <div className="p-3 bg-slate-200 rounded-md w-full text-sm">
            <pre
              dangerouslySetInnerHTML={{
                __html: syntaxHighlight(
                  JSON.stringify(
                    {
                      error: "error message",
                    },
                    undefined,
                    4
                  )
                ),
              }}
            ></pre>
          </div>
        </div>
      </div>
    </Drawer>
  );
};

export default FunctionAPIPreview;

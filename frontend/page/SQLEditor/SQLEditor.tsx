import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-sql";
import "ace-builds/src-noconflict/theme-sqlserver";
import "ace-builds/src-noconflict/ext-language_tools";
import { Button, Code, ScrollShadow } from "@nextui-org/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import axiosInstance from "../../pkg/axiosInstance";
import QueryResult from "./QueryResult";
import { PiPaperPlaneRightFill } from "react-icons/pi";
import { toast } from "react-toastify";

interface Column {
  cid: number;
  name: string;
}

const SQLEditor = () => {
  const [query, setQuery] = useState("");

  const [columns, setColumns] = useState<Column[]>([]);
  const [rows, setRows] = useState([]);

  const { data: histories } = useQuery<any[]>({
    queryKey: ["query"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/main/query");
      return res.data;
    },
  });

  const queryClient = useQueryClient();

  const { mutate } = useMutation({
    mutationFn: async (query: string) => {
      axiosInstance
        .post("/api/main/query", {
          query: query.replace(/\n/g, " "),
        })
        .then((res) => {
          setColumns(
            Object.keys(res.data[0]).map((key, idx) => ({
              cid: idx,
              name: key,
            }))
          );
          setRows(res.data);
        })
        .catch((err) => {
          toast.error(err.response.data.error, {
            draggable: true,
          });
          throw err;
        });

      await queryClient.cancelQueries({ queryKey: ["query"] });

      const previousHistory = queryClient.getQueryData(["query"]);
      queryClient.setQueryData(["query"], (old: any) => {
        if (old) {
          return [query, ...old];
        } else {
          return [query];
        }
      });

      return { previousHistory };
    },
    onError: (context: any) => {
      queryClient.setQueryData(["query"], context.previousHistory);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["query"] });
    },
  });

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "Enter") {
        mutate(query);
      }
    };

    window.addEventListener("keydown", handleShortcut);

    return () => {
      window.removeEventListener("keydown", handleShortcut);
    };
  }, [query]);

  return (
    <div className="flex flex-col h-screen">
      <div className="min-h-[45px] h-[45px] px-5 flex items-center justify-between border-b-1">
        <h1 className="text-xl font-semibold my-auto">SQL Editor</h1>
        <Button
          onClick={() => mutate(query)}
          className="rounded-md h-[35px]  bg-slate-950 text-white font-semibold"
          endContent={<PiPaperPlaneRightFill />}
        >
          Run Query
        </Button>
      </div>
      <div className="flex flex-col h-[40%]">
        <div className="w-full flex">
          <div className="min-w-[200px] max-w-[300px] w-3/12">
            <p className="text-lg font-semibold ml-3 py-2">Previous query</p>
            <ScrollShadow className="h-[calc(40vh_-_40px)]">
              {histories?.map((history) => (
                <Code
                  className="bg-transparent rounded-none text-xs py-1 text-start w-full px-3 cursor-pointer hover:bg-default-200"
                  onClick={() => setQuery(history.query || "")}
                >
                  {history.query && history.query.length > 25
                    ? (history.query as string).slice(0, 25) + "..."
                    : history.query}
                </Code>
              ))}
            </ScrollShadow>
          </div>
          <div className="w-full">
            <AceEditor
              height="40vh"
              onChange={(e) => setQuery(e)}
              value={query}
              width=""
              fontSize={14}
              lineHeight={19}
              showPrintMargin={false}
              showGutter
              mode={"sql"}
              theme="sqlserver"
              setOptions={{
                enableBasicAutocompletion: true,
                enableLiveAutocompletion: true,
                enableSnippets: true,
              }}
              name="SQL Editor"
            />
          </div>
        </div>
      </div>
      <div className="flex-grow overflow-y-scroll bg-slate-100 h-[calc(60% - 45px)] ">
        <QueryResult rows={rows} columns={columns} />
      </div>
    </div>
  );
};

export default SQLEditor;

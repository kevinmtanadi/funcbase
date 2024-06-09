import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-sql";
import "ace-builds/src-noconflict/theme-sqlserver";
import "ace-builds/src-noconflict/ext-language_tools";
import { Button, ButtonGroup } from "@nextui-org/react";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import axios from "axios";

const SQLEditor = () => {
  const [query, setQuery] = useState("");
  const [_, setLimit] = useState(100);
  const handleSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLimit(parseInt(e.target.value));
  };

  const { mutate } = useMutation({
    mutationFn: async (query: string) => {
      axios
        .post("/api/db/query", {
          query: query.replace(/\n/g, " "),
        })
        .then((res) => {
          console.log(res.data);
        })
        .catch((err) => {
          console.log(err);
        });
    },
  });

  return (
    <div className="flex flex-col w-full">
      <div className="w-full h-[45px] flex border-b-1">
        <h1 className="text-xl font-bold my-auto ml-5">SQL Editor</h1>
      </div>
      <div className="w-full flex">
        <div className="min-w-[200px] max-w-[300px] w-3/12 px-[20px] pt-2">
          <p>Previous query</p>
        </div>
        <div className="w-full">
          <AceEditor
            onChange={(e) => setQuery(e)}
            value={query}
            width=""
            fontSize={14}
            lineHeight={19}
            placeholder="Enter SQL here"
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
      <div className="w-full bg-slate-300">
        <div className="flex justify-between p-2">
          <div className=""></div>
          <div className="flex gap-2">
            <select
              className="text-xs px-2 w-[92px] bg-slate-100 rounded-md"
              defaultValue={100}
              onChange={handleSelectionChange}
            >
              <option value={0}>No limit</option>
              <option value={100}>100 rows</option>
              <option value={200}>200 rows</option>
              <option value={500}>500 rows</option>
            </select>
            <ButtonGroup>
              <Button
                onClick={() => mutate(query)}
                className="h-[27px]"
                radius="sm"
                color="success"
              >
                Run
              </Button>
            </ButtonGroup>
          </div>
        </div>
      </div>
      <div className="w-full fixed bottom-0 bg-slate-600 h-24"></div>
    </div>
  );
};

export default SQLEditor;

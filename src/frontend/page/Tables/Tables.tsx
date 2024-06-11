import { Button, Input, useDisclosure } from "@nextui-org/react";
import axios from "axios";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FaPlus } from "react-icons/fa6";
import classNames from "classnames";
import CreateTableModal from "./CreateTableModal";
import TableData from "./TableData";
import TableSettingModal from "./TableSettingModal";

const Tables = () => {
  const [search, setSearch] = useState("");

  const { data: tables } = useQuery<{ name: string }[]>({
    queryKey: ["tables", search],
    queryFn: async () => {
      const res = await axios.get(`/api/db/tables`, {
        params: {
          search: search,
        },
      });
      return res.data;
    },
  });

  const [selectedTable, setSelectedTable] = useState("");
  useEffect(() => {
    if (!tables) {
      setSelectedTable("");
    }
  }, [tables]);

  var isFirst = true;
  useEffect(() => {
    if (isFirst && tables && tables.length > 0) {
      setSelectedTable(tables[0].name);
      isFirst = false;
    }
  }, [tables]);

  const {
    isOpen: isCreateOpen,
    onOpen: onCreateOpen,
    onClose: onCreateClose,
  } = useDisclosure();

  return (
    <div className="flex flex-col w-full">
      <div className="w-full h-[45px] flex border-b-1">
        <h1 className="text-xl font-bold my-auto ml-5">Table List</h1>
      </div>
      <div className="flex h-full">
        <div className="flex flex-col items-center bg-slate-100 h-screen px-[20px] w-[250px]">
          <div className="flex justify-center border-bottom-1 w-full py-4">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              variant="underlined"
              placeholder="Search for table"
            />
          </div>
          <div className="flex flex-col gap-2 w-full">
            {tables?.map((table) => (
              <div
                onClick={() => setSelectedTable(table.name)}
                className={classNames({
                  "rounded-md px-3 border-bottom-1 w-full py-2 hover:bg-slate-300 cursor-pointer":
                    true,
                  "bg-slate-300": table.name === selectedTable,
                })}
                key={table.name}
              >
                {table.name}
              </div>
            ))}
            <Button
              className="font-semibold border-black rounded-md"
              startContent={<FaPlus />}
              variant="bordered"
              onClick={onCreateOpen}
            >
              New Table
            </Button>
          </div>
        </div>
        <div className="w-full">
          {selectedTable ? (
            <TableData renderUpper tableName={selectedTable} />
          ) : (
            <div className="w-full mt-10 flex items-center justify-center">
              <p className="text-lg text-slate-400">No tables found</p>
            </div>
          )}
        </div>
      </div>
      <CreateTableModal isOpen={isCreateOpen} onClose={onCreateClose} />
    </div>
  );
};

export default Tables;

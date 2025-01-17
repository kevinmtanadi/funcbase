import { Button, Input, useDisclosure } from "@nextui-org/react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FaPlus, FaRegUser, FaTable } from "react-icons/fa6";
import classNames from "classnames";
import CreateTableModal from "./CreateTableModal";
import TableData from "./TableData";
import axiosInstance from "../../pkg/axiosInstance";

export interface Table {
  name: string;
  auth: boolean;
}

const Tables = () => {
  const [search, setSearch] = useState("");

  const { data: tables } = useQuery<Table[]>({
    queryKey: ["tables", search],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/main/tables`, {
        params: {
          search: search,
        },
      });
      return res.data;
    },
  });

  const [selectedTable, setSelectedTable] = useState<Table>({
    name: "",
    auth: false,
  });
  useEffect(() => {
    if (!tables) {
      setSelectedTable({ name: "", auth: false });
    }
  }, [tables]);

  const [first, setFirst] = useState(true);
  useEffect(() => {
    if (first && tables && tables.length > 0) {
      setSelectedTable(tables[0]);
      setFirst(false);
    }
  }, [tables]);

  const resetTable = () => {
    if (tables && tables.length > 0) {
      setSelectedTable(tables[0]);
    } else {
      setSelectedTable({ name: "", auth: false });
    }
  };

  const {
    isOpen: isCreateOpen,
    onOpen: onCreateOpen,
    onClose: onCreateClose,
  } = useDisclosure();

  return (
    <div className="flex flex-col w-full h-screen">
      <div className="w-full h-[45px] min-h-[45px] flex border-b-1">
        <h1 className="text-xl font-semibold my-auto ml-5">Table List</h1>
      </div>
      <div className="flex grow">
        <div className="flex flex-col items-center bg-slate-100 px-[20px] min-w-[250px] w-[250px]">
          <div className="flex justify-center border-bottom-1 w-full py-4">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              variant="bordered"
              classNames={{
                inputWrapper: "bg-white rounded-md",
              }}
              placeholder="Search table"
            />
          </div>
          <div className="flex flex-col gap-2 w-full">
            {tables?.map((table) => (
              <div
                onClick={() => setSelectedTable(table)}
                className={classNames({
                  "rounded-md flex items-center gap-3 px-3 border-bottom-1 w-full py-2 hover:bg-slate-300 cursor-pointer":
                    true,
                  "bg-slate-300": table.name === selectedTable.name,
                })}
                key={table.name}
              >
                <div>{table.auth ? <FaRegUser /> : <FaTable />}</div>
                <p>{table.name}</p>
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
          {selectedTable && selectedTable.name !== "" ? (
            <TableData table={selectedTable} resetTable={resetTable} />
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

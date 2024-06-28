import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../../pkg/axiosInstance";
import classNames from "classnames";
import { useState } from "react";
import { Button, Input } from "@nextui-org/react";
import { FaPlus } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import FunctionDetail from "./FunctionDetail";

const Function = () => {
  const [search, setSearch] = useState("");
  const { data: functions } = useQuery<any[]>({
    queryKey: ["functions", search],
    queryFn: () =>
      axiosInstance
        .get("/api/function", {
          params: {
            search: search,
          },
        })
        .then((res) => res.data),
  });
  const [selectedFunction, setSelectedFunction] = useState("");

  const navigate = useNavigate();
  return (
    <div className="flex flex-col w-full h-screen">
      <div className="w-full h-[45px] flex border-b-1">
        <h1 className="text-xl font-bold my-auto ml-5">Functions</h1>
      </div>
      <div className="flex grow">
        <div className="flex flex-col items-center bg-slate-100 px-[20px] min-w-[250px] w-[250px]">
          <div className="flex justify-center border-bottom-1 w-full py-4">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              variant="underlined"
              placeholder="Search functions"
            />
          </div>
          <div className="flex flex-col  gap-2 w-full">
            {functions?.map((func) => (
              <div
                className={classNames({
                  "rounded-md flex items-center gap-3 px-3 border-bottom-1 w-full py-2 hover:bg-slate-300 cursor-pointer":
                    true,
                  "bg-slate-300": func.name === selectedFunction,
                })}
                key={func.name}
                onClick={() => setSelectedFunction(func.name)}
              >
                {func.name}
              </div>
            ))}
            <Button
              className="font-semibold border-black rounded-md"
              startContent={<FaPlus />}
              variant="bordered"
              onClick={() => navigate("/function/create")}
            >
              New Function
            </Button>
          </div>
        </div>
        <div className="flex flex-col grow">
          <div className="p-5">
            <FunctionDetail funcName={selectedFunction} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Function;

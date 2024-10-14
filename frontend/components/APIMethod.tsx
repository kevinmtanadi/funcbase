import React from "react";

interface Props {
  method: "GET" | "POST" | "PUT" | "DELETE";
  endpoint: string | React.ReactNode;
  className?: string;
}
const APIMethod = ({ method, endpoint, className }: Props) => {
  switch (method) {
    case "GET":
      return (
        <div
          className={
            "bg-primary-50 flex items-center p-1.5 border-1 border-primary-300 rounded-md gap-2 " +
            className
          }
        >
          <div className="bg-primary-300 text-white font-semibold w-[100px] h-[30px] flex items-center justify-center rounded-md">
            GET
          </div>
          {endpoint}
        </div>
      );
    case "POST":
      return (
        <div
          className={
            "bg-green-100 flex items-center p-1.5 border-1 border-green-400 rounded-md gap-2 " +
            className
          }
        >
          <div className="bg-green-400 text-white font-semibold w-[100px] h-[30px] flex items-center justify-center rounded-md">
            POST
          </div>
          {endpoint}
        </div>
      );
    case "PUT":
      return (
        <div
          className={
            "bg-orange-100 flex items-center p-1.5 border-1 border-orange-400 rounded-md gap-2 " +
            className
          }
        >
          <div className="bg-orange-400 text-white font-semibold w-[100px] h-[30px] flex items-center justify-center rounded-md">
            PUT
          </div>
          {endpoint}
        </div>
      );
    case "DELETE":
      return (
        <div
          className={
            "bg-red-100 flex items-center p-1.5 border-1 border-red-400 rounded-md gap-2 " +
            className
          }
        >
          <div className="bg-red-300 text-white font-semibold w-[100px] h-[30px] flex items-center justify-center rounded-md">
            DELETE
          </div>
          {endpoint}
        </div>
      );
  }
};

export default APIMethod;

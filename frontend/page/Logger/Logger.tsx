import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import axiosInstance, { APIResponse } from "../../pkg/axiosInstance";
import {
  Button,
  Chip,
  Input,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@nextui-org/react";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
} from "recharts";
import { formatDate } from "../../utils/utils";
import { useState } from "react";
import classNames from "classnames";

interface Logs {
  id: number;
  method: string;
  endpoint: string;
  caller_ip: string;
  status_code: number;
  exec_time: number;
  created_at: string;
  user_agent: string;
}

interface FetchLogResponse {
  logs: Logs[];
  page: number;
  page_size: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white opacity-70 p-3 border-1">
        <p className="label">{`${formatDate(label, "dd mmm yyyy, HH:MM")}`}</p>
        <p className="text-xs font-semibold">{`Request : ${payload[0].value}`}</p>
      </div>
    );
  }
};

const StatusChip = ({ status }: any) => {
  return (
    <Chip
      className={classNames({
        "bg-green-600 ": status >= 200 && status < 300,
        "bg-yellow-600 ": status >= 300 && status < 400,
        "bg-orange-700 ": status >= 400 && status < 500,
        "bg-red-700": status >= 500,
        "text-white": true,
      })}
      radius="sm"
      size="sm"
    >
      Status Code: {status}
    </Chip>
  );
};

function convertTime(timeInMs: number): string {
  if (timeInMs >= 1000) {
    // Convert to seconds if greater than or equal to 1000ms
    return `${(timeInMs / 1000).toFixed(2)} s`;
  } else if (timeInMs >= 1) {
    // Keep in milliseconds for values between 1ms and 1000ms
    return `${timeInMs.toFixed(3)} ms`;
  } else if (timeInMs >= 0.001) {
    // Convert to microseconds if less than 1ms
    return `${(timeInMs * 1000).toFixed(3)} μs`;
  } else {
    // Convert to nanoseconds if less than 1 microsecond
    return `${(timeInMs * 1_000_000).toFixed(3)} ns`;
  }
}

const ExecTimeChip = ({ execTime }: any) => {
  return (
    <Chip
      className={classNames({
        "bg-green-600 ": execTime <= 1000,
        "bg-yellow-600 ": execTime >= 1000 && execTime < 5000,
        "bg-orange-700 ": execTime >= 5000 && execTime < 10000,
        "bg-red-700": execTime >= 10000,
        "text-white": true,
      })}
      radius="sm"
      size="sm"
    >
      Exec Time: {convertTime(execTime)}
    </Chip>
  );
};

const Logger = () => {
  const [params, setParams] = useState({
    filter: "",
    page_size: 20,
    page: 1,
  });
  const {
    data: logsSplitted,
    isLoading: isLoadingLogs,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<APIResponse<FetchLogResponse>>({
    queryKey: ["logs", params],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/logs", {
        params: params,
      });
      return res.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage.data.logs) {
        return undefined;
      }

      const pageSize = lastPage.data.page_size;
      const currentPage = lastPage.data.page;
      return lastPage.data.logs.length === pageSize
        ? currentPage + 1
        : undefined;
    },
  });

  const logs = logsSplitted?.pages.flatMap((page) => page.data.logs);

  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/logs/stats");
      return res.data;
    },
  });

  const [search, setSearch] = useState("");
  const applySearch = () => {
    setParams({ ...params, filter: search });
  };

  return (
    <div className="flex flex-col w-full h-screen">
      <div className="w-full h-[45px] min-h-[45px] flex border-b-1">
        <h1 className="text-xl font-semibold my-auto ml-5">Logs</h1>
      </div>
      <div className="px-10 py-10">
        <ResponsiveContainer width={"100%"} height={250}>
          <AreaChart data={stats?.data}>
            <defs>
              <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip content={<CustomTooltip />} />
            <XAxis
              includeHidden
              className="font-semibold"
              tickFormatter={(value) => `${formatDate(value, "dd mmm HH:MM")}`}
              tickMargin={5}
              minTickGap={120}
              dataKey={"Time"}
            />
            <YAxis
              tickCount={4}
              tickMargin={5}
              className="font-semibold"
              dataKey={"Request"}
            />
            <Area
              strokeWidth={2}
              fill="url(#colorUv)"
              fillOpacity={0.3}
              dot={false}
              type={"linear"}
              dataKey={"Request"}
              stroke="#8884d8"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="px-5 py-3">
        <Input
          value={search}
          onValueChange={setSearch}
          variant="bordered"
          className="text-lg"
          size="lg"
          radius="sm"
          placeholder={`Search for logs, ex: 200`}
          onKeyDown={(e) => {
            if (e.key === "Enter") applySearch();
          }}
          endContent={
            <Button
              className="rounded-md bg-slate-950 text-white font-semibold"
              size="sm"
              onClick={applySearch}
            >
              Search
            </Button>
          }
        />
      </div>
      <div className="flex flex-col gap-2 overflow-y-scroll">
        <Table
          isHeaderSticky
          classNames={{
            wrapper: "scroll-shadow",
            base: "",
            thead: "[&>tr]:first:rounded-none",
            th: [
              "text-default-500",
              "border-b",
              "rounded-none",
              "border-divider",
              "hover:bg-slate-200",
              "first:hover:bg-gray-100",
            ],
            tr: "[&>th]:first:rounded-none [&>th]:last:rounded-none border-b-1 rounded-none",
            td: [
              "group-data-[first=true]:first:before:rounded-none",
              "group-data-[first=true]:last:before:rounded-none",
              "group-data-[middle=true]:before:rounded-none",
              "group-data-[last=true]:first:before:rounded-none",
              "group-data-[last=true]:last:before:rounded-none",
              "py-2",
            ],
          }}
          removeWrapper
          bottomContent={
            !isLoadingLogs &&
            hasNextPage && (
              <div className="w-full flex justify-center mb-3">
                <Button
                  isLoading={isFetchingNextPage}
                  className="rounded-md w-full md:w-[150px] bg-slate-950 text-white font-semibold"
                  onClick={() => fetchNextPage()}
                >
                  Load more
                </Button>
              </div>
            )
          }
        >
          <TableHeader>
            <TableColumn width={"70%"}>Info</TableColumn>
            <TableColumn width={"30%"}>Created At</TableColumn>
          </TableHeader>
          {logs && logs.length > 0 && logs[0] != null ? (
            <TableBody isLoading={isLoadingLogs}>
              {logs.map((log: any) => (
                <TableRow>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      <p>
                        {log.method} {log.endpoint}
                      </p>
                      <div className="flex gap-2">
                        <Chip
                          className="bg-slate-600 text-white"
                          radius="sm"
                          size="sm"
                        >
                          Caller IP: {log.caller_ip}
                        </Chip>
                        <StatusChip status={log.status_code} />
                        <ExecTimeChip execTime={log.exec_time} />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(log.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          ) : isLoadingLogs ? (
            <TableBody>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((item) => (
                <TableRow key={item}>
                  <TableCell width={"70%"}>
                    <Skeleton className="h-[22px] rounded-md" />
                  </TableCell>
                  <TableCell width={"30%"}>
                    <Skeleton className="h-[22px] rounded-md" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          ) : (
            <TableBody
              items={[]}
              emptyContent="No logs yet, start making an API call to see logs"
            >
              {(item) => (
                <TableRow key={item}>{() => <TableCell> </TableCell>}</TableRow>
              )}
            </TableBody>
          )}
        </Table>
      </div>
    </div>
  );
};

export default Logger;

import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../../pkg/axiosInstance";
import { Card, CardBody, Chip } from "@nextui-org/react";
import { formatDate } from "../../utils/utils";

interface Log {
  endpoint: string;
  status: number;
  host: string;
  method: string;
  exec_time: string;
  error: any;
  created_at: string;
}

const Logs = () => {
  const { data: logs } = useQuery<Log[]>({
    queryKey: ["logs"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/logs");

      return res.data;
    },
  });
  return (
    <div className="flex flex-col gap-2 overflow-y-scroll max-h-screen">
      {logs?.map((l, idx) => (
        <LogCard log={l} key={idx} />
      ))}
    </div>
  );
};

interface LogCardProps {
  log: Log;
}
const LogCard = ({ log }: LogCardProps) => {
  const generalClass = " text-xs";

  const renderStatus = () => {
    if (log.status >= 200 && log.status < 300) {
      return (
        <Chip className={"text-white bg-green-400" + generalClass}>
          {log.status}
        </Chip>
      );
    } else if (log.status >= 300 && log.status < 400) {
      return (
        <Chip className={"text-white bg-yellow-400" + generalClass}>
          {log.status}
        </Chip>
      );
    } else {
      return (
        <Chip className={"text-white bg-red-400" + generalClass}>
          {log.status}
        </Chip>
      );
    }
  };

  const renderError = () => {
    if (log.error) {
      return <Chip className="text-white bg-red-400">{log.error}</Chip>;
    }
  };

  return (
    <Card className="min-h-32">
      <CardBody>
        <div className="flex flex-col gap-2">
          <p>
            {log.method} {log.endpoint}
          </p>
          <div className="flex flex-wrap gap-2 w-full">
            {renderStatus()}
            <Chip className={"text-white bg-slate-500" + generalClass}>
              Host: {log.host}
            </Chip>
            <Chip className={"text-white bg-slate-500" + generalClass}>
              Exec Time: {log.exec_time}
            </Chip>
            {renderError()}
            <Chip className={"text-white bg-slate-500" + generalClass}>
              Time: {formatDate(log.created_at)}
            </Chip>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default Logs;

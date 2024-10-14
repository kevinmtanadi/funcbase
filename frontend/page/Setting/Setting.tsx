import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import axiosInstance from "../../pkg/axiosInstance";
import {
  Button,
  Card,
  CardBody,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Spinner,
} from "@nextui-org/react";
import { uuidv7 } from "uuidv7";
import FloatingBox from "../../components/FloatingBox";
import { deepEqual } from "../../utils/utils";
import { toast } from "react-toastify";
import { LuCopy } from "react-icons/lu";
import classNames from "classnames";

interface SettingLayoutProps {
  children: React.ReactNode;
  isLoading: boolean;
}
const SettingLayout = ({ children, isLoading }: SettingLayoutProps) => {
  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center">
        <Spinner color="default" size="lg" />
      </div>
    );
  }

  return <>{children}</>;
};

const GeneralSetting = () => {
  const settingList = ["app_url", "app_name"];

  const [setting, setSetting] = useState<any>({});
  const {
    data: defaultSetting,
    isLoading,
    isPending,
    isFetching,
  } = useQuery<any>({
    queryKey: ["settings", "general"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/settings", {
        params: {
          keys: settingList.join(","),
        },
      });
      setSetting(res.data);
      return res.data;
    },
  });

  const queryClient = useQueryClient();

  const { mutateAsync } = useMutation({
    mutationFn: async (data: any) => {
      const res = await axiosInstance.put("/api/settings", {
        data: data,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "general"] });
    },
  });

  const saveSetting = async () => {
    toast.promise(mutateAsync(setting), {
      pending: "Saving setting...",
      success: "Setting saved successfully",
      error: "Error when saving setting",
    });
  };

  return (
    <>
      <h1 className="text-xl font-semibold mb-5">General</h1>
      <SettingLayout isLoading={isLoading || isPending || isFetching}>
        <div className="flex flex-col gap-5">
          <Input
            isDisabled={isLoading || isPending || isFetching}
            size="sm"
            label={"App Name"}
            value={setting.app_name}
            className="w-full"
            onChange={(e) =>
              setSetting({ ...setting, app_name: e.target.value })
            }
          />
          <Input
            isDisabled={isLoading || isPending || isFetching}
            size="sm"
            label={"App URL"}
            value={setting.app_url}
            className="w-full"
            onChange={(e) =>
              setSetting({ ...setting, app_url: e.target.value })
            }
          />
        </div>
        <FloatingBox
          isOpen={
            !deepEqual(setting, defaultSetting) &&
            !isLoading &&
            !isPending &&
            !isFetching
          }
        >
          <Card>
            <CardBody className="pl-6 pr-2 py-2">
              <div className="flex gap-10 items-center">
                <div className="flex items-center gap-2">
                  <p className="text-sm">Setting changed</p>
                  <Button
                    className="p-0 min-w-0 w-[80px] h-8 bg-transparent hover:bg-slate-200"
                    radius="sm"
                    onClick={() => setSetting(defaultSetting)}
                  >
                    Reset
                  </Button>
                  <Button
                    className="p-0 min-w-0 w-[80px] h-8 rounded-md  bg-slate-950 text-white"
                    radius="sm"
                    onClick={saveSetting}
                  >
                    Save
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </FloatingBox>
      </SettingLayout>
    </>
  );
};

const SecuritySetting = () => {
  const settingList = ["api_key", "allowed_origins"];

  const [setting, setSetting] = useState<any>({});
  const {
    data: defaultSetting,
    isLoading,
    isFetching,
    isPending,
  } = useQuery<any>({
    queryKey: ["settings", "security"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/settings", {
        params: {
          keys: settingList.join(","),
        },
      });
      setSetting(res.data);
      return res.data;
    },
  });

  const queryClient = useQueryClient();

  const { mutateAsync } = useMutation({
    mutationFn: async (data: any) => {
      const res = await axiosInstance.put("/api/settings", {
        data: data,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "security"] });
    },
  });

  const saveSetting = async () => {
    toast.promise(mutateAsync(setting), {
      pending: "Saving setting...",
      success: "Setting saved successfully",
      error: "Error when saving setting",
    });
  };

  return (
    <>
      <h1 className="text-xl font-semibold mb-5">Security</h1>
      <SettingLayout isLoading={isLoading || isFetching || isPending}>
        <div className="flex flex-col gap-5">
          <div className="flex gap-3">
            <Input
              endContent={
                <Popover placement="bottom-start">
                  <PopoverTrigger>
                    <Button
                      onClick={() =>
                        navigator.clipboard.writeText(setting.api_key)
                      }
                      className="bg-slate-100 h-7 p-0 px-3 min-w-0"
                      variant="light"
                    >
                      <div className="flex items-center gap-3">
                        <LuCopy />
                      </div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <div className="px-1 py-2">
                      <div className="text-sm font-semibold">Copied</div>
                    </div>
                  </PopoverContent>
                </Popover>
              }
              isReadOnly
              size="sm"
              label={"API Key"}
              value={setting.api_key}
              className="w-full"
            />
            <Button
              className="rounded-md w-[200px] text-sm bg-slate-950 text-white font-semibold"
              size="lg"
              radius="sm"
              onClick={() => setSetting({ api_key: uuidv7() })}
            >
              Regenerate API Key
            </Button>
          </div>
        </div>
        <FloatingBox
          isOpen={
            !deepEqual(setting, defaultSetting) &&
            !isLoading &&
            !isPending &&
            !isFetching
          }
        >
          <Card>
            <CardBody className="pl-6 pr-2 py-2">
              <div className="flex gap-10 items-center">
                <div className="flex items-center gap-2">
                  <p className="text-sm">Setting changed</p>
                  <Button
                    className="p-0 min-w-0 w-[80px] h-8 bg-transparent hover:bg-slate-200"
                    radius="sm"
                    onClick={() => setSetting(defaultSetting)}
                  >
                    Reset
                  </Button>
                  <Button
                    className="p-0 min-w-0 w-[80px] h-8 rounded-md  bg-slate-950 text-white"
                    radius="sm"
                    onClick={saveSetting}
                  >
                    Save
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </FloatingBox>
      </SettingLayout>
    </>
  );
};

const DatabaseSetting = () => {
  const settingList = [
    "db_max_open_connection",
    "db_max_idle_connection",
    "db_max_lifetime",
  ];

  const [setting, setSetting] = useState<any>({});
  const {
    data: defaultSetting,
    isLoading,
    isFetching,
    isPending,
  } = useQuery<any>({
    queryKey: ["settings", "database"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/settings", {
        params: {
          keys: settingList.join(","),
        },
      });
      setSetting(res.data);
      return res.data;
    },
  });

  const queryClient = useQueryClient();

  const { mutateAsync } = useMutation({
    mutationFn: async (data: any) => {
      const res = await axiosInstance.put("/api/settings", {
        data: {
          db_max_open_connection: parseInt(data.db_max_open_connection),
          db_max_idle_connection: parseInt(data.db_max_idle_connection),
          db_max_lifetime: parseInt(data.db_max_lifetime),
        },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "database"] });
    },
  });

  const saveSetting = async () => {
    toast.promise(mutateAsync(setting), {
      pending: "Saving setting...",
      success: "Setting saved successfully",
      error: "Error when saving setting",
    });
  };

  return (
    <>
      <h1 className="text-xl font-semibold mb-5">Database</h1>
      <SettingLayout isLoading={isLoading || isFetching || isPending}>
        <div className="flex flex-col gap-3 mt-10">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col">
              <p className="font-semibold text-medium">
                Database Max Open Connection
              </p>
              <p className="text-sm">
                Sets the max number of open connections. Increasing this value
                will increase the database's performance at the cost of high
                resource usage
              </p>
            </div>
            <Input
              type="number"
              radius="sm"
              isDisabled={isLoading || isPending || isFetching}
              className="w-32"
              value={setting.db_max_open_connection}
              onChange={(e) =>
                setSetting({
                  ...setting,
                  db_max_open_connection: e.target.value,
                })
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col">
              <p className="font-semibold text-medium">
                Database Max Idle Connection
              </p>
              <p className="text-sm">
                Sets the max number of idle connections kept in the pool.
                Increasing this value reduces the cost of opening new
                connections at the cost of increased memory usage.
              </p>
            </div>
            <Input
              type="number"
              radius="sm"
              isDisabled={isLoading || isPending || isFetching}
              className="w-32"
              value={setting.db_max_idle_connection}
              onChange={(e) =>
                setSetting({
                  ...setting,
                  db_max_idle_connection: e.target.value,
                })
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col">
              <p className="font-semibold text-medium">
                Database Connection Max Lifetime
              </p>
              <p className="text-sm">
                Sets how long a connection can remain open (in minutes).
                Increasing this keeps connection to the database alive longer,
                reducing the need to reconnect at the cost of higher memory
                usage
              </p>
            </div>
            <Input
              type="number"
              radius="sm"
              isDisabled={isLoading || isPending || isFetching}
              className="w-32"
              value={setting.db_max_lifetime}
              onChange={(e) =>
                setSetting({
                  ...setting,
                  db_max_lifetime: e.target.value,
                })
              }
            />
          </div>
        </div>
        <FloatingBox
          isOpen={
            !deepEqual(setting, defaultSetting) &&
            !isLoading &&
            !isPending &&
            !isFetching
          }
        >
          <Card>
            <CardBody className="pl-6 pr-2 py-2">
              <div className="flex gap-10 items-center">
                <div className="flex items-center gap-2">
                  <p className="text-sm">Setting changed</p>
                  <Button
                    className="p-0 min-w-0 w-[80px] h-8 bg-transparent hover:bg-slate-200"
                    radius="sm"
                    onClick={() => setSetting(defaultSetting)}
                  >
                    Reset
                  </Button>
                  <Button
                    className="p-0 min-w-0 w-[80px] h-8 rounded-md  bg-slate-950 text-white"
                    radius="sm"
                    onClick={saveSetting}
                  >
                    Save
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </FloatingBox>
      </SettingLayout>
    </>
  );
};

const settingTabList = [
  {
    name: "General",
    content: <GeneralSetting />,
  },
  {
    name: "Security",
    content: <SecuritySetting />,
  },
  {
    name: "Database",
    content: <DatabaseSetting />,
  },
];

const renderSetting = (name: string) => {
  return settingTabList.filter((item) => item.name === name)[0].content;
};

const Setting = () => {
  const [tab, setTab] = useState("General");
  return (
    <div className="flex flex-col w-full h-screen">
      <div className="w-full h-[45px] min-h-[45px] flex border-b-1">
        <h1 className="text-xl font-semibold my-auto ml-5">Settings</h1>
      </div>
      <div className="flex grow">
        <div className="flex flex-col items-center bg-slate-100 px-[20px] min-w-[250px] w-[250px]">
          <div className="flex flex-col mt-3 gap-2 w-full">
            {settingTabList.map((item) => (
              <div
                className={classNames({
                  "rounded-md flex items-center gap-3 px-3 border-bottom-1 w-full py-2 hover:bg-slate-300 cursor-pointer":
                    true,
                  "bg-slate-300": tab === item.name,
                })}
                key={item.name}
                onClick={() => setTab(item.name)}
              >
                {item.name}
              </div>
            ))}
          </div>
        </div>

        <div className="grow mt-3 mx-5">{renderSetting(tab)}</div>
      </div>
    </div>
  );
};

export default Setting;

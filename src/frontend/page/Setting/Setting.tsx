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
} from "@nextui-org/react";
import { uuidv7 } from "uuidv7";
import FloatingBox from "../../components/FloatingBox";
import { deepEqual } from "../../utils/utils";
import { toast } from "react-toastify";
import { LuCopy } from "react-icons/lu";

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
      <div className="flex flex-col gap-5">
        <Input
          isDisabled={isLoading || isPending || isFetching}
          size="sm"
          label={"App Name"}
          value={setting.app_name}
          className="w-full"
          onChange={(e) => setSetting({ ...setting, app_name: e.target.value })}
        />
        <Input
          isDisabled={isLoading || isPending || isFetching}
          size="sm"
          label={"App URL"}
          value={setting.app_url}
          className="w-full"
          onChange={(e) => setSetting({ ...setting, app_url: e.target.value })}
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
                    <div className="text-sm font-bold">Copied</div>
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
];

const renderSetting = (name: string) => {
  return settingTabList.filter((item) => item.name === name)[0].content;
};

const Setting = () => {
  const [tab, setTab] = useState("General");
  return (
    <div className="flex gap-5 flex-col w-full h-screen">
      <div className="w-full h-[45px] flex border-b-1">
        <h1 className="text-xl font-bold my-auto ml-5">Setings</h1>
      </div>
      <div className="flex mx-5 gap-5">
        <div className="max-w-[200px] min-w-[150px] w-[30%]">
          <div className="flex flex-col">
            {settingTabList.map((item) => (
              <div
                className="p-2 cursor-pointer hover:bg-slate-300"
                onClick={() => setTab(item.name)}
              >
                {item.name}
              </div>
            ))}
          </div>
        </div>
        <div className="grow ">{renderSetting(tab)}</div>
      </div>
    </div>
  );
};

export default Setting;

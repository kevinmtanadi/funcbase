import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../pkg/axiosInstance";
import {
  Button,
  Card,
  CardBody,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Spinner,
  Switch,
  useDisclosure,
} from "@nextui-org/react";
import { BsThreeDotsVertical } from "react-icons/bs";
import RestoreModal from "./RestoreModal";
import { useEffect, useState } from "react";
import { isValidCron } from "cron-validator";
import { parseHumanReadable } from "cron-js-parser";
import { toast } from "react-toastify";
import BackupConfirmationModal from "./BackupConfirmationModal";
import DeleteBackupModal from "./DeleteBackupModal";

const Backup = () => {
  const { data: backups } = useQuery({
    queryKey: ["backups"],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/main/backup`);
      return res.data;
    },
  });

  const [selectedBackup, setSelectedBackup] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isConfirmOpen,
    onOpen: onConfirmOpen,
    onClose: onConfirmClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  return (
    <div className="flex flex-col w-full h-screen">
      <div className="w-full h-[45px] min-h-[45px] flex border-b-1">
        <h1 className="text-xl font-semibold my-auto ml-5">Backup</h1>
      </div>
      <div className="flex flex-col items-center p-5 w-full">
        <Card className="max-w-2xl w-4/5" radius="sm">
          <CardBody>
            <div className="flex flex-col gap-4 px-7 py-7">
              <div className="flex w-full justify-between">
                <p>Backup Data</p>
                <Button
                  className="w-[125px] bg-slate-950 text-white font-semibold"
                  radius="sm"
                  onClick={onConfirmOpen}
                >
                  Manual Backup
                </Button>
              </div>
              <div className="rounded-md px-2 py-2 bg-default-100 border-default-200 border-1  min-h-[250px] h-[250px] max-h-[250px] overflow-y-scroll">
                <div className="flex flex-col gap-1">
                  {!backups || backups.length == 0 ? (
                    <div className="w-full h-full text-center items-center justify-center text-default-300">
                      <p>No backup yet</p>
                    </div>
                  ) : (
                    backups?.map((backup: any) => (
                      <div className="flex justify-between items-center hover:bg-slate-300 px-3">
                        <p>{backup}</p>
                        <Popover
                          classNames={{
                            content: "rounded-sm",
                          }}
                          placement="left-start"
                        >
                          <PopoverTrigger>
                            <div className="cursor-pointer px-1">
                              <BsThreeDotsVertical size={12} />
                            </div>
                          </PopoverTrigger>
                          <PopoverContent>
                            <div className="flex flex-col w-full">
                              <Button
                                size="sm"
                                className="bg-transparent hover:bg-default-200 rounded-sm"
                                onClick={() => {
                                  setSelectedBackup(backup);
                                  onOpen();
                                }}
                              >
                                Restore
                              </Button>
                              <Button
                                size="sm"
                                className="bg-transparent hover:bg-default-200 rounded-sm"
                              >
                                Download
                              </Button>
                              <Button
                                size="sm"
                                className="bg-transparent hover:bg-default-200 rounded-sm"
                                onClick={() => {
                                  setSelectedBackup(backup);
                                  onDeleteOpen();
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <Divider />
              <AutomatedBackup />
            </div>
          </CardBody>
        </Card>
        <RestoreModal
          isOpen={isOpen}
          onClose={onClose}
          filename={selectedBackup}
        />
        <BackupConfirmationModal
          isOpen={isConfirmOpen}
          onClose={onConfirmClose}
        />
        <DeleteBackupModal
          isOpen={isDeleteOpen}
          onClose={onDeleteClose}
          filename={selectedBackup}
        />
      </div>
    </div>
  );
};

export default Backup;

const AutomatedBackup = () => {
  interface BackupSetting {
    automated_backup?: boolean;
    cron_schedule: string;
  }

  const [setting, setSetting] = useState<BackupSetting>({
    automated_backup: false,
    cron_schedule: "",
  });
  const { isLoading, isFetching, isPending } = useQuery<any>({
    queryKey: ["settings", "backup"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/settings", {
        params: {
          keys: "automated_backup,cron_schedule",
        },
      });
      setSetting(res.data);
      return res.data;
    },
  });
  const [humanReadable, setHumanReadable] = useState("");

  const [cronError, setCronError] = useState(false);
  useEffect(() => {
    if (setting.cron_schedule === "") {
      setCronError(false);
      return;
    }
    if (!isValidCron(setting.cron_schedule)) {
      setCronError(true);
      return;
    }
    setHumanReadable(
      parseHumanReadable(
        setting.cron_schedule,
        {
          runOnWeekDay: {
            dayIndex: 0,
            isLastWeek: false,
          },
        },
        "en"
      )
    );
    setCronError(false);
  }, [setting.cron_schedule]);

  const queryClient = useQueryClient();

  const { mutateAsync } = useMutation({
    mutationFn: async (data: any) => {
      const res = await axiosInstance.put("/api/settings", {
        data: data,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "backup"] });
    },
  });

  const saveSetting = async () => {
    toast.promise(mutateAsync(setting), {
      pending: "Saving setting...",
      success: "Setting saved successfully",
      error: "Error when saving setting",
    });
  };

  if (isLoading || isFetching || isPending) {
    return (
      <div className="flex w-full items-center justify-center py-4">
        <Spinner size="lg" color="default" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Switch
        isDisabled={isLoading || isFetching || isPending}
        isSelected={setting.automated_backup}
        onValueChange={(value) =>
          setSetting({
            ...setting,
            automated_backup: value,
          })
        }
        classNames={{
          base: "inline-flex justify-between flex-row-reverse w-full max-w-full items-center",
        }}
        id="automated_backup"
        name="automated_backup"
      >
        Allow Automated Backup
      </Switch>
      <div className="flex flex-col">
        {setting.automated_backup && (
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <label htmlFor="cron_schedule" className="mr-3">
                CRON Expression
              </label>
              <div className="border-2 rounded-md items-center flex justify-between">
                <input
                  value={setting.cron_schedule}
                  onChange={(e) =>
                    setSetting({
                      ...setting,
                      cron_schedule: e.target.value,
                    })
                  }
                  id="cron_schedule"
                  name="cron_schedule"
                  placeholder="0 0 * * *"
                  className="w-full max-w-[300px] p-3 bg-transparent hover:bg-transparent font-semibold"
                />
                <Dropdown>
                  <DropdownTrigger>
                    <p className="text-xs mr-4 cursor-pointer border-2 rounded-md py-1 px-2 text-default-400 font-semibold">
                      Preset
                    </p>
                  </DropdownTrigger>
                  <DropdownMenu>
                    <DropdownItem
                      onClick={() =>
                        setSetting({
                          ...setting,
                          cron_schedule: "0 0 * * *",
                        })
                      }
                    >
                      Every day at 00:00
                    </DropdownItem>
                    <DropdownItem
                      onClick={() =>
                        setSetting({
                          ...setting,
                          cron_schedule: "0 0 * * 1",
                        })
                      }
                    >
                      Every week on Monday at 00:00
                    </DropdownItem>
                    <DropdownItem
                      onClick={() =>
                        setSetting({
                          ...setting,
                          cron_schedule: "0 0 1 * *",
                        })
                      }
                    >
                      Every month on the 1st day at 00:00
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>
            </div>
            {cronError ? (
              <p className="text-red-500 text-xs text-end">
                Invalid cron schedule
              </p>
            ) : (
              humanReadable && (
                <p className="text-end text-xs">{humanReadable}</p>
              )
            )}
          </div>
        )}
        <div className="flex justify-end mt-10">
          <Button radius="sm" className="bg-transparent hover:bg-slate-100">
            Reset
          </Button>
          <Button
            isDisabled={cronError || setting.cron_schedule === ""}
            className="w-[125px] bg-slate-950 text-white font-semibold"
            radius="sm"
            onClick={saveSetting}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

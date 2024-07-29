import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../pkg/axiosInstance";
import {
  Button,
  Card,
  CardBody,
  Divider,
  Popover,
  PopoverContent,
  PopoverTrigger,
  useDisclosure,
} from "@nextui-org/react";
import { BsThreeDotsVertical } from "react-icons/bs";
import RestoreModal from "./RestoreModal";
import { useState } from "react";

const Backup = () => {
  const { data: backups } = useQuery({
    queryKey: ["backups"],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/main/backup`);
      return res.data;
    },
  });

  const { mutate } = useMutation({
    mutationFn: async () => {
      const res = await axiosInstance.post(`/api/main/backup`);
      return res.data;
    },
  });

  const [selectedBackup, setSelectedBackup] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <div className="flex flex-col items-center p-5 w-full">
      <Card className="max-w-2xl w-4/5" radius="sm">
        <CardBody>
          <div className="flex flex-col gap-4 px-7 py-7">
            <p>Backup Data</p>
            <div className="rounded-md px-2 py-2 bg-default-100 border-default-200 border-1">
              <div className="flex flex-col gap-1">
                {backups?.map((backup: any) => (
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
                          >
                            Delete
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                ))}
              </div>
            </div>
            <Divider />
          </div>
        </CardBody>
      </Card>
      <RestoreModal
        isOpen={isOpen}
        onClose={onClose}
        filename={selectedBackup}
      />
    </div>
  );
};

export default Backup;

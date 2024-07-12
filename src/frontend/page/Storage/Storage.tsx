import {
  Button,
  Card,
  CardFooter,
  Image,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@nextui-org/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import axiosInstance from "../../pkg/axiosInstance";
import { formatBytes } from "../../utils/utils";
import { FaFile } from "react-icons/fa6";
import { BsThreeDots } from "react-icons/bs";
import { FaRegTrashAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import { MdFileUpload } from "react-icons/md";
import { IoMdDownload } from "react-icons/io";

interface SearchParams {
  search: string;
  page: number;
  page_size: number;
}

interface File {
  filename: string;
  size: number;
  type: string;
}

interface FetchStorageRes {
  files: File[];
  page: number;
  page_size: number;
  total_files: number;
}

const Storage = () => {
  const [params, _] = useState<SearchParams>({
    search: "",
    page: 1,
    page_size: 100,
  });

  const { data: files } = useQuery<FetchStorageRes>({
    queryKey: ["filenames", params],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/api/storage", {
        params: { params },
      });

      return data;
    },
  });

  const inputFile = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  const { mutateAsync: uploadFile } = useMutation({
    mutationFn: async () => {
      const file = inputFile.current?.files?.[0];

      if (!file) {
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      const res = await axiosInstance.post("/api/storage/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return res.data;
    },
    onSuccess: () => {
      queryClient.refetchQueries({
        queryKey: ["filenames"],
      });
    },
  });

  const handleUploadFile = () => {
    toast.promise(uploadFile(), {
      pending: "Uploading...",
      success: "Upload success!",
      error: "Upload failed!",
    });
  };

  return (
    <div className="flex flex-col w-full h-screen">
      <div className="w-full min-h-[45px] h-[45px] flex border-b-1">
        <h1 className="text-xl font-bold my-auto ml-5">Storage</h1>
      </div>
      <div className="px-5 grow py-5 overflow-y-scroll">
        <Input
          labelPlacement="inside"
          variant="bordered"
          label="Search filename"
          fullWidth
        />

        <div className="flex my-5 justify-start">
          <input
            ref={inputFile}
            onChange={handleUploadFile}
            type="file"
            className="hidden"
          />
          <Button
            onClick={() => {
              inputFile.current?.click();
            }}
            startContent={<MdFileUpload />}
            className="rounded-md w-full md:w-[150px] bg-slate-950 text-white font-semibold"
          >
            Upload
          </Button>
        </div>
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
          {files?.total_files === 0 && (
            <div className="text-center col-span-12 row-span-4 mt-15 font-semibold text-default-500 text-xl">
              Storage is empty
            </div>
          )}
          {files?.files?.map((file) => (
            <StorageItem key={file.filename} file={file} />
          ))}
        </div>
      </div>
    </div>
  );
};

interface StorageItemProps {
  file: File;
}

function extToType(ext: string) {
  switch (ext) {
    case ".jpg":
    case ".png":
    case ".jpeg":
    case ".webp":
      return "image";
    default:
      return "file";
  }
}

const StorageItem = ({ file }: StorageItemProps) => {
  const { data: image } = useQuery({
    queryKey: ["image", file.filename],
    queryFn: async () => {
      if (extToType(file.type) === "file") {
        return null;
      }

      const response = await axiosInstance.get(
        `/api/storage/${file.filename}`,
        {
          responseType: "blob",
        }
      );

      return URL.createObjectURL(new Blob([response.data]));
    },
  });

  const queryClient = useQueryClient();

  const { mutateAsync } = useMutation({
    mutationFn: async () => {
      await axiosInstance.delete(`/api/storage/${file.filename}`);
    },
    onSuccess: () => {
      queryClient.refetchQueries({
        queryKey: ["filenames"],
      });
    },
  });

  const deleteItem = () => {
    toast.promise(mutateAsync(), {
      pending: "Deleting item...",
      success: "Item deleted successfully",
      error: "Error when deleting item",
    });
  };

  const { mutate: downloadFile } = useMutation({
    mutationFn: async () => {
      axiosInstance
        .get(`/api/storage/${file.filename}`, {
          responseType: "blob",
        })
        .then((response) => {
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", file.filename);
          document.body.appendChild(link);
          link.click();
        });
    },
  });

  return (
    <Card radius="sm">
      {image ? (
        <Image
          className="rounded-b-none rounded-t-md object-contain w-[700px] h-[100px] xl:h-[200px] bg-default-300"
          //   isBlurred
          src={image}
          alt={file.filename}
        />
      ) : (
        <div className="flex flex-col h-[100px] xl:h-[200px] justify-center items-center py-8 bg-default-300">
          <FaFile color="white" size={90} />
        </div>
      )}
      <CardFooter className="px-4 flex justify-between items-start">
        <div className="flex flex-col w-[80%]">
          <p className="text-xs text-ellipsis grow whitespace-nowrap overflow-hidden">
            {file.filename}
          </p>
          <p className="text-xs text-default-500">{formatBytes(file.size)}</p>
        </div>
        <div className="">
          <Popover
            classNames={{
              content: "rounded-md",
            }}
            placement="bottom"
          >
            <PopoverTrigger>
              <Button className="bg-transparent hover:bg-default-100 h-7 p-0 w-7 min-w-0">
                <BsThreeDots />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-2">
              <div className="flex flex-col gap-1">
                <Button
                  onClick={() => downloadFile()}
                  className="bg-transparent hover:bg-default-200 h-8 rounded-none p-2 flex justify-start items-center gap-3 text-blue-600"
                >
                  <IoMdDownload />
                  <p>Download</p>
                </Button>
                <Button
                  onClick={deleteItem}
                  className="bg-transparent hover:bg-default-200 h-8 rounded-none p-2 flex justify-start items-center gap-3 text-red-600"
                >
                  <FaRegTrashAlt />
                  <p>Delete</p>
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardFooter>
    </Card>
  );
};

export default Storage;

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Divider,
  ModalFooter,
  Button,
  BreadcrumbItem,
  Breadcrumbs,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Spinner,
} from "@nextui-org/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import TextInput from "../../components/Inputs/TextInput";
import DatetimeInput from "../../components/Inputs/DatetimeInput";
import NumberInput from "../../components/Inputs/NumberInput";
import BoolInput from "../../components/Inputs/BoolInput";
import { useFormik } from "formik";
import { toast } from "react-toastify";
import { useEffect } from "react";
import { parseAbsoluteToLocal } from "@internationalized/date";
import { BsThreeDots } from "react-icons/bs";
import { FaRegTrashAlt } from "react-icons/fa";
import axiosInstance from "../../pkg/axiosInstance";
import FileInput from "../../components/Inputs/FileInput";
import RelationInput from "../../components/Inputs/RelationInput";

interface UpdateDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableName: string;
  id: string;
}

const UpdateDataModal = ({
  isOpen,
  onClose,
  tableName,
  id,
}: UpdateDataModalProps) => {
  const { data: columns } = useQuery<any[]>({
    queryKey: ["columns", tableName],
    queryFn: async () => {
      if (!tableName) return [];

      const res = await axiosInstance.get(`/api/main/${tableName}/columns`);
      return res.data;
    },
  });

  const { data, isLoading } = useQuery<any>({
    queryKey: ["data", tableName, id],
    queryFn: async () => {
      if (!id || !tableName || id === "" || tableName === "") return [];

      const res = await axiosInstance.get(`/api/main/${tableName}/${id}`);
      return res.data;
    },
  });

  const renderInputField = (column: any, formik: any) => {
    switch (column.type) {
      case "TEXT":
        return (
          <TextInput
            isDisabled={isLoading || column.name === "id"}
            id={column.name}
            name={column.name}
            isRequired={column.notnull === 0}
            key={column.name}
            label={column.name}
            value={formik.values ? formik.values[column.name] : ""}
            onChange={formik.handleChange}
          />
        );
      case "REAL":
      case "INTEGER":
        return (
          <NumberInput
            isDisabled={isLoading}
            id={column.name}
            name={column.name}
            isRequired={column.notnull === 0}
            key={column.name}
            label={column.name}
            value={formik.values ? formik.values[column.name] : ""}
            onChange={formik.handleChange}
          />
        );
      case "BOOLEAN":
        return (
          <BoolInput
            isDisabled={isLoading}
            id={column.name}
            name={column.name}
            key={column.name}
            label={column.name}
            isSelected={formik.values ? formik.values[column.name] : ""}
            onChange={formik.handleChange}
          />
        );
      case "DATETIME":
      case "TIMESTAMP":
        return (
          <DatetimeInput
            isDisabled={true}
            id={column.name}
            name={column.name}
            isRequired={column.notnull === 0}
            key={column.name}
            label={column.name}
            value={
              formik.values && formik.values[column.name]
                ? parseAbsoluteToLocal(formik.values[column.name])
                : parseAbsoluteToLocal(new Date().toISOString())
            }
            onChange={formik.handleChange}
          />
        );
      case "RELATION":
        return (
          <RelationInput
            value={formik.values ? formik.values[column.name] : ""}
            id={column.name}
            name={column.name}
            isRequired={column.notnull === 0}
            key={column.name}
            label={column.name}
            onChange={(value: string) =>
              formik.setValues({
                ...formik.values,
                [column.name]: value,
              })
            }
            relatedTable={column.reference}
          />
        );
      case "BLOB":
        return (
          <FileInput
            id={column.name}
            name={column.name}
            isRequired={column.notnull === 0}
            key={column.name}
            label={column.name}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              if (!event.target.files) {
                return;
              }
              formik.setFieldValue(column.name, event.target.files[0]);
            }}
          />
        );
      default:
        return (
          <TextInput
            isDisabled={isLoading}
            id={column.name}
            name={column.name}
            isRequired={column.notnull === 0}
            key={column.cid}
            label={column.name}
            value={formik.values ? formik.values[column.name] : ""}
            onChange={formik.handleChange}
          />
        );
    }
  };

  const queryClient = useQueryClient();

  const { mutateAsync } = useMutation({
    mutationFn: async (data: any) => {
      const formData = new FormData();

      Object.keys(data).forEach((key) => {
        formData.append(key, data[key]);
      });

      const res = await axiosInstance.put(
        `/api/main/${tableName}/update`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.refetchQueries({
        queryKey: ["rows", tableName],
      });
      onClose();
    },
  });

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: data,
    onSubmit: async (values) => {
      toast.promise(mutateAsync(values), {
        pending: "Updating data...",
        success: "Data updated successfully",
        error: "Error when updating data",
      });
    },
  });

  useEffect(() => {
    if (data) {
      formik.setValues(data);
    }
  }, [data]);

  const { mutateAsync: deleteMutation } = useMutation({
    mutationFn: async () => {
      const res = await axiosInstance.delete(`/api/main/${tableName}/rows`, {
        data: { id: [id] },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.refetchQueries({
        queryKey: ["rows", tableName],
      });
      onClose();
    },
  });

  const handleDelete = async () => {
    toast.promise(deleteMutation(), {
      pending: "Deleting data...",
      success: "Data deleted successfully",
      error: "Error when deleting data",
    });
  };

  if (!columns) return <></>;

  return (
    <>
      <Modal radius="sm" size="2xl" isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader className="font-normal">
            <div className="flex gap-2 items-center">
              <Breadcrumbs
                separator="/"
                size="lg"
                isDisabled
                className="text-lg px-1 font-semibold"
              >
                <BreadcrumbItem>{tableName}</BreadcrumbItem>
                <BreadcrumbItem>{id}</BreadcrumbItem>
              </Breadcrumbs>
              {isLoading ? (
                <Spinner color="default" size="sm" />
              ) : (
                <Popover placement="bottom" radius="sm">
                  <PopoverTrigger>
                    <Button className="bg-transparent hover:bg-default-100 h-7 p-0 w-7 min-w-0">
                      <BsThreeDots />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <Button
                      onClick={handleDelete}
                      className="bg-transparent min-w-0 w-full p-0"
                    >
                      <div className="flex gap-2 justify-between w-full items-center">
                        <p className="font-semibold text-red-500">Delete</p>
                        <FaRegTrashAlt className="text-red-500" />
                      </div>
                    </Button>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </ModalHeader>
          {!formik.values ? (
            <div className="w-full h-full flex justify-center py-3">
              <Spinner size="lg" color="default" />
            </div>
          ) : (
            <form onSubmit={formik.handleSubmit}>
              <ModalBody className="mb-3">
                <div className="flex flex-col gap-4">
                  {columns?.map((column) => renderInputField(column, formik))}
                </div>
              </ModalBody>
              <Divider />
              <ModalFooter>
                <Button
                  radius="sm"
                  onClick={onClose}
                  className="bg-transparent hover:bg-slate-100"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="w-[125px] bg-slate-950 text-white font-semibold"
                  radius="sm"
                >
                  Save
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default UpdateDataModal;

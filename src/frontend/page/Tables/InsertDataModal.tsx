import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Divider,
  ModalFooter,
  Button,
} from "@nextui-org/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import TextInput from "../../components/Inputs/TextInput";
import DatetimeInput from "../../components/Inputs/DatetimeInput";
import NumberInput from "../../components/Inputs/NumberInput";
import BoolInput from "../../components/Inputs/BoolInput";
import { useFormik } from "formik";
import { toast } from "react-toastify";
import axiosInstance from "../../pkg/axiosInstance";
import { Table } from "./Tables";
import RelationInput from "../../components/Inputs/RelationInput";
import { useEffect } from "react";

interface InsertDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: Table;
}

const InsertDataModal = ({ isOpen, onClose, table }: InsertDataModalProps) => {
  const { data: columns } = useQuery<any[]>({
    queryKey: ["columns", table.name, "insertion"],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/main/${table.name}/columns`, {
        params: {
          fetch_auth_column: table.is_auth,
        },
      });
      return res.data;
    },
  });

  const initialValues = columns?.reduce((acc, field) => {
    switch (field.type) {
      case "TEXT":
      case "DATETIME":
      case "TIMESTAMP":
        acc[field.name] = "";
        break;
      case "REAL":
      case "INTEGER":
        acc[field.name] = 0;
        break;
      case "BOOLEAN":
        acc[field.name] = false;
        break;
      default:
        acc[field.name] = "";
    }
    return acc;
  }, {});

  const renderInputField = (column: any, formik: any) => {
    switch (column.type) {
      case "TEXT":
        return (
          <TextInput
            id={column.name}
            name={column.name}
            isRequired={column.notnull === 0}
            key={column.name}
            label={column.name}
            onChange={formik.handleChange}
          />
        );
      case "REAL":
      case "INTEGER":
        return (
          <NumberInput
            id={column.name}
            name={column.name}
            isRequired={column.notnull === 0}
            key={column.name}
            label={column.name}
            onChange={formik.handleChange}
          />
        );
      case "BOOLEAN":
        return (
          <BoolInput
            id={column.name}
            name={column.name}
            key={column.name}
            label={column.name}
            onChange={formik.handleChange}
          />
        );
      case "DATETIME":
      case "TIMESTAMP":
        return (
          <DatetimeInput
            id={column.name}
            name={column.name}
            isRequired={column.notnull === 0}
            key={column.name}
            label={column.name}
            onChange={formik.handleChange}
          />
        );
      case "RELATION":
        return (
          <RelationInput
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
      default:
        return (
          <TextInput
            id={column.name}
            name={column.name}
            isRequired={column.notnull === 0}
            key={column.name}
            label={column.name}
            onChange={formik.handleChange}
          />
        );
    }
  };

  const queryClient = useQueryClient();

  const { mutateAsync } = useMutation({
    mutationFn: async (data: any) => {
      if (table.is_auth) {
        const res = await axiosInstance.post(
          `/api/auth/register/${table.name}`,
          { data: data }
        );

        return res.data;
      }

      const res = await axiosInstance.post(`/api/main/${table.name}/insert`, {
        data: data,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.refetchQueries({
        queryKey: ["rows", table.name],
      });
      onClose();
    },
  });

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: initialValues,
    onSubmit: async (values) => {
      toast.promise(mutateAsync(values), {
        pending: "Inserting data...",
        success: "Data inserted successfully",
        error: "Error when inserting data",
      });
    },
  });

  useEffect(() => {
    console.log(formik.values);
  }, [formik]);

  return (
    <>
      <Modal radius="sm" size="2xl" isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <form onSubmit={formik.handleSubmit}>
            <ModalHeader className="font-normal">Insert Data</ModalHeader>
            <ModalBody className="mb-3">
              <div className="flex flex-col gap-4">
                {columns
                  ?.filter(
                    (f) =>
                      f.name !== "id" &&
                      f.name !== "created_at" &&
                      f.name !== "updated_at"
                  )
                  .map((column) => renderInputField(column, formik))}
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
                Insert
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </>
  );
};

export default InsertDataModal;

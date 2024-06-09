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
import axios from "axios";
import TextInput from "../../components/Inputs/TextInput";
import DatetimeInput from "../../components/Inputs/DatetimeInput";
import NumberInput from "../../components/Inputs/NumberInput";
import BoolInput from "../../components/Inputs/BoolInput";
import { useFormik } from "formik";
import { toast } from "react-toastify";

interface InsertDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableName: string;
}

const InsertDataModal = ({
  isOpen,
  onClose,
  tableName,
}: InsertDataModalProps) => {
  const { data: columns } = useQuery<any[]>({
    queryKey: ["columns", tableName],
    queryFn: async () => {
      const res = await axios.get(`/api/db/table/${tableName}/columns`);
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
            key={column.cid}
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
            key={column.cid}
            label={column.name}
            onChange={formik.handleChange}
          />
        );
      case "BOOLEAN":
        return (
          <BoolInput
            id={column.name}
            name={column.name}
            key={column.cid}
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
            key={column.cid}
            label={column.name}
            onChange={formik.handleChange}
          />
        );
      default:
        return (
          <TextInput
            id={column.name}
            name={column.name}
            isRequired={column.notnull === 0}
            key={column.cid}
            label={column.name}
            onChange={formik.handleChange}
          />
        );
    }
  };

  const queryClient = useQueryClient();

  const { mutateAsync } = useMutation({
    mutationFn: async (data: any) => {
      const res = await axios.post(`/api/db/table/insert`, {
        table_name: tableName,
        data: data,
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

  return (
    <>
      <Modal size="2xl" isOpen={isOpen} onClose={onClose}>
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

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Divider,
  ModalFooter,
  Button,
} from "@nextui-org/react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useFormik } from "formik";
import { toast } from "react-toastify";
import TextInput from "../../components/Inputs/TextInput";
import axiosInstance from "../../pkg/axiosInstance";

interface RegisterAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RegisterAdminModal = ({ isOpen, onClose }: RegisterAdminModalProps) => {
  const queryClient = useQueryClient();

  const { mutateAsync } = useMutation({
    mutationFn: async (data: any) => {
      const res = await axiosInstance.post(`/api/admin/register`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.refetchQueries({
        queryKey: ["admins"],
      });
      onClose();
    },
  });

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      email: "",
      password: "",
    },
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
      <Modal radius="sm" size="2xl" isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <form onSubmit={formik.handleSubmit}>
            <ModalHeader className="font-normal">Add New Admin</ModalHeader>
            <ModalBody className="mb-3">
              <div className="flex flex-col gap-4">
                <TextInput
                  id={"email"}
                  name={"email"}
                  isRequired
                  label={"Email"}
                  onChange={formik.handleChange as any}
                />
                <TextInput
                  id={"password"}
                  name={"password"}
                  isRequired
                  label={"Password"}
                  onChange={formik.handleChange as any}
                />
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
                Add Admin
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </>
  );
};

export default RegisterAdminModal;

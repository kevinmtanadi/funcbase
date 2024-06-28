import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  BreadcrumbItem,
  Breadcrumbs,
  Button,
} from "@nextui-org/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FaRegTrashAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import axiosInstance from "../../pkg/axiosInstance";

interface FunctionSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  functionName: string;
}

const FunctionSettingModal = ({
  isOpen,
  onClose,
  functionName,
}: FunctionSettingModalProps) => {
  const queryClient = useQueryClient();
  const { mutateAsync } = useMutation({
    mutationFn: () => {
      return axiosInstance.delete(`/api/function/${functionName}`);
    },
    onSuccess: () => {
      queryClient.refetchQueries({
        queryKey: ["functions"],
        type: "active",
      });
      onClose();
    },
  });

  const deleteFunction = () => {
    toast.promise(mutateAsync(), {
      pending: "Deleting function...",
      success: "Function deleted successfully",
      error: "Error when deleting function",
    });
  };

  return (
    <Modal radius="sm" size="2xl" isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>
          <Breadcrumbs
            size="lg"
            isDisabled
            separator="/"
            className="text-xl font-semibold"
          >
            <BreadcrumbItem>Function</BreadcrumbItem>
            <BreadcrumbItem>
              <p>{functionName}</p>
            </BreadcrumbItem>
          </Breadcrumbs>
        </ModalHeader>
        <ModalBody>
          <Button
            className="bg-transparent min-w-0 w-full p-0"
            onClick={() => deleteFunction()}
          >
            <div className="flex gap-2 justify-between w-full items-center">
              <p className="font-semibold text-red-500">Delete</p>
              <FaRegTrashAlt className="text-red-500" />
            </div>
          </Button>
        </ModalBody>
        <ModalFooter></ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default FunctionSettingModal;

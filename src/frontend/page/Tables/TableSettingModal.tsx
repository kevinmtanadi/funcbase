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
import axios from "axios";
import { FaRegTrashAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import axiosInstance from "../../pkg/axiosInstance";

interface TableSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableName: string;
}

const TableSettingModal = ({
  isOpen,
  onClose,
  tableName,
}: TableSettingModalProps) => {
  const queryClient = useQueryClient();
  const { mutateAsync } = useMutation({
    mutationFn: () => {
      return axiosInstance.delete(`/api/db/table/${tableName}`);
    },
    onSuccess: () => {
      queryClient.refetchQueries({
        queryKey: ["tables"],
        type: "active",
      });
      onClose();
    },
  });

  const deleteTable = () => {
    toast.promise(mutateAsync(), {
      pending: "Deleting table...",
      success: "Table deleted successfully",
      error: "Error when deleting table",
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
            <BreadcrumbItem>Table</BreadcrumbItem>
            <BreadcrumbItem>
              <p>{tableName}</p>
            </BreadcrumbItem>
          </Breadcrumbs>
        </ModalHeader>
        <ModalBody>
          <Button
            className="bg-transparent min-w-0 w-full p-0"
            onClick={() => deleteTable()}
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

export default TableSettingModal;

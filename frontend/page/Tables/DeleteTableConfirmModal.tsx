import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  CardBody,
  Divider,
} from "@nextui-org/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import axiosInstance from "../../pkg/axiosInstance";

interface DeleteTableConfirmModalProps {
  table: string;
  onClose: () => void;
  isOpen: boolean;
  onDelete: () => void;
}
const DeleteTableConfirmModal = ({
  table,
  onClose,
  isOpen,
  onDelete,
}: DeleteTableConfirmModalProps) => {
  const queryClient = useQueryClient();
  const { mutateAsync } = useMutation({
    mutationFn: () => {
      return axiosInstance.delete(`/api/main/${table}`);
    },
    onSuccess: () => {
      queryClient.refetchQueries({
        queryKey: ["tables"],
        type: "active",
      });
      onDelete();
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
    <Modal id="del-table" size="md" isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>Delete table {table}</ModalHeader>
        <ModalBody>
          <Card radius="sm" className="bg-red-100">
            <CardBody>
              <div className="flex flex-col gap-3">
                <p className="text-sm text-center">
                  Are you sure you want to delete this table?
                </p>
                <p className="text-sm text-center font-semibold">{table}</p>
                <Divider />
                <b className="text-sm text-center">
                  Note: This action cannot be reversed.
                </b>
              </div>
            </CardBody>
          </Card>
        </ModalBody>
        <ModalFooter>
          <Button
            fullWidth
            className="rounded-md w-full bg-transparent hover:bg-default-200  font-semibold"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            fullWidth
            className="rounded-md w-full bg-slate-950 text-white font-semibold"
            onClick={deleteTable}
          >
            Delete Table
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DeleteTableConfirmModal;

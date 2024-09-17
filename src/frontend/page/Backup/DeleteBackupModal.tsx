import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Card,
  CardBody,
  Divider,
  ModalFooter,
  Button,
} from "@nextui-org/react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import axiosInstance from "../../pkg/axiosInstance";

interface DeleteBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  filename: string;
}
const DeleteBackupModal = ({
  isOpen,
  onClose,
  filename,
}: DeleteBackupModalProps) => {
  const queryClient = useQueryClient();
  const { mutateAsync } = useMutation({
    mutationFn: async (filename: string) => {
      const res = await axiosInstance.delete(`/api/main/backup/${filename}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.refetchQueries({
        queryKey: ["backups"],
      });
      onClose();
    },
  });

  const deleteBackup = () => {
    toast.promise(mutateAsync(filename), {
      pending: "Deleting backup...",
      success: "Backup deleted successfully",
      error: "Error when deleting data",
    });
  };

  return (
    <Modal radius="sm" isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>
          <h1>Delete Backup Data</h1>
        </ModalHeader>
        <ModalBody>
          <Card radius="sm" className="bg-red-100">
            <CardBody>
              <div className="flex flex-col gap-3">
                <p className="text-sm text-center font-semibold">{filename}</p>
                <p className="text-sm text-center">
                  Are you sure you want to delete this backup?
                </p>
                <Divider />
                <b className="text-sm text-center">
                  Note: This action cannot be reversed.
                </b>
              </div>
            </CardBody>
          </Card>
        </ModalBody>
        <ModalFooter>
          <div className="flex justify-between w-full gap-3">
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
              onClick={deleteBackup}
            >
              Delete
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DeleteBackupModal;

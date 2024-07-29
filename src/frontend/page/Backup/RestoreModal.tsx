import {
  Button,
  Card,
  CardBody,
  Divider,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@nextui-org/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../pkg/axiosInstance";
import { toast } from "react-toastify";

interface RestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  filename: string;
}

const RestoreModal = ({ isOpen, onClose, filename }: RestoreModalProps) => {
  const queryClient = useQueryClient();
  const { mutateAsync } = useMutation({
    mutationFn: async (filename: string) => {
      const res = await axiosInstance.post(`/api/main/restore/${filename}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.refetchQueries({});
      onClose();
    },
  });

  const restoreData = () => {
    toast.promise(mutateAsync(filename), {
      pending: "Restoring data...",
      success: "Data restored successfully",
      error: "Error when restoring data",
    });
  };

  return (
    <Modal radius="sm" isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>
          <h1>Restore Backup Data</h1>
        </ModalHeader>
        <ModalBody>
          <Card radius="sm" className="bg-warning-100">
            <CardBody>
              <div className="flex flex-col gap-3">
                <p className="text-sm text-center">
                  Are you sure you want to restore this backup? Current data
                  will be replaced with the selected backup.
                </p>
                <Divider />
                <b className="text-sm text-center">
                  Note: It is recommended to back up your data before performing
                  this action.
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
              onClick={restoreData}
            >
              Restore
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default RestoreModal;

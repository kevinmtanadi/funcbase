import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Card,
  CardBody,
  ModalFooter,
  Button,
} from "@nextui-org/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import axiosInstance from "../../pkg/axiosInstance";

interface BackupConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BackupConfirmationModal = ({
  isOpen,
  onClose,
}: BackupConfirmationModalProps) => {
  const queryClient = useQueryClient();

  const { mutateAsync } = useMutation({
    mutationFn: async () => {
      const res = await axiosInstance.post(`/api/main/backup`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backups"] });
    },
  });

  const backup = async () => {
    toast.promise(mutateAsync(), {
      pending: "Backing up data...",
      success: "Data backed up successfully",
      error: "Error when backing up data",
    });
  };

  return (
    <Modal radius="sm" isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>
          <h1>Backup Data</h1>
        </ModalHeader>
        <ModalBody>
          <Card radius="sm" className="bg-warning-100">
            <CardBody>
              <div className="flex flex-col gap-3">
                <p className="text-sm text-center">
                  <b>WARNING: </b>Backing up data might stop the database from
                  working for a while.
                </p>
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
              onClick={() => {
                backup();
                onClose();
              }}
            >
              Backup
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default BackupConfirmationModal;

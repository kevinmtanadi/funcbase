import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@nextui-org/react";
import { Field } from "./CreateTableModal";
import { useState } from "react";
import { Index } from "./CreateIndexModal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  fields: Field[];
  idx: number;
  index: Index;
  onUpdate: (idx: number, index: Index) => void;
  onDelete: (idx: number) => void;
}

const UpdateIndexModal = ({
  isOpen,
  onClose,
  fields,
  idx,
  index,
  onUpdate,
  onDelete,
}: Props) => {
  if (!index) return;

  const [tempIndex, setTempIndex] = useState<Index>(index);
  const addOrRemoveIndex = (field: Field) => {
    if (tempIndex.indexes.includes(field.id)) {
      setTempIndex({
        ...tempIndex,
        indexes: tempIndex.indexes.filter((f) => f !== field.id),
      });
    } else {
      setTempIndex({ ...tempIndex, indexes: [...tempIndex.indexes, field.id] });
    }
  };

  return (
    <Modal id="create-idx" size="md" isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>Update Index</ModalHeader>
        <ModalBody>
          <Input
            label="Index Name"
            value={tempIndex.name}
            onChange={(e) => setTempIndex({ ...index, name: e.target.value })}
          />
          <div className="flex gap-2">
            {fields.map((field, i) => (
              <Button
                key={i}
                variant="bordered"
                endContent={
                  tempIndex.indexes.includes(field.id) ? <span>✓</span> : ""
                }
                onClick={() => addOrRemoveIndex(field)}
              >
                {field.name}
              </Button>
            ))}
          </div>
        </ModalBody>
        <ModalFooter>
          <div className="w-full flex justify-between">
            <Button
              className="rounded-md bg-red-500 text-white"
              onClick={() => {
                onDelete(idx);
                onClose();
              }}
            >
              Delete
            </Button>
            <Button
              className="rounded-md bg-slate-950 text-white"
              onClick={() => {
                onUpdate(idx, tempIndex);
                onClose();
              }}
            >
              Update
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default UpdateIndexModal;

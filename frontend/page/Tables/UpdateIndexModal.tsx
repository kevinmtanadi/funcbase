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

interface Props {
  isOpen: boolean;
  onClose: () => void;
  fields: Field[];
  idx: number;
  index: Index;
  onUpdate: (idx: number, index: Index) => void;
}

export interface Index {
  name: string;
  fields: string[];
}

const UpdateIndexModal = ({
  isOpen,
  onClose,
  fields,
  idx,
  index,
  onUpdate,
}: Props) => {
  if (!index) return;

  const [tempIndex, setTempIndex] = useState<Index>(index);
  const addOrRemoveIndex = (field: Field) => {
    if (tempIndex.fields.includes(field.id)) {
      setTempIndex({
        ...tempIndex,
        fields: tempIndex.fields.filter((f) => f !== field.id),
      });
    } else {
      setTempIndex({ ...tempIndex, fields: [...tempIndex.fields, field.id] });
    }
  };

  return (
    <Modal id="create-idx" size="md" isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>Add Index</ModalHeader>
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
                  tempIndex.fields.includes(field.id) ? <span>✓</span> : ""
                }
                onClick={() => addOrRemoveIndex(field)}
              >
                {field.field_name}
              </Button>
            ))}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            className="rounded-md bg-slate-950 text-white"
            onClick={() => {
              onUpdate(idx, tempIndex);
              onClose();
            }}
          >
            {idx > 0 ? "Update" : "Create"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default UpdateIndexModal;

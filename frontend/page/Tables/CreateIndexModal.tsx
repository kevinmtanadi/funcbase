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
import { useEffect, useState } from "react";
import { generateRandomString } from "../../utils/utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  fields: Field[];
  onAdd: (index: Index) => void;
}

export interface Index {
  name: string;
  indexes: string[];
}

const CreateIndexModal = ({ isOpen, onClose, fields, onAdd }: Props) => {
  const [index, setIndex] = useState<Index>({
    name: "idx_" + generateRandomString(12),
    indexes: [],
  });

  useEffect(() => {
    setIndex({
      name: "idx_" + generateRandomString(12),
      indexes: [],
    });
  }, [isOpen]);

  const addOrRemoveIndex = (field: Field) => {
    if (index.indexes.includes(field.id)) {
      setIndex({
        ...index,
        indexes: index.indexes.filter((f) => f !== field.id),
      });
    } else {
      setIndex({ ...index, indexes: [...index.indexes, field.id] });
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal id="create-idx" size="md" isOpen={isOpen} onClose={handleClose}>
      <ModalContent>
        <ModalHeader>Add Index</ModalHeader>
        <ModalBody>
          <Input
            label="Index Name"
            value={index.name}
            onChange={(e) =>
              setIndex({
                ...index,
                name: e.target.value,
              })
            }
          />
          <div className="flex gap-2">
            {fields.map((field, i) => (
              <Button
                key={i}
                variant="bordered"
                endContent={
                  index.indexes.includes(field.id) ? <span>✓</span> : ""
                }
                onClick={() => addOrRemoveIndex(field)}
              >
                {field.name}
              </Button>
            ))}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            className="rounded-md bg-slate-950 text-white"
            onClick={() => {
              onAdd(index);
              handleClose();
            }}
            isDisabled={index.name === "" || index.indexes.length === 0}
          >
            Create
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateIndexModal;

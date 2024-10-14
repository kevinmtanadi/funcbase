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
  onAdd: (index: Index) => void;
}

export interface Index {
  name: string;
  fields: string[];
}

const CreateIndexModal = ({ isOpen, onClose, fields, onAdd }: Props) => {
  const [index, setIndex] = useState<Index>({
    name: "",
    fields: [],
  });

  const addOrRemoveIndex = (field: Field) => {
    if (index.fields.includes(field.id)) {
      setIndex({
        ...index,
        fields: index.fields.filter((f) => f !== field.id),
      });
    } else {
      setIndex({ ...index, fields: [...index.fields, field.id] });
    }
  };

  const handleClose = () => {
    setIndex({
      name: "",
      fields: [],
    });
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
                  index.fields.includes(field.id) ? <span>✓</span> : ""
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
              onAdd(index);
              handleClose();
            }}
            isDisabled={index.name === "" || index.fields.length === 0}
          >
            Create
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateIndexModal;

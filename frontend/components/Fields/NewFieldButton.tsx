import { Accordion, AccordionItem, Divider, Button } from "@nextui-org/react";
import { datatypes } from "../../data/datatypes";

interface Props {
  onAdd: (type: string) => void;
  isLoading?: boolean;
  isDisabled?: boolean;
}
const NewFieldButton = ({ onAdd, isLoading, isDisabled }: Props) => {
  return (
    <Accordion className="rounded-md" variant="bordered">
      <AccordionItem
        classNames={{
          title: "w-full text-center text-md font-semibold",
          trigger: "py-3 rounded-none",
        }}
        className="text-center font-semibold rounded-none"
        key="1"
        title="Add new field"
      >
        <Divider className="" />
        <div className="grid grid-cols-3 w-full gap-2 mt-3">
          {datatypes.map((dtype, idx) =>
            dtype.dtype === "RELATION" ? (
              <Button
                key={idx}
                isDisabled={isDisabled}
                isLoading={isLoading}
                startContent={dtype.icon}
                onClick={() => onAdd(dtype.value)}
                className="hover:bg-slate-200 bg-transparent rounded-md"
              >
                {dtype.label}
              </Button>
            ) : (
              <Button
                key={idx}
                startContent={dtype.icon}
                onClick={() => onAdd(dtype.value)}
                className="hover:bg-slate-200 bg-transparent rounded-md"
              >
                {dtype.label}
              </Button>
            )
          )}
        </div>
      </AccordionItem>
    </Accordion>
  );
};

export default NewFieldButton;

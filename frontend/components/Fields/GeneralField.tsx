import {
  Button,
  cn,
  Divider,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Switch,
} from "@nextui-org/react";
import { Field } from "../../page/Tables/CreateTableModal";
import { LuSettings } from "react-icons/lu";
import { FaRegTrashAlt } from "react-icons/fa";

interface GeneralFieldProps {
  field: Field;
  onChange: (field: Field) => void;
  onDelete: (idx: number) => void;
  idx: number;
  icon?: React.ReactNode;
  isDisabled?: boolean;
}
const GeneralField = ({
  field,
  onChange,
  onDelete,
  idx,
  icon,
  isDisabled,
}: GeneralFieldProps) => {
  return (
    <div className="flex border-2 rounded-md bg-default-100">
      <Input
        isDisabled={isDisabled}
        value={field.name}
        variant="flat"
        classNames={{
          inputWrapper:
            "bg-transparent rounded-l-md rounded-r-none border-r-none",
          label: "text-sm",
        }}
        onValueChange={(value) => {
          onChange({ ...field, name: value });
        }}
        size="sm"
        fullWidth
        labelPlacement="inside"
        label={
          <div className="flex gap-2 items-center">
            {icon}
            <div className="flex items-center">
              <p>Field name</p>
            </div>
          </div>
        }
        type="text"
      />
      <Popover className="text-xs" placement="bottom-end">
        <PopoverTrigger>
          <Button
            isDisabled={isDisabled}
            size="lg"
            variant="flat"
            className="w-[50px] p-0 min-w-0 bg-transparent rounded-l-none rounded-r-md hover:bg-default-200"
          >
            <LuSettings fontSize={"1.25rem"} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="text-xs rounded-md">
          <div className=" flex w-[150px] flex-col items-start gap-2">
            <div className="w-full px-2 pt-2">
              <div className="flex w-full py-1 justify-between items-center">
                <p className="font-semibold text-sm">Unique</p>
                <Switch
                  classNames={{
                    base: cn(
                      "left-3",
                      "inline-flex flex-row-reverse",
                      "max-w-md bg-content1",
                      "cursor-pointer rounded-g gap-2 border-2 border-transparent"
                    ),
                    wrapper: "p-0 h-3 overflow-visible w-7",
                    thumb: cn(
                      "w-3 h-5 border-2 shadow-lg",
                      //selected
                      "group-data-[selected=true]:ml-4",
                      // pressed
                      "group-data-[pressed=true]:w-4",
                      "group-data-[selected]:group-data-[pressed]:ml-4"
                    ),
                    label: "text-sm font-semibold",
                  }}
                  onChange={(e) => {
                    onChange({ ...field, unique: e.target.checked });
                  }}
                  checked={field.unique}
                  isSelected={field.unique}
                />
              </div>
            </div>
            <div className="w-full px-2 pt-2">
              <div className="flex w-full py-1 justify-between items-center">
                <p className="font-semibold text-sm">Nullable</p>
                <Switch
                  classNames={{
                    base: cn(
                      "left-3",
                      "inline-flex flex-row-reverse",
                      "max-w-md bg-content1",
                      "cursor-pointer rounded-g gap-2 border-2 border-transparent"
                    ),
                    wrapper: "p-0 h-3 overflow-visible w-7",
                    thumb: cn(
                      "w-3 h-5 border-2 shadow-lg",
                      //selected
                      "group-data-[selected=true]:ml-4",
                      // pressed
                      "group-data-[pressed=true]:w-4",
                      "group-data-[selected]:group-data-[pressed]:ml-4"
                    ),
                    label: "text-sm font-semibold",
                  }}
                  onChange={(e) => {
                    onChange({ ...field, nullable: e.target.checked });
                  }}
                  checked={field.nullable}
                  isSelected={field.nullable}
                />
              </div>
            </div>

            <Divider />
            <div className="w-full px-2">
              <Button
                className="bg-transparent min-w-0 w-full p-0"
                onClick={() => onDelete(idx)}
              >
                <div className="flex gap-2 justify-between w-full items-center">
                  <p className="font-semibold text-red-500">Delete</p>
                  <FaRegTrashAlt className="text-red-500" />
                </div>
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default GeneralField;

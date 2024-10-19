import {
  Autocomplete,
  AutocompleteItem,
  Button,
  cn,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Switch,
} from "@nextui-org/react";
import { Field } from "../../page/Tables/CreateTableModal";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { FaRegTrashAlt } from "react-icons/fa";
import { LuSettings } from "react-icons/lu";
import axiosInstance from "../../pkg/axiosInstance";

interface RelationFieldProps {
  field: Field;
  onChange: (field: Field) => void;
  onDelete: (idx: number) => void;
  idx: number;
  icon?: React.ReactNode;
}
const RelationField = ({
  field,
  onChange,
  onDelete,
  idx,
}: RelationFieldProps) => {
  const { data: tables, isLoading } = useQuery<{ name: string }[]>({
    queryKey: ["tables"],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/main/tables`);
      return res.data;
    },
  });

  if (!tables && !isLoading) {
    toast.error("No table exist yet");
    return;
  }

  return (
    <div className="flex items-center border-2 rounded-md bg-default-100">
      {tables && tables?.length > 0 && (
        <Autocomplete
          radius="none"
          className="bg-slate-500"
          size="sm"
          label="Related table"
          variant="flat"
          defaultItems={tables}
          classNames={{
            base: "min-w-xs",
          }}
          onSelectionChange={(value) => {
            if (!value) return;

            onChange({
              ...field,
              name: value.toString(),
              reference: value.toString(),
            });
          }}
        >
          {(table) => (
            <AutocompleteItem key={table.name}>{table.name}</AutocompleteItem>
          )}
        </Autocomplete>
      )}
      <Popover className="text-xs" placement="bottom-end">
        <PopoverTrigger>
          <Button
            size="lg"
            variant="flat"
            className="w-[50px] p-0 min-w-[50px] bg-transparent rounded-l-none rounded-r-md hover:bg-default-200"
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

export default RelationField;

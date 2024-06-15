import {
  Autocomplete,
  AutocompleteItem,
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@nextui-org/react";
import { Field } from "../../page/Tables/CreateTableModal";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-toastify";
import { FaRegTrashAlt } from "react-icons/fa";
import { LuSettings } from "react-icons/lu";

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
      const res = await axios.get(`/api/db/tables`);
      console.log(res.data);
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
              field_name: value.toString(),
              related_table: value.toString(),
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

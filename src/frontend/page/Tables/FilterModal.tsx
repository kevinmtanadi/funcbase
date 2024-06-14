import React, { SetStateAction, useEffect, useState } from "react";
import { FetchFilter } from "./TableData";
import {
  Autocomplete,
  AutocompleteItem,
  BreadcrumbItem,
  Breadcrumbs,
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
} from "@nextui-org/react";
import { FaPlus } from "react-icons/fa6";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { IoCloseSharp } from "react-icons/io5";
import { LuRefreshCcw, LuRefreshCw } from "react-icons/lu";

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FetchFilter[];
  setFilter: React.Dispatch<SetStateAction<FetchFilter[]>>;
  tableName: string;
}
const FilterModal = ({
  isOpen,
  onClose,
  filters,
  setFilter,
  tableName,
}: FilterModalProps) => {
  const addFilter = () => {
    setFilterTemp((prev) => [...prev, { column: "", operator: "", value: "" }]);
  };

  const refreshFilter = () => {
    setFilterTemp([]);
    setFilter([]);
  };

  const removeFilter = (idx: number) => {
    setFilterTemp((prev) => prev.filter((_, i) => i !== idx));
  };

  const { data: columns } = useQuery<any[]>({
    queryKey: ["columns", tableName],
    queryFn: async () => {
      const res = await axios.get(`/api/db/columns/${tableName}`);
      return res.data;
    },
  });

  const [filterTemp, setFilterTemp] = useState<FetchFilter[]>([]);

  useEffect(() => {
    if (filters.length > 0) {
      console.log(filters);
      setFilterTemp(filters);
    }
  }, [filters]);

  return (
    <Modal size="2xl" isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>
          <div className="flex items-center gap-3">
            <Breadcrumbs
              separator="/"
              size="lg"
              isDisabled
              className="text-lg px-1 font-semibold"
            >
              <BreadcrumbItem>Filters</BreadcrumbItem>
              <BreadcrumbItem>{tableName}</BreadcrumbItem>
            </Breadcrumbs>
            <Button
              onClick={refreshFilter}
              className="bg-transparent hover:bg-default-100 w-[30px] h-[30px] min-w-0 p-0"
            >
              <LuRefreshCw />
            </Button>
          </div>
        </ModalHeader>
        <ModalBody>
          <Button
            startContent={<FaPlus />}
            className="rounded-md w-full bg-slate-950 text-white font-semibold"
            fullWidth
            onClick={addFilter}
          >
            Add Filter
          </Button>
          {filterTemp.map((filter, idx) => (
            <div
              key={idx}
              className="flex items-center border-2 rounded-md bg-default-100"
            >
              <Select
                selectedKeys={[filter.column]}
                radius="none"
                className="bg-slate-500 h-full"
                size="sm"
                label="Column"
                variant="flat"
                items={columns}
                classNames={{
                  base: "min-w-xs",
                }}
                onChange={(e) => {
                  setFilterTemp((prev) => {
                    prev[idx].column = e.target.value;
                    return [...prev];
                  });
                }}
              >
                {(column) => (
                  <SelectItem key={column.name} value={column.name}>
                    {column.name}
                  </SelectItem>
                )}
              </Select>
              <Select
                selectedKeys={[filter.operator]}
                onChange={(e) => {
                  setFilterTemp((prev) => {
                    prev[idx].operator = e.target.value;
                    return [...prev];
                  });
                }}
                size="sm"
                label="Operator"
                radius="none"
              >
                <SelectItem key={"="} value="=">
                  Equals
                </SelectItem>
                <SelectItem key={"!="} value="!=">
                  Not Equals
                </SelectItem>
                <SelectItem key={"<"} value="<">
                  Less Than
                </SelectItem>
                <SelectItem key={">"} value=">">
                  Greater Than
                </SelectItem>
                <SelectItem key={"<="} value="<=">
                  Less Than or Equals
                </SelectItem>
                <SelectItem key={">="} value=">=">
                  Greater Than or Equals
                </SelectItem>
                <SelectItem key={"sw"} value="sw">
                  Starts With
                </SelectItem>
                <SelectItem key={"ew"} value="ew">
                  Ends With
                </SelectItem>
                <SelectItem key={"contains"} value="contains">
                  Contains
                </SelectItem>
              </Select>
              <Input
                size="sm"
                label="Value"
                variant="flat"
                value={filter.value}
                classNames={{
                  inputWrapper: "bg-transparent rounded-none",
                  label: "text-sm",
                }}
                onValueChange={(value) => {
                  setFilterTemp((prev) => {
                    prev[idx].value = value;
                    return [...prev];
                  });
                }}
                type="text"
              />
              <Button
                onClick={() => removeFilter(idx)}
                size="lg"
                variant="flat"
                className="w-[30px] p-0 min-w-[30px] bg-transparent rounded-l-none rounded-r-md hover:bg-default-200"
              >
                <IoCloseSharp />
              </Button>
            </div>
          ))}
        </ModalBody>
        <ModalFooter>
          <Button
            radius="sm"
            onClick={onClose}
            className="bg-transparent hover:bg-slate-100"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="w-[125px] bg-slate-950 text-white font-semibold"
            radius="sm"
            onClick={() => {
              setFilter(filterTemp);
              onClose();
            }}
          >
            Set Filter
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default FilterModal;

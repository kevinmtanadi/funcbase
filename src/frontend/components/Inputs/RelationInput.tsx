import { Autocomplete, AutocompleteItem } from "@nextui-org/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { TbCirclesRelation } from "react-icons/tb";
import axiosInstance from "../../pkg/axiosInstance";

interface RelationInputProps {
  id?: string;
  name?: string;
  label: string;
  onChange: (value: string) => void;
  isRequired?: boolean;
  isDisabled?: boolean;
  relatedTable: string;
}
const RelationInput = ({
  id,
  name,
  label,
  onChange,
  isRequired,
  isDisabled,
  relatedTable,
}: RelationInputProps) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { data, isLoading } = useQuery<any[]>({
    queryKey: ["rows", relatedTable, searchQuery],
    queryFn: async () => {
      const { data } = await axiosInstance.post(
        `/api/main/${relatedTable}/rows`,
        {
          filters: [
            {
              column: "id",
              operator: "LIKE",
              value: `${searchQuery}%`,
            },
          ],
        }
      );
      return data;
    },
  });

  return (
    <Autocomplete
      id={id}
      name={name}
      isDisabled={isDisabled}
      isRequired={isRequired}
      fullWidth
      defaultItems={[]}
      inputValue={searchQuery}
      isLoading={isLoading}
      items={data}
      startContent={<TbCirclesRelation />}
      label={label}
      variant="bordered"
      onInputChange={(value) => {
        setSearchQuery(value);
        onChange(value);
      }}
    >
      {(item) => <AutocompleteItem key={item.id}>{item.id}</AutocompleteItem>}
    </Autocomplete>
  );
};

export default RelationInput;

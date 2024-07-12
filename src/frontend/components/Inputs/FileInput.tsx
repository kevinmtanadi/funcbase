interface FileInputProps {
  id?: string;
  name?: string;
  label: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  value?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
}
const FileInput = ({ id, name, value, onChange }: FileInputProps) => {
  return (
    <input type="file" id={id} name={name} value={value} onChange={onChange} />
  );
};

export default FileInput;

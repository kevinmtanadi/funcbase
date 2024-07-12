import {
  Table,
  TableHeader,
  TableColumn,
  Skeleton,
  TableBody,
  TableRow,
  TableCell,
  getKeyValue,
} from "@nextui-org/react";

interface QueryResultProps {
  rows: any[];
  columns: any[];
}

const QueryResult = ({ rows, columns }: QueryResultProps) => {
  if (columns.length === 0) {
    columns = [
      {
        cid: 0,
        name: "Column 1",
      },
      {
        cid: 1,
        name: "Column 2",
      },
      {
        cid: 2,
        name: "Column 3",
      },
    ];
  }

  return (
    <>
      <Table
        isHeaderSticky={true}
        classNames={{
          thead: "[&>tr]:first:rounded-none",
          th: [
            "text-default-500",
            "border-b",
            "rounded-none",
            "border-divider",
            "first:hover:bg-gray-100",
          ],
          tr: "[&>th]:first:rounded-none bg-white [&>th]:last:rounded-none border-b-1 rounded-none",
          td: [
            "group-data-[first=true]:first:before:rounded-none",
            "group-data-[first=true]:last:before:rounded-none",
            "group-data-[middle=true]:before:rounded-none",
            "group-data-[last=true]:first:before:rounded-none",
            "group-data-[last=true]:last:before:rounded-none",
            "py-2",
          ],
        }}
        removeWrapper
      >
        {columns && rows ? (
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn key={column.name}>{column.name}</TableColumn>
            )}
          </TableHeader>
        ) : (
          <TableHeader>
            <TableColumn>
              <Skeleton className="h-[22px] rounded-md" />
            </TableColumn>
            <TableColumn>
              <Skeleton className="h-[22px] rounded-md" />
            </TableColumn>
            <TableColumn>
              <Skeleton className="h-[22px] rounded-md" />
            </TableColumn>
          </TableHeader>
        )}

        <TableBody emptyContent="No records found" items={rows}>
          {(item) => (
            <TableRow key={item.id || item.cid}>
              {(columnKey) => (
                <TableCell key={columnKey}>
                  {getKeyValue(item, columnKey) || ""}
                </TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  );
};

export default QueryResult;

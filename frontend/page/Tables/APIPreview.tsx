import {
  Spinner,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tabs,
} from "@nextui-org/react";
import { useQuery } from "@tanstack/react-query";
import Drawer from "react-modern-drawer";
import "react-modern-drawer/dist/index.css";
import axiosInstance from "../../pkg/axiosInstance";
import APIMethod from "../../components/APIMethod";

interface APIPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  table: string;
  isAuth: boolean;
}

export function syntaxHighlight(json: any) {
  if (typeof json != "string") {
    json = JSON.stringify(json, undefined, 2);
  }

  json = json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return json.replace(
    /("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*?"(\s*:)?|\b(true|false|null)\b|\b-?\d+\.?\d*(?:[eE][+-]?\d+)?\b)/g,
    function (match: any) {
      let cls = "number"; // Default to number

      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = "key"; // JSON key
        } else {
          cls = "string"; // JSON string value
        }
      } else if (/true|false/.test(match)) {
        cls = "boolean"; // Boolean value
      }

      return `<span class="${cls}">${match}</span>`;
    }
  );
}

export const generateDummyResult = (dtype: string) => {
  switch (dtype.toLowerCase()) {
    case "TEXT":
    case "RELATION":
    case "string":
      return "example_string"; // For string and relation types
    case "DATETIME":
    case "TIMESTAMP":
      return "2024-01-01 13:47:29"; // For datetime or timestamp types
    case "INTEGER":
    case "REAL":
    case "number":
      return 17; // For other numbers
    default:
      return "example_string"; // Default to string if type is unknown
  }
};

const generateDummyJson = (columns: any[], single?: boolean) => {
  const dummyDataTemplate = {
    data: [] as { [key: string]: string | number }[],
    page: 1,
    page_size: 20,
    total_data: 0,
  };

  const dummyRow: { [key: string]: any } = {};

  for (let i = 1; i <= 2; i++) {
    columns.forEach((column: { name: string; type: string }) => {
      dummyRow[column.name] = generateDummyResult(column.type);
    });

    if (single) return dummyRow;
    dummyDataTemplate.data.push({ ...dummyRow });
  }

  // Add two dummy rows

  return dummyDataTemplate;
};

const APIPreview = ({ isOpen, onClose, table, isAuth }: APIPreviewProps) => {
  return (
    <Drawer size={"900px"} direction="right" open={isOpen} onClose={onClose}>
      {!isAuth ? (
        <GeneralPreview table={table} />
      ) : (
        <AuthPreview table={table} />
      )}
    </Drawer>
  );
};

interface PreviewProps {
  table: string;
}
const GeneralPreview = ({ table }: PreviewProps) => {
  return (
    <div className="flex flex-col m-5">
      <Tabs isVertical>
        <Tab
          key="fetch_single"
          className="w-full max-h-screen overflow-y-scroll scrollbar-hide"
          title="Fetch Single"
        >
          <FetchSinglePreview table={table} />
        </Tab>
        <Tab
          key="fetch"
          className="w-full max-h-screen overflow-y-scroll scrollbar-hide"
          title="Fetch"
        >
          <FetchPreview table={table} />
        </Tab>
        <Tab
          key="insert"
          title="Insert"
          className="w-full max-h-screen overflow-y-scroll scrollbar-hide"
        >
          <InsertPreview table={table} />
        </Tab>
        <Tab
          key="update"
          title="Update"
          className="w-full max-h-screen overflow-y-scroll scrollbar-hide"
        >
          <UpdatePreview table={table} />
        </Tab>
        <Tab
          key="delete"
          title="Delete"
          className="w-full max-h-screen overflow-y-scroll scrollbar-hide"
        >
          <DeletePreview table={table} />
        </Tab>
      </Tabs>
    </div>
  );
};

const FetchSinglePreview = ({ table }: PreviewProps) => {
  const { data: columns, isLoading } = useQuery({
    queryKey: ["columns", table],
    queryFn: async () => {
      if (!table || table === "") return [];
      const res = await axiosInstance.get(`/api/main/${table}/columns`);
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 pl-5 mb-10">
      <p className="text-lg font-semibold">Fetching Single Data / {table}</p>
      <p className="text-sm">Fetching single data by ID.</p>
      <div className="gap-2 flex flex-col">
        <p>API Details</p>
        <APIMethod
          className="w-full"
          method="GET"
          endpoint={
            <>
              <p>
                /api/main/<span className="font-semibold">{table}</span>/
                <span className="font-semibold">[id]</span>
              </p>
            </>
          }
        />
      </div>
      <div className="flex flex-col gap-2">
        <p>Path Parameters</p>
        <Table
          removeWrapper
          classNames={{
            table: "border",
            th: [
              "text-default-500",
              "border-divider",
              "hover:bg-slate-200",
              "first:hover:bg-gray-100",
            ],
            tr: "[&>th]:first:rounded-none [&>th]:last:rounded-none border-b-1 rounded-none",
            td: [
              "group-data-[first=true]:first:before:rounded-none",
              "group-data-[first=true]:last:before:rounded-none",
              "group-data-[middle=true]:before:rounded-none",
              "group-data-[last=true]:first:before:rounded-none",
              "group-data-[last=true]:last:before:rounded-none",
              "py-2",
            ],
          }}
        >
          <TableHeader>
            <TableColumn key="parameter">Parameter</TableColumn>
            <TableColumn key="type">Type</TableColumn>
            <TableColumn maxWidth={10} width={10} key="required">
              Required
            </TableColumn>
            <TableColumn key="description">Description</TableColumn>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>id</TableCell>
              <TableCell>integer</TableCell>
              <TableCell>
                <div className="bg-green-200 rounded-full text-center p-1 text-green-700">
                  yes
                </div>
              </TableCell>
              <TableCell>ID of the data to fetch</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col gap-3">
        <p>Responses</p>
        <div className="p-3 bg-slate-200 rounded-md w-full text-sm">
          <pre
            dangerouslySetInnerHTML={{
              __html: syntaxHighlight(
                JSON.stringify(generateDummyJson(columns, true), undefined, 4)
              ),
            }}
          ></pre>
        </div>
      </div>
    </div>
  );
};
const FetchPreview = ({ table }: PreviewProps) => {
  const { data: columns, isLoading } = useQuery({
    queryKey: ["columns", table],
    queryFn: async () => {
      if (!table || table === "") return [];
      const res = await axiosInstance.get(`/api/main/${table}/columns`);
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 pl-5 mb-10">
      <p className="text-lg font-semibold">Fetching Data / {table}</p>
      <p className="text-sm">
        Fetching paginated data, with support on filtering and sorting.
      </p>
      <div className="gap-2 flex flex-col">
        <p>API Details</p>
        <APIMethod
          className="w-full"
          method="GET"
          endpoint={
            <p>
              /api/main/<span className="font-semibold">{table}</span>/rows
            </p>
          }
        />
      </div>
      <div className="flex flex-col gap-2">
        <p>Query Parameters</p>
        <Table
          removeWrapper
          classNames={{
            table: "border",
            th: [
              "text-default-500",
              "border-divider",
              "hover:bg-slate-200",
              "first:hover:bg-gray-100",
            ],
            tr: "[&>th]:first:rounded-none [&>th]:last:rounded-none border-b-1 rounded-none",
            td: [
              "group-data-[first=true]:first:before:rounded-none",
              "group-data-[first=true]:last:before:rounded-none",
              "group-data-[middle=true]:before:rounded-none",
              "group-data-[last=true]:first:before:rounded-none",
              "group-data-[last=true]:last:before:rounded-none",
              "py-2",
            ],
          }}
        >
          <TableHeader>
            <TableColumn key="parameter">Parameter</TableColumn>
            <TableColumn key="type">Type</TableColumn>
            <TableColumn key="required">Required</TableColumn>
            <TableColumn key="description">Description</TableColumn>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>page</TableCell>
              <TableCell>integer</TableCell>
              <TableCell>
                <div className="bg-red-200 rounded-full text-center p-1 text-red-700">
                  no
                </div>
              </TableCell>
              <TableCell>Pagination page (default to 1)</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>page_size</TableCell>
              <TableCell>integer</TableCell>
              <TableCell>
                <div className="bg-red-200 rounded-full text-center p-1 text-red-700">
                  no
                </div>
              </TableCell>
              <TableCell>
                Number of data returned per page (default to 10)
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>sort</TableCell>
              <TableCell>string</TableCell>
              <TableCell>
                <div className="bg-red-200 rounded-full text-center p-1 text-red-700">
                  no
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-3">
                  <p>
                    Sorting strategy used when fetching data. It uses this
                    format for sorting : [
                    <span className="font-semibold">column_name</span>] [
                    <span className="font-semibold">ASC</span> |{" "}
                    <span className="font-semibold">DESC</span>]. Ex:
                  </p>

                  <div className="w-full bg-slate-200 px-3 py-2 rounded-md">
                    ?sort=id ASC
                  </div>
                </div>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>filter</TableCell>
              <TableCell>string</TableCell>
              <TableCell>
                <div className="bg-red-200 rounded-full text-center p-1 text-red-700">
                  no
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-3">
                  <p>
                    Filters used when fetching data. It can accept SQL query and
                    simple string. If it is given an SQL Query, it will simply
                    fetch datas with given query. For simple string, it will
                    search on all column for anything that contains this string.
                    Ex:
                  </p>
                  <div className="w-full bg-slate-200 px-3 py-2 rounded-md">
                    ?filter=id="7A40960BA55751BA"
                  </div>
                  <p>
                    will search on <span className="font-semibold">id</span>{" "}
                    with value{" "}
                    <span className="font-semibold">7A40960BA55751BA</span>
                  </p>
                  <div className="w-full bg-slate-200 px-3 py-2 rounded-md">
                    ?filter=7A40960BA55751BA
                  </div>
                  <p>
                    will search on all columns with value containing{" "}
                    <span className="font-semibold">7A40960BA55751BA</span>
                  </p>
                  <p>
                    You can also use stored JWT token to filter for logged user
                    by using the value{" "}
                    <span className="bg-slate-200 font-semibold px-1 py-0.5 rounded-md">
                      $user.id
                    </span>
                    . It will be automatically converted to the user's{" "}
                    <span className="font-semibold">id</span>
                  </p>
                  <div className="w-full bg-slate-200 px-3 py-2 rounded-md">
                    ?filter=users="$user.id"
                  </div>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col gap-3">
        <p>Responses</p>
        <div className="p-3 bg-slate-200 rounded-md w-full text-sm">
          <pre
            dangerouslySetInnerHTML={{
              __html: syntaxHighlight(
                JSON.stringify(generateDummyJson(columns), undefined, 4)
              ),
            }}
          ></pre>
        </div>
      </div>
    </div>
  );
};

function convertToJSDatatype(dtype: string) {
  switch (dtype.toLowerCase()) {
    case "integer":
    case "real":
      return "number";
    case "datetime":
    case "timestamp":
      return "date";
    case "text":
    case "relation":
      return "string";
    case "blob":
      return "file";
    default:
      return dtype;
  }
}

const InsertPreview = ({ table }: PreviewProps) => {
  const { data: columns, isLoading } = useQuery({
    queryKey: ["columns", table],
    queryFn: async () => {
      if (!table || table === "") return [];
      const res = await axiosInstance.get(`/api/main/${table}/columns`);
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 pl-5 mb-10">
      <p className="text-lg font-semibold">Registering / {table}</p>
      <div className="flex flex-col">
        <p className="text-sm">Insert a new data.</p>
        <p className="text-sm">
          {" "}
          Body parameters must be sent as{" "}
          <code className="bg-slate-200 p-1 rounded-md">
            multipart/form-data
          </code>
          .
        </p>
      </div>
      <div className="gap-2 flex flex-col">
        <p>API Details</p>
        <APIMethod
          className="w-full"
          method="POST"
          endpoint={
            <p>
              /api/main/<span className="font-semibold">{table}</span>/insert
            </p>
          }
        />
      </div>
      <div className="flex flex-col gap-2">
        <p>Body Parameters</p>
        <Table
          removeWrapper
          classNames={{
            table: "border",
            th: [
              "text-default-500",
              "border-divider",
              "hover:bg-slate-200",
              "first:hover:bg-gray-100",
            ],
            tr: "[&>th]:first:rounded-none [&>th]:last:rounded-none border-b-1 rounded-none",
            td: [
              "group-data-[first=true]:first:before:rounded-none",
              "group-data-[first=true]:last:before:rounded-none",
              "group-data-[middle=true]:before:rounded-none",
              "group-data-[last=true]:first:before:rounded-none",
              "group-data-[last=true]:last:before:rounded-none",
              "py-2",
            ],
          }}
        >
          <TableHeader>
            <TableColumn key="parameter">Parameter</TableColumn>
            <TableColumn key="type">Type</TableColumn>
            <TableColumn key="required">Required</TableColumn>
          </TableHeader>
          <TableBody>
            {columns
              ?.filter(
                (column: any) =>
                  column.name !== "id" &&
                  column.name !== "created_at" &&
                  column.name !== "updated_at"
              )
              .map((column: any) => (
                <TableRow key={column.name}>
                  <TableCell>{column.name}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-slate-200 rounded-full text-sm">
                      {convertToJSDatatype(column.type)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-sm ${
                        column.notnull ? "bg-green-200" : "bg-red-200"
                      }`}
                    >
                      {column.notnull ? "Yes" : "No"}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col gap-2">
        <p>Response</p>
        <div className="p-3 bg-slate-200 rounded-md w-full text-sm">
          <pre
            dangerouslySetInnerHTML={{
              __html: syntaxHighlight(
                JSON.stringify(
                  {
                    message: "success",
                  },
                  undefined,
                  4
                )
              ),
            }}
          ></pre>
        </div>
        <div className="p-3 bg-slate-200 rounded-md w-full text-sm">
          <pre
            dangerouslySetInnerHTML={{
              __html: syntaxHighlight(
                JSON.stringify(
                  {
                    error: "error message",
                  },
                  undefined,
                  4
                )
              ),
            }}
          ></pre>
        </div>
      </div>
    </div>
  );
};

const UpdatePreview = ({ table }: PreviewProps) => {
  const { data: columns, isLoading } = useQuery({
    queryKey: ["columns", table],
    queryFn: async () => {
      if (!table || table === "") return [];
      const res = await axiosInstance.get(`/api/main/${table}/columns`);
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 pl-5 mb-10">
      <p className="text-lg font-semibold">Updating Data / {table}</p>
      <div className="flex flex-col">
        <p className="text-sm">
          Update an existing data. It updates the data based on the given ID.
        </p>
        <p className="text-sm">
          {" "}
          Body parameters must be sent as{" "}
          <code className="bg-slate-200 p-1 rounded-md">
            multipart/form-data
          </code>
          .
        </p>
      </div>
      <div className="gap-2 flex flex-col">
        <p>API Details</p>
        <APIMethod
          className="w-full"
          method="PUT"
          endpoint={
            <p>
              /api/main/<span className="font-semibold">{table}</span>/update
            </p>
          }
        />
      </div>
      <div className="flex flex-col gap-2">
        <p>Body Parameters</p>
        <Table
          removeWrapper
          classNames={{
            table: "border",
            th: [
              "text-default-500",
              "border-divider",
              "hover:bg-slate-200",
              "first:hover:bg-gray-100",
            ],
            tr: "[&>th]:first:rounded-none [&>th]:last:rounded-none border-b-1 rounded-none",
            td: [
              "group-data-[first=true]:first:before:rounded-none",
              "group-data-[first=true]:last:before:rounded-none",
              "group-data-[middle=true]:before:rounded-none",
              "group-data-[last=true]:first:before:rounded-none",
              "group-data-[last=true]:last:before:rounded-none",
              "py-2",
            ],
          }}
        >
          <TableHeader>
            <TableColumn key="parameter">Parameter</TableColumn>
            <TableColumn key="type">Type</TableColumn>
            <TableColumn key="required">Required</TableColumn>
          </TableHeader>
          <TableBody>
            {columns
              ?.filter(
                (c: any) => c.name !== "created_at" && c.name !== "updated_at"
              )
              .map((column: any) => (
                <TableRow key={column.name}>
                  <TableCell>{column.name}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-slate-200 rounded-full text-sm">
                      {convertToJSDatatype(column.type)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-sm ${
                        column.pk === 1 ? "bg-green-200" : "bg-red-200"
                      }`}
                    >
                      {column.pk === 1 ? "Yes" : "No"}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col gap-2">
        <p>Response</p>
        <div className="p-3 bg-slate-200 rounded-md w-full text-sm">
          <pre
            dangerouslySetInnerHTML={{
              __html: syntaxHighlight(
                JSON.stringify(
                  {
                    message: "success",
                  },
                  undefined,
                  4
                )
              ),
            }}
          ></pre>
        </div>
        <div className="p-3 bg-slate-200 rounded-md w-full text-sm">
          <pre
            dangerouslySetInnerHTML={{
              __html: syntaxHighlight(
                JSON.stringify(
                  {
                    error: "error message",
                  },
                  undefined,
                  4
                )
              ),
            }}
          ></pre>
        </div>
      </div>
    </div>
  );
};

const DeletePreview = ({ table }: PreviewProps) => {
  return (
    <div className="flex flex-col gap-3 pl-5 mb-10">
      <p className="text-lg font-semibold">Deleting Data / {table}</p>
      <div className="flex flex-col">
        <p className="text-sm">
          Deletes an existing data. It deletes the data based on the given ID.
        </p>
      </div>
      <div className="gap-2 flex flex-col">
        <p>API Details</p>
        <APIMethod
          className="w-full"
          method="DELETE"
          endpoint={
            <p>
              /api/main/<span className="font-semibold">{table}</span>/rows
            </p>
          }
        />
      </div>
      <div className="flex flex-col gap-2">
        <p>Body Parameters</p>
        <Table
          removeWrapper
          classNames={{
            table: "border",
            th: [
              "text-default-500",
              "border-divider",
              "hover:bg-slate-200",
              "first:hover:bg-gray-100",
            ],
            tr: "[&>th]:first:rounded-none [&>th]:last:rounded-none border-b-1 rounded-none",
            td: [
              "group-data-[first=true]:first:before:rounded-none",
              "group-data-[first=true]:last:before:rounded-none",
              "group-data-[middle=true]:before:rounded-none",
              "group-data-[last=true]:first:before:rounded-none",
              "group-data-[last=true]:last:before:rounded-none",
              "py-2",
            ],
          }}
        >
          <TableHeader>
            <TableColumn key="parameter">Parameter</TableColumn>
            <TableColumn key="type">Type</TableColumn>
            <TableColumn key="required">Required</TableColumn>
          </TableHeader>
          <TableBody>
            <TableRow key={0}>
              <TableCell>id</TableCell>
              <TableCell>
                <span className="px-2 py-1 bg-slate-200 rounded-full text-sm">
                  number
                </span>
              </TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 rounded-full text-sm ${
                    true ? "bg-green-200" : "bg-red-200"
                  }`}
                >
                  true
                </span>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col gap-2">
        <p>Response</p>
        <div className="p-3 bg-slate-200 rounded-md w-full text-sm">
          <pre
            dangerouslySetInnerHTML={{
              __html: syntaxHighlight(
                JSON.stringify(
                  {
                    message: "success",
                  },
                  undefined,
                  4
                )
              ),
            }}
          ></pre>
        </div>
        <div className="p-3 bg-slate-200 rounded-md w-full text-sm">
          <pre
            dangerouslySetInnerHTML={{
              __html: syntaxHighlight(
                JSON.stringify(
                  {
                    error: "error message",
                  },
                  undefined,
                  4
                )
              ),
            }}
          ></pre>
        </div>
      </div>
    </div>
  );
};

const AuthPreview = ({ table }: PreviewProps) => {
  return (
    <div className="flex flex-col m-5">
      <Tabs isVertical>
        <Tab
          key="register"
          className="w-full max-h-screen overflow-y-scroll scrollbar-hide"
          title="Register"
        >
          <RegisterPreview table={table} />
        </Tab>
        <Tab
          key="fetch"
          className="w-full max-h-screen overflow-y-scroll scrollbar-hide"
          title="Fetch"
        >
          <FetchPreview table={table} />
        </Tab>
        <Tab
          key="insert"
          title="Insert"
          className="w-full max-h-screen overflow-y-scroll scrollbar-hide"
        >
          <InsertPreview table={table} />
        </Tab>
        <Tab
          key="update"
          title="Update"
          className="w-full max-h-screen overflow-y-scroll scrollbar-hide"
        >
          <UpdatePreview table={table} />
        </Tab>
        <Tab
          key="delete"
          title="Delete"
          className="w-full max-h-screen overflow-y-scroll scrollbar-hide"
        >
          <DeletePreview table={table} />
        </Tab>
      </Tabs>
    </div>
  );
};

function convertToTypeObject(columns: any[]): {
  [key: string]: string;
} {
  return columns.reduce((acc, column) => {
    const tsType = convertToJSDatatype(column.type) || "any";
    acc[column.name] = tsType;
    return acc;
  }, {} as { [key: string]: string });
}

const RegisterPreview = ({ table }: PreviewProps) => {
  const { data: columns, isLoading } = useQuery({
    queryKey: ["columns", table],
    queryFn: async () => {
      if (!table || table === "") return [];
      const res = await axiosInstance.get(`/api/main/${table}/columns`);
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 pl-5 mb-10">
      <p className="text-lg font-semibold">Register User / {table}</p>
      <div className="flex flex-col">
        <p className="text-sm">
          Create a new user. Can return a JWT Token to be stored for later API
          calls.
        </p>
        <p className="text-sm">
          {" "}
          Body parameters must be sent as{" "}
          <code className="bg-slate-200 p-1 rounded-md">application/json</code>.
        </p>
      </div>
      <div className="gap-2 flex flex-col">
        <p>API Details</p>
        <APIMethod
          className="w-full"
          method="POST"
          endpoint={
            <p>
              /api/auth/<span className="font-semibold">{table}</span>/register
            </p>
          }
        />
      </div>
      <div className="flex flex-col gap-2">
        <p>Body Parameters</p>
        <Table
          removeWrapper
          classNames={{
            table: "border",
            th: [
              "text-default-500",
              "border-divider",
              "hover:bg-slate-200",
              "first:hover:bg-gray-100",
            ],
            tr: "[&>th]:first:rounded-none [&>th]:last:rounded-none border-b-1 rounded-none",
            td: [
              "group-data-[first=true]:first:before:rounded-none",
              "group-data-[first=true]:last:before:rounded-none",
              "group-data-[middle=true]:before:rounded-none",
              "group-data-[last=true]:first:before:rounded-none",
              "group-data-[last=true]:last:before:rounded-none",
              "py-2",
            ],
          }}
        >
          <TableHeader>
            <TableColumn key="parameter">Parameter</TableColumn>
            <TableColumn key="type">Type</TableColumn>
            <TableColumn key="required">Required</TableColumn>
            <TableColumn key="required">Description</TableColumn>
          </TableHeader>
          <TableBody>
            <TableRow key={"data"}>
              <TableCell>data</TableCell>
              <TableCell>object</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-sm bg-green-200`}>
                  Yes
                </span>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-2">
                  <p>Data of the user</p>
                  <pre
                    dangerouslySetInnerHTML={{
                      __html: syntaxHighlight(
                        JSON.stringify(
                          convertToTypeObject(
                            columns.filter(
                              (col: any) =>
                                col.name !== "id" &&
                                col.name !== "salt" &&
                                col.name !== "created_at" &&
                                col.name !== "updated_at"
                            ) || []
                          ),
                          undefined,
                          4
                        )
                      ),
                    }}
                  ></pre>
                </div>
              </TableCell>
            </TableRow>
            <TableRow key={"returns_token"}>
              <TableCell>returns_token</TableCell>
              <TableCell>boolean</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-sm bg-green-200`}>
                  Yes
                </span>
              </TableCell>
              <TableCell>
                Whether the server should return a JWT token on the response
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col gap-2">
        <p>Response</p>
        <Tabs>
          <Tab key="returns-token" title="Returns Token">
            <div className="p-3 bg-slate-200 rounded-md w-full text-sm">
              <pre
                className="break-words whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html: syntaxHighlight(
                    JSON.stringify(
                      {
                        message: "success",
                        token: "JWT-TOKEN",
                      },
                      undefined,
                      4
                    )
                  ),
                }}
              ></pre>
            </div>
          </Tab>
          <Tab key="no-token" title="No Token">
            <div className="p-3 bg-slate-200 rounded-md w-full text-sm">
              <pre
                className="break-words whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html: syntaxHighlight(
                    JSON.stringify(
                      {
                        message: "success",
                      },
                      undefined,
                      4
                    )
                  ),
                }}
              ></pre>
            </div>
          </Tab>
        </Tabs>

        <div className="p-3 bg-slate-200 rounded-md w-full text-sm">
          <pre
            dangerouslySetInnerHTML={{
              __html: syntaxHighlight(
                JSON.stringify(
                  {
                    error: "error message",
                  },
                  undefined,
                  4
                )
              ),
            }}
          ></pre>
        </div>
      </div>
    </div>
  );
};

export default APIPreview;

import axiosInstance from "../pkg/axiosInstance";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Button, Card, CardBody } from "@nextui-org/react";

const fetchRows = async (page: number, table: string) => {
  const res = await axiosInstance.get(`/api/main/${table}/rows`, {
    params: {
      page: page,
      page_size: 2,
    },
  });

  return res.data;
};

const Test = () => {
  const { data, fetchNextPage, isFetchingNextPage, hasNextPage, error } =
    useInfiniteQuery({
      queryKey: ["rows", "users"],
      queryFn: ({ pageParam }) => fetchRows(pageParam, "users"),
      initialPageParam: 1,
      getNextPageParam: (lastPage) => {
        const totalPage = lastPage.total_data;
        const pageSize = lastPage.page_size;
        const currentPage = lastPage.page;
        return totalPage > pageSize * currentPage ? currentPage + 1 : undefined;
      },
    });

  console.log(hasNextPage);

  const users = data?.pages.flatMap((page) => page.data);

  return (
    <div>
      <p>Users</p>
      {error && (
        <p>
          Something went wrong:{" "}
          <span className="text-red-500">{error.message}</span>
        </p>
      )}
      {users?.map((user) => (
        <Card>
          <CardBody>
            <p>{user.name}</p>
          </CardBody>
        </Card>
      ))}
      {isFetchingNextPage && <p>Loading...</p>}
      <Button onClick={() => fetchNextPage()}>Load More</Button>
    </div>
  );
};

export default Test;

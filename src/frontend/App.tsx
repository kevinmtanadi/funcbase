import { Card, CardBody } from "@nextui-org/react";
import { useState } from "react";

function App() {
  const [message, setMessage] = useState("");

  fetch("/api/hello")
    .then((res) => res.json())
    .then((data) => setMessage(data.message));

  return (
    <>
      <div className="min-h-screen w-full flex gap-4 flex-col justify-center items-center">
        <h1 className="text-3xl font-bold">
          React with NextUI + Golang backend ready to use
        </h1>
        <Card>
          <CardBody>
            <p className="text-xl font-semibold"> The backend says {message}</p>
          </CardBody>
        </Card>
      </div>
    </>
  );
}

export default App;

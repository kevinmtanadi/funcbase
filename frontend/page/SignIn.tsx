import { Button, Card, CardBody, CardHeader, Input } from "@nextui-org/react";
import { useMutation } from "@tanstack/react-query";
import { Formik } from "formik";
import { useState } from "react";
import useSignIn from "react-auth-kit/hooks/useSignIn";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";
import axiosInstance from "../pkg/axiosInstance";

interface LoginData {
  email: string;
  password: string;
}

const loginDataSchema = Yup.object({
  email: Yup.string().email("Email is not valid").required("Email is required"),
  password: Yup.string().required("Password is required"),
});

const SignIn = () => {
  const signIn = useSignIn();
  const navigate = useNavigate();

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: LoginData) => {
      await axiosInstance.post("/api/admin/login", data).then((res) => {
        const res_data = res.data.data;
        if (res_data.token) {
          signIn({
            auth: {
              token: res_data.token,
              type: "Bearer",
            },
          });
        }
      });
    },
    onSuccess: () => {
      navigate("/");
    },
  });

  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);

  return (
    <div className="bg-default-100 flex h-screen w-screen overflow-hidden items-center justify-center">
      <Card radius="sm" className="max-w-[400px] w-9/12">
        <CardHeader className="">
          <div className="flex flex-col gap-10 mt-3 w-full text-center">
            <h1 className="text-xl font-bold">Funcbase</h1>
            <h2 className="text-md">Admin sign in</h2>
          </div>
        </CardHeader>
        <CardBody>
          <Formik
            validationSchema={loginDataSchema}
            initialValues={{ email: "", password: "" }}
            onSubmit={(values) => {
              mutate(values);
            }}
          >
            {(props) => (
              <form
                className="flex flex-col gap-5 mx-3 mb-3"
                onSubmit={props.handleSubmit}
              >
                <Input
                  classNames={{
                    inputWrapper: "rounded-md ",
                    label: "text-md font-semibold",
                  }}
                  variant="flat"
                  type="email"
                  placeholder="Email"
                  name="email"
                  value={props.values.email}
                  onChange={props.handleChange}
                  onBlur={props.handleBlur}
                  errorMessage={props.errors.email}
                  isInvalid={
                    (props.touched.email && props.errors.email) as boolean
                  }
                />
                <Input
                  variant="flat"
                  classNames={{
                    inputWrapper: "rounded-md",
                    label: "text-md font-semibold",
                  }}
                  name="password"
                  value={props.values.password}
                  onChange={props.handleChange}
                  onBlur={props.handleBlur}
                  errorMessage={props.errors.password}
                  isInvalid={
                    (props.touched.password && props.errors.password) as boolean
                  }
                  endContent={
                    <button
                      className="focus:outline-none"
                      type="button"
                      onClick={toggleVisibility}
                    >
                      {isVisible ? (
                        <FaRegEye className="text-xl text-default-400 pointer-events-none" />
                      ) : (
                        <FaRegEyeSlash className="text-xl text-default-400 pointer-events-none" />
                      )}
                    </button>
                  }
                  type={isVisible ? "text" : "password"}
                  placeholder="Password"
                />
                <Button
                  isLoading={isPending}
                  type="submit"
                  fullWidth
                  className="rounded-md w-full mt-3 bg-slate-950 text-white font-semibold"
                >
                  Sign In
                </Button>
              </form>
            )}
          </Formik>
        </CardBody>
      </Card>
    </div>
  );
};

export default SignIn;

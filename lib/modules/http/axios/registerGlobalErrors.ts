export const registerGlobalErrors = (registry: any) => {
  registry.registerMany({
    no_input_data: { message: "Invalid Input!" },
    validation_error: {
      message: "Validation Error! Please check your input and try again!",
    },
    wrong_key: {
      after: () => console.log("Go TO /login"),
    },
    login_required: {
      message: "Login is required!",
      after: () => console.log("Go TO /login"),
    },
    invalid_login: {
      message: "Invalid Login!",
    },
    "404": { message: "API Page not found!" },
    "500": { message: "Internal Error!" },
  });
};

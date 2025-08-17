type Success<T> = {
  type: "success";
  data: T;
};

type Failure = {
  type: "failure";
  error: Error;
};

export type Result<T> = Success<T> | Failure;

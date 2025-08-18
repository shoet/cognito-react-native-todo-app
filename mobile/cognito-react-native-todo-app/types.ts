type Success<T> = {
  type: "success";
  data: T;
};

type Failure = {
  type: "failure";
  error: Error;
};

export type Result<T> = Success<T> | Failure;

export class UIError extends Error {
  name: string;
  displayMessage?: string;
  constructor(message: string, option?: { displayMessage?: string }) {
    super(message);
    this.name = "UIError";
    this.displayMessage = option?.displayMessage;
  }
}

export class UserAbortedError extends Error {
  constructor() {
    super("User aborted");
  }
}

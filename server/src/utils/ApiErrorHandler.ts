class ApiErrorHandler extends Error {
    public success: boolean;
    public statusCode: number;
    public data: null;
    public message: string; 
    public stack?: string
  
    constructor(
      statusCode: number,
      message = "Something went wrong",
      stack = ""
    ) {
      super(message);
      this.success = false;
      this.statusCode = statusCode;
      this.data = null;
      this.message = message;
      this.stack = stack;
      if(stack) {
        this.stack = stack;
      } else {
        Error.captureStackTrace(this, this.constructor)
      }
    }
  }
  
  export default ApiErrorHandler;
  
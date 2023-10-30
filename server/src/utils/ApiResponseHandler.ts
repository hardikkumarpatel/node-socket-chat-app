class ApiResponseHandler {
    public success: boolean;
    public statusCode: number;
    public data: any;
    public message: string;

    constructor(statusCode: number, message = "Success", data: any) {
        this.success = true;
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
    }
}

export default ApiResponseHandler;

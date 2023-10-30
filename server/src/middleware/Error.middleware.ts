import { ErrorRequestHandler } from 'express';
import ApiErrorHandler from '../utils/ApiErrorHandler';

const useErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
    const { statusCode, message, stack } = err as ApiErrorHandler
    console.log("statusCode", statusCode)
    console.log("message", message)
    const error = new ApiErrorHandler(statusCode, message, stack);
    const response = {
        ...error,
        message: message,
        stack: stack
    };
    return res.status(statusCode).send(response);
};

export default useErrorHandler;

import { ErrorRequestHandler } from 'express';
import ApiErrorHandler from '../utils/ApiErrorHandler';

const useErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
    let { statusCode, message, stack } = err as ApiErrorHandler
    if(!statusCode) {
        statusCode = 500;
    }
    const error = new ApiErrorHandler(statusCode, message, stack);
    const response = {
        ...error,
        message: message,
        stack: stack
    };
    return res.status(statusCode).send(response);
};

export default useErrorHandler;

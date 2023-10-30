export interface ClientApiResponse<Type> {
    success: boolean;
    statusCode: number;
    message: string;
    data: Type;
  }
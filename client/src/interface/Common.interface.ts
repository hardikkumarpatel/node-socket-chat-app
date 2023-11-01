import SocketIO from 'socket.io-client';
export interface ClientApiResponseDTO<Type> {
  success: boolean;
  statusCode: number;
  message: string;
  data: Type;
}

export interface UserLoginRequestDTO {
  username: string;
  password: string
}

export interface UserRegisterRequestDTO {
  email: string;
  username: string;
  password: string
}

export interface ToastDTO {
  open: boolean;
  type: string;
  message: string;
  duration?: number;
}

export interface SocketDTO {
  socket: ReturnType<typeof SocketIO> | null; 
}
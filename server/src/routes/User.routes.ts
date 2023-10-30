import { Router } from 'express';
import { loginUserController, registerUserController } from '../controller/User.controller';
const UserRoute = Router();

UserRoute.route("/Login").post(loginUserController);
UserRoute.route("/Register").post(registerUserController);

export default UserRoute;
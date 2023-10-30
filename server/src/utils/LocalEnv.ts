import { Secret } from "jsonwebtoken";

export class LocalEnvironmentConfig {
  private readonly PORT: number = parseInt("3010" as string, 10);
  private readonly HOST: string = "localhost";
  private readonly DB_NAME: string | undefined = process.env.DB_NAME;
  private readonly DB_USERNAME: string | undefined = process.env.DB_USERNAME;
  private readonly DB_PASSWORD: string | undefined = process.env.DB_PASSWORD;
  private readonly DB_HOST: string | undefined = process.env.DB_HOST;
  private readonly ACCESS_TOKEN_SECRET: Secret =
    process.env.ACCESS_TOKEN_SECRET as Secret;
  private readonly ACCESS_TOKEN_EXPIRY: string | undefined  =
    process.env.ACCESS_TOKEN_EXPIRY;
  private readonly REFRESH_TOKEN_SECRET: Secret =
    process.env.REFRESH_TOKEN_SECRET as Secret;
  private readonly REFRESH_TOKEN_EXPIRY: string | undefined =
    process.env.REFRESH_TOKEN_EXPIRY;

  get environmentVariables() {
    return {
      PORT: this.PORT,
      HOST: this.HOST,
      DB_NAME: this.DB_NAME,
      DB_USERNAME: this.DB_USERNAME,
      DB_PASSWORD: this.DB_PASSWORD,
      DB_HOST: this.DB_HOST,
      ACCESS_TOKEN_SECRET: this.ACCESS_TOKEN_SECRET,
      ACCESS_TOKEN_EXPIRY: this.ACCESS_TOKEN_EXPIRY,
      REFRESH_TOKEN_SECRET: this.REFRESH_TOKEN_SECRET,
      REFRESH_TOKEN_EXPIRY: this.REFRESH_TOKEN_EXPIRY,
    };
  }
}

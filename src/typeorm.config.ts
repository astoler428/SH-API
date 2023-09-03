import { TypeOrmModuleOptions } from "@nestjs/typeorm";

export const typeOrmConfig: TypeOrmModuleOptions = {
  "type": "postgres",
  "host": "localhost",
  "port": 5432,
  "username": "postgres",
  "password": "adst428*",
  "database": "SH",
  "entities": ["dist/**/*.entity{.ts,.js}"],
  "synchronize": true,
  "logging": true
}
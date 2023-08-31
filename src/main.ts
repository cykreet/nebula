import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { AppModule } from "./app.module.js";
import { Faceb00cGuard } from "./guards/faceb00c.guard.js";

const logger = new Logger("Nebula");
const adapter = new FastifyAdapter();
const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter, { logger });
app.useGlobalGuards(new Faceb00cGuard());

const port = process.env.PORT ?? "3000";
await app.listen(port, "0.0.0.0", (_error, address) => {
  logger.log(`Listening at ${address}`);
});

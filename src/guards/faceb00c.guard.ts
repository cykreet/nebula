import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { isIPv6 } from "net";

const FACEBOOK_SIGNATURE = "face:b00c";

@Injectable()
export class Faceb00cGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    if (request.headers["user-agent"] != "facebookexternalua") return false;
    const client =
      ((request.headers["cf-connecting-ip"] ?? request.headers["x-forwarded-for"]) as string) ?? request.ip;
    if (!isIPv6(client) || !client.includes(FACEBOOK_SIGNATURE)) return false;
    return true;
  }
}

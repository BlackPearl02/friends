import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { User } from "@friends/db";

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => {
    const req = ctx.switchToHttp().getRequest<{ user: User }>();
    return req.user;
  },
);

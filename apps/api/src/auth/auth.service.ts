import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { User } from "@friends/db";

@Injectable()
export class AuthService {
  constructor(private readonly jwt: JwtService) {}

  signAccessToken(user: User): string {
    return this.jwt.sign({ sub: user.id });
  }
}

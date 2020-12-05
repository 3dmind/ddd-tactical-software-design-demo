import { JwtToken } from '../../domain/jwt';

export class LoginResponseDto {
  access_token: JwtToken;
  refresh_token: JwtToken;
}
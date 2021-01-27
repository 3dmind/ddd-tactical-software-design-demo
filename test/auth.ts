import { Response } from 'supertest';

export function auth(response: Response): [token: string, options: { type: 'bearer' }] {
  return [response.body.access_token, { type: 'bearer' }];
}

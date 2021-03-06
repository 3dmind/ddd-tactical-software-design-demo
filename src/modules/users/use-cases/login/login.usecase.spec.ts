import { CacheModule } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { mock, mockReset } from 'jest-mock-extended';
import { UserEntityBuilder } from '../../../../../test/builder/user-entity.builder';
import { ApiConfigService } from '../../../../api-config/api-config.service';
import { RedisCacheService } from '../../../../redis-cache/redis-cache.service';
import { AppErrors } from '../../../../shared/core';
import { AuthService } from '../../services/auth.service';
import { LoginResponseDto } from './login-response.dto';
import { LoginUsecase } from './login.usecase';

describe('LoginUsecase', () => {
  const mockedConfigService = mock<ApiConfigService>();

  const accessTokenSecretFixture = 'defaultaccesstokensecret';
  const accessTokenTtlFixture = 10; // seconds
  const refreshTokenSecretFixture = 'defaultrefreshtokensecret';
  const refreshTokenTtlFixture = 10; // seconds

  let redisCacheService: RedisCacheService;
  let authService: AuthService;
  let useCase: LoginUsecase;

  beforeAll(async () => {
    mockedConfigService.getAccessTokenSecret.mockReturnValue(
      accessTokenSecretFixture,
    );
    mockedConfigService.getAccessTokenTtl.mockReturnValue(
      accessTokenTtlFixture,
    );

    mockedConfigService.getRefreshTokenSecret.mockReturnValue(
      refreshTokenSecretFixture,
    );
    mockedConfigService.getRefreshTokenTtl.mockReturnValue(
      refreshTokenTtlFixture,
    );

    const module: TestingModule = await Test.createTestingModule({
      imports: [CacheModule.register({ store: 'memory' })],
      providers: [
        { provide: 'JWT_MODULE_OPTIONS', useValue: {} },
        { provide: ApiConfigService, useValue: mockedConfigService },
        RedisCacheService,
        JwtService,
        AuthService,
        LoginUsecase,
      ],
    }).compile();
    module.useLogger(false);

    redisCacheService = module.get<RedisCacheService>(RedisCacheService);
    authService = module.get<AuthService>(AuthService);
    useCase = module.get<LoginUsecase>(LoginUsecase);
  });

  afterAll(() => {
    mockReset(mockedConfigService);
  });

  it('should fail on any error', async () => {
    // Given
    const spy = jest
      .spyOn(authService, 'createAccessToken')
      .mockImplementationOnce(() => {
        throw new Error('BOOM!');
      });
    const user = new UserEntityBuilder().build();

    // When
    const result = await useCase.execute(user);

    // Then
    expect.assertions(2);
    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(AppErrors.UnexpectedError);

    spy.mockRestore();
  });

  it('should succeed', async () => {
    // Given
    const user = new UserEntityBuilder().build();

    // When
    const result = await useCase.execute(user);
    const value = await redisCacheService.get(user.username.value);

    // Then
    expect.assertions(3);
    expect(result.isRight()).toBe(true);
    expect(result.value.getValue()).toMatchObject<LoginResponseDto>({
      access_token: expect.any(String),
      refresh_token: expect.any(String),
    });
    expect(value).toBeDefined();
  });
});

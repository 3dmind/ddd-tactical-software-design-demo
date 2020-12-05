import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as faker from 'faker';
import { mock, mockReset } from 'jest-mock-extended';
import { AppErrors } from '../../../../shared/core';
import { AuthService } from '../../auth.service';
import { UserEmailValueObject } from '../../domain/user-email.value-object';
import { UserNameValueObject } from '../../domain/user-name.value-object';
import { UserPasswordValueObject } from '../../domain/user-password.value-object';
import { UserEntity } from '../../domain/user.entity';
import { LoginResponseDto } from './login-response.dto';
import { LoginUseCase } from './login.usecase';

describe('LoginUseCase', () => {
  const mockedLogger = mock<Logger>();
  const mockedAuthService = mock<AuthService>();

  const usernameFixture = faker.internet.userName();
  const passwordFixture = faker.internet.password(6);
  const emailFixture = faker.internet.email();
  const username = UserNameValueObject.create(usernameFixture).getValue();
  const password = UserPasswordValueObject.create({
    value: passwordFixture,
  }).getValue();
  const email = UserEmailValueObject.create(emailFixture).getValue();

  let useCase: LoginUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: Logger, useValue: mockedLogger },
        { provide: AuthService, useValue: mockedAuthService },
        LoginUseCase,
      ],
    }).compile();

    useCase = await module.resolve<LoginUseCase>(LoginUseCase);
  });

  afterAll(() => {
    mockReset(mockedLogger);
    mockReset(mockedAuthService);
  });

  it('should fail on any error', async () => {
    expect.assertions(2);
    const validatedUser = UserEntity.create({
      username,
      password,
      email,
    }).getValue();
    mockedAuthService.createAccessToken.mockImplementationOnce(() => {
      throw new Error('BOOM!');
    });

    const result = await useCase.execute(validatedUser);

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(AppErrors.UnexpectedError);
  });

  it('should succeed', async () => {
    expect.assertions(2);
    const accessTokenFixture = faker.random.alphaNumeric(256);
    const refreshTokenFixture = faker.random.alphaNumeric(256);
    const validatedUser = UserEntity.create({
      username,
      password,
      email,
    }).getValue();
    mockedAuthService.createAccessToken.mockReturnValue(accessTokenFixture);
    mockedAuthService.createRefreshToken.mockReturnValue(refreshTokenFixture);

    const result = await useCase.execute(validatedUser);

    expect(result.isRight()).toBe(true);
    expect(result.value.getValue()).toMatchObject<LoginResponseDto>({
      access_token: accessTokenFixture,
      refresh_token: refreshTokenFixture,
    });
  });
});

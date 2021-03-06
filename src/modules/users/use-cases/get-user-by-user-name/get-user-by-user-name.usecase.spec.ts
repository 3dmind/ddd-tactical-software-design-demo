import { Test, TestingModule } from '@nestjs/testing';
import * as faker from 'faker';
import { UserEntityBuilder } from '../../../../../test/builder/user-entity.builder';
import { AppErrors } from '../../../../shared/core';
import { InMemoryUserRepository } from '../../repositories/user/in-memory-user.repository';
import { UserRepository } from '../../repositories/user/user.repository';
import { GetUserByUserNameDto } from './get-user-by-user-name.dto';
import { GetUserByUserNameError } from './get-user-by-user-name.errors';
import { GetUserByUserNameUsecase } from './get-user-by-user-name.usecase';

describe('GetUserByUserNameUsecase', () => {
  let userRepository: UserRepository;
  let useCase: GetUserByUserNameUsecase;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: UserRepository,
          useClass: InMemoryUserRepository,
        },
        GetUserByUserNameUsecase,
      ],
    }).compile();
    module.useLogger(false);

    userRepository = module.get<UserRepository>(UserRepository);
    useCase = module.get<GetUserByUserNameUsecase>(GetUserByUserNameUsecase);
  });

  it('should fail if username cannot be created', async () => {
    // Given
    const requestFixture: GetUserByUserNameDto = {
      username: null,
    };

    // When
    const result = await useCase.execute(requestFixture);

    // Then
    expect.assertions(1);
    expect(result.isLeft()).toBe(true);
  });

  it('should fail if user cannot be found', async () => {
    // Given
    const usernameFixture = faker.internet.userName();
    const requestFixture: GetUserByUserNameDto = {
      username: usernameFixture,
    };

    // When
    const result = await useCase.execute(requestFixture);

    // Then
    expect.assertions(3);
    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(
      GetUserByUserNameError.UserNotFoundError,
    );
    expect(result.value.errorValue().message).toEqual(
      `User with the username '${usernameFixture}' does not exist.`,
    );
  });

  it('should fail on any other error', async () => {
    // Given
    const usernameFixture = faker.internet.userName();
    const requestFixture: GetUserByUserNameDto = {
      username: usernameFixture,
    };
    const spy = jest
      .spyOn(userRepository, 'getUserByUsername')
      .mockImplementationOnce(() => {
        throw new Error();
      });

    // When
    const result = await useCase.execute(requestFixture);

    // Then
    expect.assertions(2);
    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(AppErrors.UnexpectedError);

    spy.mockRestore();
  });

  it('should succeed', async () => {
    // Given
    const usernameFixture = faker.internet.userName();
    const user = new UserEntityBuilder({
      username: usernameFixture,
    }).build();
    const requestFixture: GetUserByUserNameDto = {
      username: usernameFixture,
    };
    await userRepository.save(user);

    // When
    const result = await useCase.execute(requestFixture);

    // Then
    expect.assertions(2);
    expect(result.isRight()).toBe(true);
    expect(result.value.getValue()).toBe(user);
  });
});

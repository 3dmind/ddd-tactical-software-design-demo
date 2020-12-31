import { Test, TestingModule } from '@nestjs/testing';
import * as faker from 'faker';
import { mock, mockReset } from 'jest-mock-extended';
import { AppErrors, Result } from '../../../../shared/core';
import { UserPassword } from '../../domain/user-password.valueobject';
import { UserEntity } from '../../domain/user.entity';
import { UserRepository } from '../../repositories/user.repository';
import { CreateUserDto } from './create-user.dto';
import { CreateUserErrors } from './create-user.errors';
import { CreateUserUsecase } from './create-user.usecase';

describe('CreateUserUsecase', () => {
  const mockedUserRepository = mock<UserRepository>();
  let useCase: CreateUserUsecase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: UserRepository, useValue: mockedUserRepository },
        CreateUserUsecase,
      ],
    }).compile();
    module.useLogger(false);

    useCase = await module.resolve<CreateUserUsecase>(CreateUserUsecase);
  });

  afterAll(() => {
    mockReset(mockedUserRepository);
  });

  it('should fail if username cannot be created', async () => {
    expect.assertions(1);
    const emailFixture = faker.internet.email();
    const passwordFixture = faker.internet.password(UserPassword.minLength);
    const request = {
      email: emailFixture,
      password: passwordFixture,
    } as CreateUserDto;

    const result = await useCase.execute(request);

    expect(result.isLeft()).toBe(true);
  });

  it('should fail if user password cannot be created', async () => {
    expect.assertions(1);
    const userNameFixture = faker.internet.userName();
    const emailFixture = faker.internet.email();
    const request = {
      email: emailFixture,
      username: userNameFixture,
    } as CreateUserDto;

    const result = await useCase.execute(request);

    expect(result.isLeft()).toBe(true);
  });

  it('should fail if user email cannot be created', async () => {
    expect.assertions(1);
    const passwordFixture = faker.internet.password(UserPassword.minLength);
    const userNameFixture = faker.internet.userName();
    const request = {
      username: userNameFixture,
      password: passwordFixture,
    } as CreateUserDto;

    const result = await useCase.execute(request);

    expect(result.isLeft()).toBe(true);
  });

  it('should fail if user already exists', async () => {
    expect.assertions(3);
    const emailFixture = faker.internet.email().toLowerCase();
    const passwordFixture = faker.internet.password(UserPassword.minLength);
    const userNameFixture = faker.internet.userName();
    mockedUserRepository.exists.mockResolvedValueOnce(true);

    const result = await useCase.execute({
      email: emailFixture,
      password: passwordFixture,
      username: userNameFixture,
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(
      CreateUserErrors.EmailAlreadyExistsError,
    );
    expect(result.value.errorValue().message).toEqual(
      `The email ${emailFixture} associated for this account already exists.`,
    );
  });

  it('should fail if username already taken', async () => {
    expect.assertions(3);
    const emailFixture = faker.internet.email().toLowerCase();
    const passwordFixture = faker.internet.password(UserPassword.minLength);
    const userNameFixture = faker.internet.userName();
    mockedUserRepository.exists.mockResolvedValueOnce(false);
    mockedUserRepository.getUserByUsername.mockResolvedValueOnce({
      found: true,
    });

    const result = await useCase.execute({
      email: emailFixture,
      password: passwordFixture,
      username: userNameFixture,
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(CreateUserErrors.UsernameTakenError);
    expect(result.value.errorValue().message).toEqual(
      `The username ${userNameFixture} was already taken.`,
    );
  });

  it('should fail if user cannot be created', async () => {
    expect.assertions(1);
    const emailFixture = faker.internet.email().toLowerCase();
    const passwordFixture = faker.internet.password(UserPassword.minLength);
    const userNameFixture = faker.internet.userName();
    const spy = jest
      .spyOn(UserEntity, 'create')
      .mockReturnValue(Result.fail<UserEntity>('error'));
    mockedUserRepository.exists.mockResolvedValueOnce(false);
    mockedUserRepository.getUserByUsername.mockResolvedValueOnce({
      found: false,
    });

    const result = await useCase.execute({
      email: emailFixture,
      password: passwordFixture,
      username: userNameFixture,
    });

    expect(result.isLeft()).toBe(true);

    spy.mockRestore();
  });

  it('should fail on any other error', async () => {
    expect.assertions(2);
    const emailFixture = faker.internet.email().toLowerCase();
    const passwordFixture = faker.internet.password(UserPassword.minLength);
    const userNameFixture = faker.internet.userName();
    mockedUserRepository.exists.mockResolvedValueOnce(false);
    mockedUserRepository.getUserByUsername.mockResolvedValueOnce({
      found: false,
    });
    mockedUserRepository.save.mockImplementationOnce(() => {
      throw new Error('BOOM!');
    });

    const result = await useCase.execute({
      email: emailFixture,
      password: passwordFixture,
      username: userNameFixture,
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(AppErrors.UnexpectedError);
  });

  it('should succeed', async () => {
    expect.assertions(1);
    const emailFixture = faker.internet.email().toLowerCase();
    const passwordFixture = faker.internet.password(UserPassword.minLength);
    const userNameFixture = faker.internet.userName();
    mockedUserRepository.exists.mockResolvedValueOnce(false);
    mockedUserRepository.getUserByUsername.mockResolvedValueOnce({
      found: false,
    });
    mockedUserRepository.save.mockResolvedValueOnce();

    const result = await useCase.execute({
      email: emailFixture,
      password: passwordFixture,
      username: userNameFixture,
    });

    expect(result.isRight()).toBe(true);
  });
});

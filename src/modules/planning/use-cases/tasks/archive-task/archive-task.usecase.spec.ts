import { Test, TestingModule } from '@nestjs/testing';
import * as faker from 'faker';
import { MemberEntityBuilder } from '../../../../../../test/builder/member-entity.builder';
import { TaskEntityBuilder } from '../../../../../../test/builder/task-entity.builder';
import { AppErrors, Result } from '../../../../../shared/core';
import { UniqueEntityId } from '../../../../../shared/domain';
import { UserId } from '../../../../users/domain/user-id.entity';
import { TaskId } from '../../../domain/task-id.entity';
import { Task } from '../../../domain/task.entity';
import { InMemoryMemberRepository } from '../../../repositories/member/in-memory-member.repository';
import { MemberRepository } from '../../../repositories/member/member.repository';
import { InMemoryTaskRepository } from '../../../repositories/task/in-memory-task.repository';
import { TaskRepository } from '../../../repositories/task/task.repository';
import { ArchiveTaskErrors } from './archive-task.errors';
import { ArchiveTaskUsecase } from './archive-task.usecase';

describe('ArchiveTaskUsecase', () => {
  let memberRepository: MemberRepository;
  let taskRepository: TaskRepository;
  let useCase: ArchiveTaskUsecase;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: TaskRepository,
          useClass: InMemoryTaskRepository,
        },
        {
          provide: MemberRepository,
          useClass: InMemoryMemberRepository,
        },
        ArchiveTaskUsecase,
      ],
    }).compile();
    module.useLogger(false);

    memberRepository = module.get<MemberRepository>(MemberRepository);
    taskRepository = module.get<TaskRepository>(TaskRepository);
    useCase = module.get<ArchiveTaskUsecase>(ArchiveTaskUsecase);
  });

  it('should fail if task-id cannot be created', async () => {
    // Given
    const spy = jest
      .spyOn(TaskId, 'create')
      .mockReturnValue(Result.fail<TaskId>('error'));
    const userId = UserId.create(new UniqueEntityId()).getValue();

    // When
    const result = await useCase.execute({
      taskId: null,
      userId,
    });

    // Then
    expect(result.isLeft()).toBe(true);
    expect.assertions(2);
    expect(result.value.errorValue()).toEqual('error');

    spy.mockRestore();
  });

  it('should fail if member cannot be found', async () => {
    // Given
    const userId = UserId.create(new UniqueEntityId()).getValue();
    const taskId = faker.random.uuid();

    // When
    const result = await useCase.execute({
      taskId,
      userId,
    });

    // Then
    expect.assertions(3);
    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ArchiveTaskErrors.MemberNotFoundError);
    expect(result.value.errorValue().message).toEqual(
      `Could not find member associated with the user id {${userId.id}}.`,
    );
  });

  it('should fail if a task cannot be found', async () => {
    // Given
    const member = new MemberEntityBuilder().build();
    const taskId = faker.random.uuid();
    await memberRepository.save(member);

    // When
    const result = await useCase.execute({
      taskId,
      userId: member.userId,
    });

    // Then
    expect.assertions(3);
    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ArchiveTaskErrors.TaskNotFoundError);
    expect(result.value.errorValue().message).toEqual(
      `Could not find a task by the id {${taskId}}.`,
    );
  });

  it('should fail if member is not the task owner', async () => {
    // Given
    const member = new MemberEntityBuilder().build();
    const task = new TaskEntityBuilder().build();
    await memberRepository.save(member);
    await taskRepository.save(task);

    // When
    const result = await useCase.execute({
      taskId: task.taskId.toString(),
      userId: member.userId,
    });

    // Then
    expect.assertions(1);
    expect(result.isLeft()).toBe(true);
  });

  it('should fail on any other error', async () => {
    // Given
    const spy = jest
      .spyOn(taskRepository, 'getTaskById')
      .mockImplementationOnce(() => {
        throw new Error();
      });
    const member = new MemberEntityBuilder().build();
    const task = new TaskEntityBuilder().withOwnerId(member.ownerId).build();
    await memberRepository.save(member);
    await taskRepository.save(task);

    // When
    const result = await useCase.execute({
      taskId: task.taskId.id.toString(),
      userId: member.userId,
    });

    // Then
    expect.assertions(2);
    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(AppErrors.UnexpectedError);

    spy.mockRestore();
  });

  it('should succeed', async () => {
    // Given
    const member = new MemberEntityBuilder().build();
    const task = new TaskEntityBuilder().withOwnerId(member.ownerId).build();
    await memberRepository.save(member);
    await taskRepository.save(task);

    // When
    const result = await useCase.execute({
      taskId: task.taskId.id.toString(),
      userId: member.userId,
    });
    const archivedTask: Task = result.value.getValue();

    // Then
    expect.assertions(2);
    expect(result.isRight()).toBe(true);
    expect(archivedTask.isArchived()).toBe(true);
  });
});

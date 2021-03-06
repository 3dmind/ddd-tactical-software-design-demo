import * as faker from 'faker';
import * as uuid from 'uuid';
import { UniqueEntityId } from '../../../shared/domain';
import { MemberId } from './member-id.entity';

jest.mock('uuid');

describe('MemberId', () => {
  beforeAll(() => {
    uuid.v4.mockReturnValue(faker.random.uuid());
  });

  afterAll(() => {
    uuid.mockRestore();
  });

  it('should accept existing ID', () => {
    // Given
    const expectedId = faker.random.uuid();

    // When
    const memberIdResult = MemberId.create(new UniqueEntityId(expectedId));
    const memberId = memberIdResult.getValue();

    // Then
    expect.assertions(3);
    expect(memberIdResult.isSuccess).toBe(true);
    expect(memberId.id.toValue()).toEqual(expectedId);
    expect(memberId.toString()).toEqual(expectedId);
  });

  it('should create new ID', () => {
    // When
    const memberIdResult = MemberId.create();
    const memberId = memberIdResult.getValue();

    // Then
    expect.assertions(2);
    expect(memberIdResult.isSuccess).toBe(true);
    expect(memberId.id).toBeDefined();
  });
});

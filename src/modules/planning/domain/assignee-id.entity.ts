import { Result } from '../../../shared/core';
import { Entity, UniqueEntityId } from '../../../shared/domain';

export class AssigneeId extends Entity<any> {
  private constructor(id?: UniqueEntityId) {
    super(null, id);
  }

  get id(): UniqueEntityId {
    return this._id;
  }

  public static create(id?: UniqueEntityId): Result<AssigneeId> {
    return Result.ok<AssigneeId>(new AssigneeId(id));
  }
}

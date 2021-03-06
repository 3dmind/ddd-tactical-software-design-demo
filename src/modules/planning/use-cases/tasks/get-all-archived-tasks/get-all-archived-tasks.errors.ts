import { Result, UseCaseError } from '../../../../../shared/core';

export namespace GetAllArchivedTasksErrors {
  export class MemberNotFoundError extends Result<UseCaseError> {
    constructor(userId: string) {
      super(false, {
        message: `Could not find member associated with the user id {${userId}}.`,
      });
    }
  }
}

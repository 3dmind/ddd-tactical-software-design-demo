import * as bcrypt from 'bcrypt';
import { Guard, Result } from '../../../shared/core';
import { ValueObject } from '../../../shared/domain';

interface UserPasswordProps {
  value: string;
  hashed?: boolean;
}

const SALT_ROUNDS = 10;

export class UserPasswordValueObject extends ValueObject<UserPasswordProps> {
  public static minLength = 6;

  private constructor(props: UserPasswordProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  public static create(
    props: UserPasswordProps,
  ): Result<UserPasswordValueObject> {
    const nullGuardResult = Guard.againstNullOrUndefined(
      props.value,
      'password',
    );
    if (!nullGuardResult.succeeded) {
      return Result.fail<UserPasswordValueObject>(nullGuardResult.message);
    }

    if (!props.hashed) {
      const minGuardResult = Guard.againstAtLeast(this.minLength, props.value);
      if (!minGuardResult.succeeded) {
        return Result.fail<UserPasswordValueObject>(minGuardResult.message);
      }
    }

    return Result.ok<UserPasswordValueObject>(
      new UserPasswordValueObject({
        value: props.value,
        hashed: !!props.hashed === true,
      }),
    );
  }

  public isAlreadyHashed(): boolean {
    return this.props.hashed;
  }

  public async getHashedValue(): Promise<string> {
    if (this.isAlreadyHashed()) {
      return this.props.value;
    }

    return bcrypt.hash(this.props.value, SALT_ROUNDS);
  }

  public async comparePassword(plainTextPassword: string): Promise<boolean> {
    return bcrypt.compare(plainTextPassword, this.props.value);
  }
}

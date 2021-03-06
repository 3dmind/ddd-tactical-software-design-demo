import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserRegistered } from '../../users/domain/events/user-registered.domainevent';
import { CreateMemberUsecase } from '../use-cases/members/create-member/create-member.usecase';

@Injectable()
export class AfterUserRegisteredSubscriber {
  private readonly logger = new Logger(AfterUserRegisteredSubscriber.name);

  constructor(private readonly createMemberUsecase: CreateMemberUsecase) {}

  @OnEvent(UserRegistered.name)
  public async onUserRegistered(event: UserRegistered): Promise<void> {
    const { user } = event;
    try {
      await this.createMemberUsecase.execute({
        userId: user.userId.id.toString(),
      });
      this.logger.log(
        'Successfully executed CreateMember use case after user registered',
      );
    } catch (error) {
      this.logger.error(error.message, error.stack);
    }
  }
}

import { UserRepository } from '../domain/UserRepository';
import { User } from '../domain/User';

export class FindAllUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(): Promise<User[]> {
    return await this.userRepository.findAll();
  }
}

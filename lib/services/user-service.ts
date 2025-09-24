import { UserRepository } from "@/lib/repository/user"
import { AccountRepository } from "@/lib/repository/account"
import { captureDatabaseError, captureServerEvent } from "@/lib/error-tracker-server"
import { Pool } from "pg"
import { UserWithProvider } from "@/lib/types/api/user"

export class UserService {
  private userRepo: UserRepository
  private accountRepo: AccountRepository

  constructor(pool: Pool) {
    this.userRepo = new UserRepository(pool)
    this.accountRepo = new AccountRepository(pool)
  }

  async getUserWithProvider(userId: string): Promise<UserWithProvider | null> {
    const startTime = Date.now()
    
    try {
      const user = await this.userRepo.findById(userId)
      if (!user) {
        await captureServerEvent('user_not_found', {
          user_id: userId,
          operation: 'getUserWithProvider',
          duration_ms: Date.now() - startTime,
        })
        return null
      }

      const accounts = await this.accountRepo.findByUserId(userId)
      const hasCredentialsProvider = accounts.some(account => account.providerId === "credential")

      await captureServerEvent('user_retrieval_success', {
        user_id: userId,
        operation: 'getUserWithProvider',
        duration_ms: Date.now() - startTime,
        has_credentials_provider: hasCredentialsProvider,
        account_count: accounts.length,
      }, userId)

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
        plan: user.plan,
        subscriptionStatus: user.subscriptionStatus,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        hasCredentialsProvider,
      }
    } catch (error) {
      await captureDatabaseError(
        error instanceof Error ? error : new Error('Database error in getUserWithProvider'),
        undefined,
        {
          userId,
          additionalData: {
            operation: 'getUserWithProvider',
            duration_ms: Date.now() - startTime,
          },
        }
      )
      throw error
    }
  }
}

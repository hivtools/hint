package org.imperial.mrc.hint.logic

import org.imperial.mrc.hint.db.UserRepository
import org.imperial.mrc.hint.emails.EmailManager
import org.imperial.mrc.hint.emails.PasswordEmailTemplate
import org.imperial.mrc.hint.exceptions.UserException
import org.pac4j.core.profile.CommonProfile
import org.pac4j.sql.profile.DbProfile
import org.pac4j.sql.profile.service.DbProfileService
import org.springframework.stereotype.Component
import java.security.SecureRandom
import java.util.*

interface UserLogic
{
    fun addUser(email: String, password: String?)
    fun removeUser(email: String)
    fun getUser(email: String): CommonProfile?
    fun updateUserPassword(user: CommonProfile, password: String)
}

@Component
class DbProfileServiceUserLogic(private val userRepository: UserRepository,
                                private val profileService: DbProfileService,
                                private val emailManager: EmailManager) : UserLogic
{

    override fun addUser(email: String, password: String?)
    {

        if (!email.contains("@") && email != GUEST_USER)
        {
            throw UserException("invalidEmail")
        }

        if (getUser(email) != null)
        {
            throw UserException("userExists")
        }

        val profile = DbProfile()
        profile.build(email, mapOf("username" to email))

        val pw = if (password.isNullOrEmpty())
        {
            val pw = generateRandomPassword()
            emailManager.sendPasswordEmail(email, email, PasswordEmailTemplate.CreateAccount())
            pw
        }
        else
        {
            password
        }
        profileService.create(profile, pw)
    }

    override fun removeUser(email: String)
    {
        val user = getUser(email) ?: throw UserException("userDoesNotExist")
        profileService.removeById(user.id)
    }

    override fun getUser(email: String): CommonProfile?
    {

        if (email == GUEST_USER)
        {
            return profileService.findById(email)
        }

        val emailArray = email.split("@")
        if (emailArray.count() == 1)
        {
            throw UserException("invalidEmail")
        }

        // val caseInsensitiveDomainRegex = Regex("(?-i)${emailArray[0]}@(?i)${emailArray[1]}")
        val caseInsensitiveEmail = Regex("(?i)${email}")

        val username = userRepository.getAllUserNames()
                .find { caseInsensitiveEmail.matches(it) }
                ?: return null

        return profileService.findById(username)
    }

    override fun updateUserPassword(user: CommonProfile, password: String)
    {
        val dbUser: DbProfile = getUser(user.id) as DbProfile
        profileService.update(dbUser, password)
    }

    companion object
    {

        const val PASSWORD_LENGTH = 10
        const val GUEST_USER = "guest"

        private fun generateRandomPassword(): String
        {
            val random = SecureRandom()
            val rnd = ByteArray(PASSWORD_LENGTH)
            random.nextBytes(rnd)
            return Base64.getEncoder().encodeToString(rnd)
        }

    }
}

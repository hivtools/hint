package org.imperial.mrc.hint.db

import org.imperial.mrc.hint.emails.EmailManager
import org.imperial.mrc.hint.emails.PasswordEmailTemplate
import org.imperial.mrc.hint.exceptions.UserException
import org.jooq.DSLContext
import org.pac4j.core.profile.CommonProfile
import org.pac4j.sql.profile.DbProfile
import org.pac4j.sql.profile.service.DbProfileService
import org.springframework.stereotype.Component
import java.security.SecureRandom
import java.util.*

interface UserRepository {
    fun addUser(email: String, password: String?)
    fun removeUser(email: String)
    fun getUser(email: String): CommonProfile?
    fun updateUserPassword(user: CommonProfile, password: String)
}

@Component
class DbProfileServiceUserRepository(private val dsl: DSLContext,
                                     private val profileService: DbProfileService,
                                     private val emailManager: EmailManager) : UserRepository {

    override fun addUser(email: String, password: String?) {

        if (getUser(email) != null) {
            throw UserException("User already exists")
        }

        val profile = DbProfile()
        profile.build(email, mapOf("username" to email))

        val pw = if (password.isNullOrEmpty()) {
            val pw = generateRandomPassword()
            emailManager.sendPasswordEmail(email, email, PasswordEmailTemplate.CreateAccount())
            pw
        } else {
            password
        }
        profileService.create(profile, pw)
    }

    override fun removeUser(email: String) {
        val user = getUser(email) ?: throw UserException("User does not exist")
        profileService.removeById(user.id)
    }

    override fun getUser(email: String): CommonProfile? {

        val emailArray = email.split("@")
        val caseInsensitiveDomainRegex = Regex("(?-i)${emailArray[0]}@(?i)${emailArray[1]}")

        val existingEmail = dsl.select(Tables.USERS.USERNAME)
                .from(Tables.USERS)
                .fetchInto(String::class.java)
                .find { caseInsensitiveDomainRegex.matches(it) }
                ?: return null

        return profileService.findById(existingEmail)
    }

    override fun updateUserPassword(user: CommonProfile, password: String) {
        val dbUser: DbProfile = getUser(user.id) as DbProfile
        profileService.update(dbUser, password)
    }

    companion object {

        const val PASSWORD_LENGTH = 10

        private fun generateRandomPassword(): String {
            val random = SecureRandom()
            val rnd = ByteArray(PASSWORD_LENGTH)
            random.nextBytes(rnd)
            return Base64.getEncoder().encodeToString(rnd)
        }

    }
}

package org.imperial.mrc.hint.db

import org.imperial.mrc.hint.emails.EmailManager
import org.imperial.mrc.hint.exceptions.UserException
import org.mindrot.jbcrypt.BCrypt
import org.pac4j.core.profile.CommonProfile
import org.pac4j.sql.profile.DbProfile
import org.pac4j.sql.profile.service.DbProfileService
import org.springframework.stereotype.Component

interface UserRepository {
    fun addUser(email: String, password: String?)
    fun removeUser(email: String)
    fun getUser(email: String): CommonProfile?
    fun updateUserPassword(user: CommonProfile, password: String)
}

@Component
class DbProfileServiceUserRepository(private val profileService: DbProfileService,
                                     private val emailManager: EmailManager) : UserRepository {

    override fun addUser(email: String, password: String?) {
        if (getUser(email) != null) {
            throw UserException("User already exists")
        }

        val profile = DbProfile()
        profile.build(email, mapOf("username" to email))

        val pw = if (password.isNullOrEmpty()) {
            val pw = BCrypt.gensalt()
            emailManager.sendPasswordResetEmail(email, email, true)
            pw
        } else {
            password
        }
        profileService.create(profile, pw)
    }

    override fun removeUser(email: String) {
        getUser(email) ?: throw UserException("User does not exist")
        profileService.removeById(email)
    }

    override fun getUser(email: String): CommonProfile? {
        return profileService.findById(email)
    }

    override fun updateUserPassword(user: CommonProfile, password: String) {
        val dbUser: DbProfile = getUser(user.id) as DbProfile
        profileService.update(dbUser, password)
    }
}

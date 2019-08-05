package org.imperial.mrc.hint.db

import org.pac4j.core.profile.CommonProfile
import org.pac4j.sql.profile.DbProfile
import org.pac4j.sql.profile.service.DbProfileService
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.context.annotation.Configuration
import org.springframework.transaction.annotation.Transactional

interface UserRepository
{
    fun addUser(email: String, password: String)
    fun removeUser(email: String)
    fun getUser(email: String): CommonProfile?
}

@Configuration
open class DbProfileServiceUserRepository(@Autowired val profileService: DbProfileService): UserRepository
{
    override fun addUser(email: String, password: String)
    {
        val profile = DbProfile()
        profile.build(email, mapOf("username" to email))

        profileService.create(profile, password)
    }

    override fun removeUser(email: String)
    {
        val user = getUser(email)
        if (user == null)
        {
            throw Exception("User does not exist")
        }
        profileService.removeById(email)
    }

    override fun getUser(email: String): CommonProfile?
    {
        return profileService.findById(email)
    }
}

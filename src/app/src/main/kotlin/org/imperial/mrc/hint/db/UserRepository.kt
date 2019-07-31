package org.imperial.mrc.hint.db

import org.imperial.mrc.hint.security.Pac4jProfileService
import org.pac4j.sql.profile.DbProfile
import org.pac4j.sql.profile.service.DbProfileService

interface UserRepository
{
    fun addUser(email: String, password: String)
    fun removeUser(email: String)
}

class DbProfileServiceUserRepository(val profileService: DbProfileService=Pac4jProfileService().profileService()): UserRepository
{
    override fun addUser(email: String, password: String)
    {
        val profile = DbProfile()
        profile.build(email, mapOf("username" to email))

        profileService.create(profile, password)
    }

    override fun removeUser(email: String)
    {
        profileService.removeById(email)
    }
}
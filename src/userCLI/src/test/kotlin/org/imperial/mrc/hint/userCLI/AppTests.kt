package org.imperial.mrc.hint.userCLI

import org.junit.jupiter.api.Test
import org.assertj.core.api.Assertions
import org.imperial.mrc.hint.db.DbProfileServiceUserRepository
import org.imperial.mrc.hint.db.UserRepository
import org.imperial.mrc.hint.security.Pac4jProfileService
import org.imperial.mrc.hint.userCLI.addUser
import org.imperial.mrc.hint.userCLI.removeUser
import org.junit.jupiter.api.BeforeAll
import org.pac4j.sql.profile.service.DbProfileService
import org.postgresql.jdbc3.Jdbc3PoolingDataSource


//TODO: inherit from CleanDatabaseTests. The hint db container must be running to run these tests
class AppTests
{
    companion object {
        lateinit var userRepository: UserRepository

        @BeforeAll
        @JvmStatic
        fun setUpUserRepo() {
            val dataSource = Jdbc3PoolingDataSource()
            dataSource.setUrl("jdbc:postgresql://localhost/hint")
            dataSource.setUser("hintuser")
            dataSource.setPassword("changeme")

            val profileService = Pac4jProfileService().profileService(dataSource)

            userRepository = DbProfileServiceUserRepository(profileService)
        }
    }

    @Test
    fun `addUser and removeUser have expected effect`()
    {
        addUser(mapOf("<email>" to "test@test.com", "<password>" to "testpassword"), userRepository)
        removeUser(mapOf("<email>" to "test@test.com"), userRepository)
    }
}
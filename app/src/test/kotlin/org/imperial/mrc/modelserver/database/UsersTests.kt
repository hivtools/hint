package org.imperial.mrc.modelserver.database

import org.assertj.core.api.Assertions
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.Test
import org.pac4j.core.credentials.password.JBCryptPasswordEncoder
import org.pac4j.sql.profile.DbProfile
import org.pac4j.sql.profile.service.DbProfileService
import org.postgresql.jdbc3.Jdbc3PoolingDataSource
import org.mindrot.jbcrypt.BCrypt

//Tests that pac4j can access the database
//Database should be running (via ./scripts/run-dependencies.sh)

class UsersTests {

    companion object {
        val dataSource = Jdbc3PoolingDataSource()

        @BeforeAll
        @JvmStatic
        fun setupDatasource()
        {
            dataSource.url = "jdbc:postgresql://localhost/modelserver-db"
            dataSource.user = "hint"
            dataSource.password = "changeme"
        }
    }

    @Test
    fun `can add and remove users`() {
        val profileService = DbProfileService(dataSource, JBCryptPasswordEncoder(BCrypt.gensalt()))

        val profile = DbProfile()
        profile.build("userid1", mapOf("username" to "username1"))

        profileService.create(profile, "mypassword")

        val retrieved = profileService.findById("userid1")
        Assertions.assertThat(retrieved.username).isEqualTo("username1")

        profileService.remove(profile)
        val removedRetrieved = profileService.findById("userid1")
        Assertions.assertThat(removedRetrieved).isNull()
    }
}
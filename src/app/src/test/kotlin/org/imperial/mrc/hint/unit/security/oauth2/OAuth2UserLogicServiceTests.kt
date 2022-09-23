package org.imperial.mrc.hint.unit.security.oauth2

import org.imperial.mrc.hint.ConfiguredAppProperties
import org.imperial.mrc.hint.caseInsensitiveEmail
import org.imperial.mrc.hint.db.DbConfig
import org.imperial.mrc.hint.security.oauth2.OAuth2UserLogicService
import org.jooq.SQLDialect
import org.jooq.impl.DSL
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class OAuth2UserLogicServiceTests
{
    @Test
    fun`can add new auth0 user to DB`() {

        val dataSource = DbConfig().dataSource(ConfiguredAppProperties())

        val dslContext = DSL.using(dataSource.connection, SQLDialect.POSTGRES)

        val sut = OAuth2UserLogicService(dslContext)

        val results = sut.validateUser("new@example.com")

        assertEquals(results, "new@example.com")
    }

    @Test
    fun`does not create new user, matches existing user with auth2 user`() {

        val testEmail = "test@example.com"

        val dataSource = DbConfig().dataSource(ConfiguredAppProperties())

        val dslContext = DSL.using(dataSource.connection, SQLDialect.POSTGRES)

        val sut = OAuth2UserLogicService(dslContext)

        val email = sut.getAllUserNames()
            .find { caseInsensitiveEmail(testEmail).matches(it) }

        assertEquals(email, testEmail)

        val results = sut.validateUser(testEmail)

        assertEquals(results, testEmail)
    }
}
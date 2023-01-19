package org.imperial.mrc.hint.unit.controllers

import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.controllers.UserController
import org.imperial.mrc.hint.logic.UserLogic
import org.junit.jupiter.api.Test
import org.pac4j.core.profile.CommonProfile

class UserControllerTests
{
    private val mockAppProps = mock<AppProperties> {
        on { oauth2LoginMethod } doReturn false
    }

    @Test
    fun `userExists returns true if user exists`()
    {

        val userLogic = mock<UserLogic> {
            on { getUser("email@email.com", false) } doReturn CommonProfile()
        }

        val sut = UserController(userLogic, mockAppProps)
        val result = sut.userExists("email@email.com")
        assertThat(result.data as Boolean).isTrue
    }

    @Test
    fun `userExists returns false if user does not exist`()
    {
        val userLogic = mock<UserLogic> {
            on { getUser("email@email.com", false) } doReturn null as CommonProfile?
        }

        val sut = UserController(userLogic, mockAppProps)
        val result = sut.userExists("email@email.com")
        assertThat(result.data as Boolean).isFalse
    }

    @Test
    fun `oauth2 userExists returns true if user exist`()
    {
        val commonProfile = mock<CommonProfile> {
            on { id } doReturn "email@email.com"
        }

        val userLogic = mock<UserLogic> {
            on { getUser("email@email.com", true) } doReturn commonProfile
        }

        val mockAppProps = mock<AppProperties> {
            on { oauth2LoginMethod } doReturn true
        }

        val sut = UserController(userLogic, mockAppProps)
        val result = sut.userExists("email@email.com")
        assertThat(result.data as Boolean).isTrue
    }
}

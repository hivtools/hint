package org.imperial.mrc.hint.unit.controllers

import com.nhaarman.mockito_kotlin.any
import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.controllers.UserController
import org.imperial.mrc.hint.logic.UserLogic
import org.junit.jupiter.api.Test
import org.pac4j.core.profile.CommonProfile

class UserControllerTests
{

    @Test
    fun `userExists returns true if user exists`()
    {

        val userLogic = mock<UserLogic> {
            on { getUser(any()) } doReturn CommonProfile()
        }

        val sut = UserController(userLogic)
        val result = sut.userExists("email@email.com")
        assertThat(result.data as Boolean).isTrue()
    }

    @Test
    fun `userExists returns false if user does not exist`()
    {

        val userLogic = mock<UserLogic> {
            on { getUser(any()) } doReturn null as CommonProfile?
        }

        val sut = UserController(userLogic)
        val result = sut.userExists("email@email.com")
        assertThat(result.data as Boolean).isFalse()
    }
}

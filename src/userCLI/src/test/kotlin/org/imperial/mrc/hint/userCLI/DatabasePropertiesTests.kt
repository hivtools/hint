package org.imperial.mrc.hint.userCLI

import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import org.assertj.core.api.AssertionsForClassTypes.assertThat
import org.junit.jupiter.api.Test

class DatabasePropertiesTests {

    @Test
    fun `can get prop from env var`() {
        val mockEnvironment = mock<Environment> {
            on { get("db_user") } doReturn ("test_user")
        }
        val user = DatabaseProperties(mockEnvironment).user

        assertThat(user).isEqualTo("test_user")
    }

    @Test
    fun `falls back to config if env var is missing`() {
        val user = DatabaseProperties().user
        assertThat(user).isEqualTo("hintuser")
    }
}

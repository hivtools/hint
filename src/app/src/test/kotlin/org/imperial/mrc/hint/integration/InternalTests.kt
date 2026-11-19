package org.imperial.mrc.hint.integration

import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.logic.DbProfileServiceUserLogic.Companion.GUEST_USER
import org.junit.jupiter.api.Test
import org.springframework.boot.test.web.client.getForEntity
import org.springframework.http.HttpStatus

class InternalTests : SecureIntegrationTests()
{
    @Test
    fun `whoami returns guest user when not logged in`()
    {
        val result = testRestTemplate.getForEntity<String>("/internal/whoami")

        assertThat(result.statusCode).isEqualTo(HttpStatus.NO_CONTENT)
        assertThat(result.headers["X-Hint-User"]).containsExactly(GUEST_USER)
        assertThat(result.headers["X-Hint-Version-Id"]).isNull()
    }

    @Test
    fun `whoami returns logged in user - TRUE`()
    {
        val result = testRestTemplate.getForEntity<String>("/internal/whoami")

        assertThat(result.statusCode).isEqualTo(HttpStatus.NO_CONTENT)
        assertThat(result.headers["X-Hint-User"]).containsExactly("test.user@example.com")
    }
}

package org.imperial.mrc.hint.unit.logging

import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.logging.*
import org.imperial.mrc.hint.models.ErrorDetail
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus

class LogMetadataTests
{

    private val client = Client("Safari", "127.0.0.1", "session1")

    private val errorMessage = ErrorMessage(
        Exception("error"),
        ErrorDetail(HttpStatus.NOT_FOUND, "errro details", "errr"),
        "errorTrace"
    )

    private val app = AppOrigin("hint", "backend")

    private val response = Response("responseMessage", HttpStatus.NOT_FOUND)

    private val request = Request(
            "POST",
            "/project",
            "hint",
            client
    )

    private val logMetadata = LogMetadata(
        "Updating project note",
        errorMessage,
        request,
        response,
        "testUser",
        app,
        listOf("project", "notes")
    )

    @Test
    fun `can serialise log metadata`()
    {
        assertThat(logMetadata.username).isEqualTo("testUser")
        assertThat(logMetadata.app).isEqualTo(AppOrigin(name = "hint", type = "backend"))
        assertThat(logMetadata.request).isEqualTo(Request(
                method = "POST",
                path = "/project",
                hostname = "hint",
                client = Client(agent = "Safari", geoIp = "127.0.0.1", sessionId = "session1")))
        assertThat(logMetadata.request?.client).isEqualTo(client)
        assertThat(logMetadata.response).isEqualTo(Response(message = "responseMessage", status = HttpStatus.NOT_FOUND))
        assertThat(logMetadata.error).isEqualTo(errorMessage)
        assertThat(logMetadata.action).isEqualTo("Updating project note")
        assertThat(logMetadata.tags).isEqualTo(listOf("project", "notes"))
    }
}
package org.imperial.mrc.hint.unit.logging

import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.logging.*
import org.junit.jupiter.api.Test

class LogMetadataTests
{
    private val request = Request(
            "POST",
            "/project",
            "hint",
            Client("Safari", "127.0.0.1", "session1")
    )

    private val logMetadata = LogMetadata(
            "testUser",
            AppOrigin("hint", "backend"),
            request,
            Response("responseMessage", "responseStatus"),
            ErrorMessage("error", "errorDetails", "errorTrace"),
            "Updating project note",
            listOf("project", "notes")
    )

    @Test
    fun `can serialise log metadata`()
    {
        assertThat(logMetadata.username).isEqualTo("testUser")
        assertThat(logMetadata.app).isEqualToComparingFieldByField(AppOrigin(name = "hint", type = "backend"))
        assertThat(logMetadata.request).isEqualToComparingFieldByField(Request(
                method = "POST",
                path = "/project",
                hostname = "hint",
                client = Client(agent = "Safari", geoIp = "127.0.0.1", sessionId = "session1")))
        assertThat(logMetadata.response).isEqualToComparingFieldByField(Response(message = "responseMessage", status = "responseStatus"))
        assertThat(logMetadata.action).isEqualTo("Updating project note")
        assertThat(logMetadata.tags).isEqualTo(listOf("project", "notes"))
    }
}
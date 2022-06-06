package org.imperial.mrc.hint.unit.logging

import com.fasterxml.jackson.databind.ObjectMapper
import com.nhaarman.mockito_kotlin.mock
import com.nhaarman.mockito_kotlin.verify
import org.imperial.mrc.hint.logging.*
import org.junit.jupiter.api.Test

class GenericLoggerImplTests
{
    private val mockLogger = mock<org.slf4j.Logger>()

    private val testLogData = LogMetadata(
            "testUser",
            AppOrigin("hint", "backend"),
            Request(
                    "POST",
                    "/project",
                    "hint",
                    Client("Safari", "127.0.0.1", "session1")
            ),
            null,
            null,
            "Updating project note",
            listOf("project", "notes")
    )

    @Test
    fun `can display info logging in key value format`()
    {
        val objectMapper = ObjectMapper()
        val sut = GenericLoggerImpl(mockLogger)
        sut.info(testLogData)
        verify(mockLogger).info(objectMapper.writeValueAsString(mapOf("hint" to testLogData)))
    }
}

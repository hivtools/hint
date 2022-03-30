package org.imperial.mrc.hint.unit.logging

import com.fasterxml.jackson.databind.ObjectMapper
import com.nhaarman.mockito_kotlin.mock
import com.nhaarman.mockito_kotlin.verify
import net.logstash.logback.argument.StructuredArguments
import org.imperial.mrc.hint.logging.*
import org.junit.jupiter.api.Test

class LoggingTests
{
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
        emptyList()
    )

    private val mockLogger = mock<org.slf4j.Logger>()

    private val objectMapper = ObjectMapper()

    @Test
    fun `can display error logging in key value format`()
    {
        val sut = GenericLoggerImpl(mockLogger)
        sut.error(testLogData)

        verify(mockLogger).error(objectMapper.writeValueAsString(testLogData),
            StructuredArguments.kv("Username", testLogData.username),
            StructuredArguments.kv("App", testLogData.app),
            StructuredArguments.kv("Request", testLogData.request),
            StructuredArguments.kv("Response", testLogData.response),
            StructuredArguments.kv("Error", testLogData.error),
            StructuredArguments.kv("Action", testLogData.action),
            StructuredArguments.kv("Tags", testLogData.tags)
        )
    }

    @Test
    fun `can display info logging in key value format`()
    {
        val sut = GenericLoggerImpl(mockLogger)
        sut.info(testLogData)

        verify(mockLogger).info(objectMapper.writeValueAsString(testLogData),
            StructuredArguments.kv("Username", testLogData.username),
            StructuredArguments.kv("App", testLogData.app),
            StructuredArguments.kv("Request", testLogData.request),
            StructuredArguments.kv("Response", testLogData.response),
            StructuredArguments.kv("Error", testLogData.error),
            StructuredArguments.kv("Action", testLogData.action),
            StructuredArguments.kv("Tags", testLogData.tags))
    }
}
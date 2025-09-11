package org.imperial.mrc.hint.unit.controllers

import com.fasterxml.jackson.databind.ObjectMapper
import com.nhaarman.mockito_kotlin.*
import org.imperial.mrc.hint.clients.ADRClient
import org.imperial.mrc.hint.clients.HintrApiResponse
import org.imperial.mrc.hint.controllers.RehydrateController
import org.imperial.mrc.hint.models.AdrResource
import org.imperial.mrc.hint.service.ADRService
import org.imperial.mrc.hint.service.ProjectService
import org.imperial.mrc.hint.service.RehydratedProject
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.Test
import org.mockito.ArgumentMatchers
import org.springframework.http.HttpStatus
import org.springframework.web.multipart.MultipartFile
import java.io.InputStream
import java.net.URI
import java.net.http.HttpResponse

class RehydrateControllerTests
{
    private val objectMapper = ObjectMapper()
    private val project = RehydratedProject(
        notes = "my file notes",
        state = objectMapper.readTree("{\"hello\": \"world\"}")
    )
    private val fileStream = mock<InputStream>()

    @Test
    fun `submit output zip file`()
    {
        val multipartFile = mock<MultipartFile>{
            on {inputStream} doReturn fileStream
        }

        val mockProjectService = mock<ProjectService> {
            on {rehydrateProject(fileStream)} doReturn project
        }
        val mockADRService = mock<ADRService>()

        val sut = RehydrateController(mockProjectService, mockADRService)
        val result = sut.submitRehydrate(multipartFile)

        verify(mockProjectService).rehydrateProject(fileStream)
        Assertions.assertEquals(result.statusCode, HttpStatus.OK)
        Assertions.assertEquals(result.body?.data, project)
    }

    @Test
    fun `submit rehydrate from ADR`()
    {
        val adrResource = AdrResource("test-url", "123")

        val mockProjectService = mock<ProjectService> {
            on {rehydrateProject(fileStream)} doReturn project
        }
        val mockHttpResponse = mock<HttpResponse<InputStream>> {
            on { body() } doReturn fileStream
            on { statusCode() } doReturn 200
        }
        val mockADRClient = mock<ADRClient> {
            on { getInputStream(any()) } doReturn mockHttpResponse
        }
        val mockADRService = mock<ADRService> {
            on { build() } doReturn mockADRClient
        }

        val sut = RehydrateController(mockProjectService, mockADRService)
        val result = sut.submitAdrRehydrate(adrResource)

        verify(mockADRClient).getInputStream("test-url")
        verify(mockProjectService).rehydrateProject(fileStream)
        Assertions.assertEquals(result.statusCode, HttpStatus.OK)
        Assertions.assertEquals(result.body?.data, project)
    }
}

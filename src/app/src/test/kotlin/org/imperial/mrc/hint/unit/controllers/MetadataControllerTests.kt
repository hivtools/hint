package org.imperial.mrc.hint.unit.controllers

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.node.ObjectNode
import com.fasterxml.jackson.module.kotlin.readValue
import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.imperial.mrc.hint.clients.HintrAPIClient
import org.imperial.mrc.hint.controllers.MetadataController
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import java.io.File
import java.io.FileNotFoundException
import java.net.URL

class MetadataControllerTests
{

    @Test
    fun `gets plotting metadata`()
    {
        val mockResponse = mock<ResponseEntity<String>>()

        val mockAPIClient = mock<HintrAPIClient> {
            on { getPlottingMetadata("MWI") } doReturn mockResponse
        }

        val sut = MetadataController(mockAPIClient)
        val result = sut.plotting("MWI")
        assertThat(result).isSameAs(mockResponse)
    }

    @Test
    fun `getting hintr version`()
    {
        val mockResponse = mock<ResponseEntity<String>>()

        val mockAPIClient = mock<HintrAPIClient>
        {
            on { getVersion() } doReturn mockResponse
        }

        val sut = MetadataController(mockAPIClient)
        val result = sut.version()
        assertThat(result).isSameAs(mockResponse)
    }

    @Test
    fun `gets generic chart metadata`()
    {
        val tmpDir = "tmp"

        try
        {
            File(tmpDir).mkdir()
            val mockClassLoader = mock<ClassLoader>() {
                on { getResource("metadata/generic-chart.json") } doReturn createTestResource(
                        "${tmpDir}/metadata/metadata/generic-chart.json",
                        """{
                            "input-time-series": {
                                "chartConfig": [
                                    {"id": "scatter"}
                                ]
                            }
                        }""")
                on { getResource("metadata/input-time-series-config-jsonata.txt") } doReturn createTestResource(
                    "${tmpDir}/metadata/input-time-series-config-jsonata.txt", "TEST_JSONATA")
                }

            val sut = MetadataController(mock(), mockClassLoader)
            val result = sut.genericChart()
            assertThat(result.statusCode).isEqualTo(HttpStatus.OK)
            val resultJson = ObjectMapper().readValue<ObjectNode>(result.body!!)
            val chartConfig = resultJson["data"]["input-time-series"]["chartConfig"][0]
            assertThat(chartConfig["id"].asText()).isEqualTo("scatter")
            assertThat(chartConfig["config"].asText()).isEqualTo("TEST_JSONATA")
        }
        finally
        {
            File(tmpDir).deleteRecursively()
        }

    }

    private fun createTestResource(path: String, contents: String): URL {
        val dir = File(path.replaceAfterLast("/", ""))
        dir.mkdirs()

        val file = File(path)
        file.createNewFile()
        file.writeText(contents)
        return file.toURI().toURL()
    }
}

package org.imperial.mrc.hint.integration

import com.fasterxml.jackson.databind.ObjectMapper
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.helpers.getJsonEntity
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.TestInstance
import org.springframework.boot.test.web.client.getForEntity
import org.springframework.boot.test.web.client.postForEntity
import org.springframework.http.ResponseEntity

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class DownloadTests : SecureIntegrationTests()
{
    var modelId: String? = null
    var calibrateId: String? = null
    var coarseOutputResponseId: String? = null
    var summaryResponseId: String? = null
    var spectrumResponseId: String? = null

    @BeforeAll
    fun waitForResults()
    {
        authorize()
        testRestTemplate.getForEntity<String>("/")
        modelId = waitForModelRunResult()
        calibrateId = waitForCalibrationResult(modelId!!)
        coarseOutputResponseId = waitForSubmitDownloadOutput(calibrateId!!, "coarse-output")
        summaryResponseId = waitForSubmitDownloadOutput(calibrateId!!, "summary")
        spectrumResponseId = waitForSubmitDownloadOutput(calibrateId!!, "spectrum")
    }

    @Test
    fun `can submit coarse output download`()
    {
        val responseEntity = testRestTemplate.postForEntity<String>("/download/submit/coarse-output/$modelId")
        assertSuccess(responseEntity, "DownloadSubmitResponse")
    }

    @Test
    fun `can download coarse output result`()
    {
        val responseEntity = testRestTemplate.getForEntity<ByteArray>("/download/result/$coarseOutputResponseId")
        assertSuccess(responseEntity)
        assertResponseHasExpectedDownloadHeaders(responseEntity)
    }

    @Test
    fun `can submit summary download`()
    {
        val postEntity = getJsonEntity(emptyMap())
        val responseEntity = testRestTemplate.postForEntity<String>("/download/submit/summary/$modelId", postEntity)
        assertSuccess(responseEntity, "DownloadSubmitResponse")
    }

    @Test
    fun `can download summary output result`()
    {
        val responseEntity = testRestTemplate.getForEntity<ByteArray>("/download/result/$summaryResponseId")
        assertSuccess(responseEntity)
        assertResponseHasExpectedDownloadHeaders(responseEntity)
    }

    @Test
    fun `can get path to download file`()
    {
        val coarseOutput = testRestTemplate.getForEntity<String>("/download/path/$coarseOutputResponseId")
        assertSuccess(coarseOutput, "DownloadResultResponse")

        val summaryReport = testRestTemplate.getForEntity<String>("/download/path/$summaryResponseId")
        assertSuccess(summaryReport, "DownloadResultResponse")
    }

    @Test
    fun `can submit spectrum download`()
    {
        val datasets = mapOf(
                "anc" to mapOf("filename" to "anc", "path" to "uploads/anc"),
                "pjnz" to mapOf("filename" to "pjnz", "path" to "uploads/pjnz"),
                "population" to mapOf("filename" to "population", "path" to "uploads/population"),
                "programme" to mapOf("filename" to "programme", "path" to "uploads/programme"),
                "shape" to mapOf("filename" to "shape", "path" to "uploads/shape"),
                "survey" to mapOf("filename" to "survey", "path" to "uploads/survey")
        )

        val note = mapOf(
                "note" to "test notes",
                "updated" to "2022/05/17 12:34:21",
                "name" to "projectName"
        )

        val state = mapOf(
                "state" to mapOf(
                        "datasets" to datasets,
                        "model_fit" to mapOf("id" to "", "options" to mapOf("" to "")),
                        "calibrate" to mapOf("id" to "", "options" to mapOf("" to "")),
                        "version" to mapOf("hintr" to "1", "naomi" to "1", "rrq" to "1")
                ),
                "notes" to mapOf(
                        "project_notes" to note,
                        "version_notes" to listOf(note, note)
                ),
                "vmmc" to mapOf("filename" to "vmmc", "hash" to "123", "path" to "uploads/vmmc"),
        )

        val postEntity = getJsonEntity(state)
        val responseEntity = testRestTemplate.postForEntity<String>("/download/submit/spectrum/$modelId", postEntity)
        assertSuccess(responseEntity, "DownloadSubmitResponse")
    }

    @Test
    fun `can download spectrum output result`()
    {
        val responseEntity = testRestTemplate.getForEntity<ByteArray>("/download/result/$spectrumResponseId")
        assertSuccess(responseEntity)
        assertResponseHasExpectedDownloadHeaders(responseEntity)
    }

    @Test
    fun `can get download status`()
    {
        val responseId = downloadOutputResponseId()
        val responseEntity = testRestTemplate.getForEntity<String>("/download/status/$responseId")
        assertSuccess(responseEntity, "DownloadStatusResponse")
    }

    fun assertResponseHasExpectedDownloadHeaders(response: ResponseEntity<ByteArray>)
    {
        val headers = response.headers
        assertThat(headers["Content-Type"]?.first()).isEqualTo("application/octet-stream")

        val contentLength = headers["Content-Length"]?.first()!!.toInt()
        assertThat(contentLength).isGreaterThan(0)
        val bodyLength = response.body?.count()
        assertThat(contentLength).isEqualTo(bodyLength)
    }

    @Test
    fun `can get uploadToADR metadata`()
    {
        val responseEntity = testRestTemplate.getForEntity<String>("/meta/adr/$spectrumResponseId")
        assertSuccess(responseEntity, "AdrMetadataResponse")
    }

    fun downloadOutputResponseId(): String
    {
        val response = testRestTemplate.postForEntity<String>("/download/submit/spectrum/$calibrateId")
        val bodyJSON = ObjectMapper().readTree(response.body)
        return bodyJSON["data"]["id"].asText()
    }
}

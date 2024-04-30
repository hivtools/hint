package org.imperial.mrc.hint.helpers

import com.fasterxml.jackson.databind.ObjectMapper
import org.imperial.mrc.hint.ConfiguredAppProperties
import org.imperial.mrc.hint.HintProperties
import org.springframework.core.io.FileSystemResource
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.util.LinkedMultiValueMap
import java.io.File

const val tmpUploadDirectory = "tmp"
val errorCodeRegex = Regex("u[a-z]{2}-[a-z]{3}-[a-z]{3}")
val unexpectedErrorRegex = "An unexpected error occurred. If you see this message while you are using (.*) at a workshop, please contact your" +
        " workshop technical support and show them this code: (u[a-z]{2}-[a-z]{3}-[a-z]{3})." +
        " Otherwise please contact support at (.*) and quote this code: (u[a-z]{2}-[a-z]{3}-[a-z]{3})."

fun getTestEntity(fileName: String, acceptGzip: Boolean = false): HttpEntity<LinkedMultiValueMap<String, Any>>
{
    val testFile = File("testdata/$fileName")
    val body = LinkedMultiValueMap<String, Any>()
    body.add("file", FileSystemResource(testFile))
    val headers = HttpHeaders()
    headers.contentType = MediaType.MULTIPART_FORM_DATA
    if (acceptGzip)
    {
        headers.set("Accept-Encoding", "gzip")
    }
    return HttpEntity(body, headers)
}

fun readPropsFromTempFile(contents: String): HintProperties
{
    File("tmp").mkdir()
    val config = File("tmp/fake.properties")
    config.createNewFile()
    config.writeText(contents)
    return ConfiguredAppProperties.readProperties("tmp/fake.properties")
}

fun getJsonEntity(payload: Map<String, Any>): HttpEntity<String>
{
    val headers = HttpHeaders()
    headers.contentType = MediaType.APPLICATION_JSON
    val jsonString = ObjectMapper().writeValueAsString(payload)
    return HttpEntity(jsonString, headers)
}

enum class Language {
    FR, EN, PT
}

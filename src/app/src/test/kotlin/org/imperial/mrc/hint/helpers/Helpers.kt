package org.imperial.mrc.hint.helpers

import org.springframework.core.io.FileSystemResource
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.util.LinkedMultiValueMap
import java.io.File

const val tmpUploadDirectory = "tmp"

fun createTestHttpEntity(fileName: String = "testfile.csv"): HttpEntity<LinkedMultiValueMap<String, Any>> {
    val testFile = File("$tmpUploadDirectory/$fileName")
    testFile.parentFile.mkdirs()
    testFile.createNewFile()

    val body = LinkedMultiValueMap<String, Any>()
    body.add("file", FileSystemResource(testFile))
    val headers = HttpHeaders()
    headers.contentType = MediaType.MULTIPART_FORM_DATA
    return HttpEntity(body, headers)
}

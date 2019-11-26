package org.imperial.mrc.hint.helpers

import org.springframework.core.io.FileSystemResource
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.util.LinkedMultiValueMap
import java.io.File

const val tmpUploadDirectory = "tmp"
val errorCodeRegex = Regex("u[a-z]{2}-[a-z]{3}-[a-z]{3}")
val errorMessageRegex = Regex("(.*) If you see this message while you are using (.*) at a workshop, please contact your" +
        " workshop technical support and show them this code: (u[a-z]{2}-[a-z]{3}-[a-z]{3})." +
        " Otherwise please contact support at (.*) and quote this code: (u[a-z]{2}-[a-z]{3}-[a-z]{3})")

fun getTestEntity(fileName: String, acceptGzip: Boolean = false): HttpEntity<LinkedMultiValueMap<String, Any>> {
    val testFile = File("testdata/$fileName")
    val body = LinkedMultiValueMap<String, Any>()
    body.add("file", FileSystemResource(testFile))
    val headers = HttpHeaders()
    headers.contentType = MediaType.MULTIPART_FORM_DATA
    if (acceptGzip) {
        headers.set("Accept-Encoding", "gzip")
    }
    return HttpEntity(body, headers)
}


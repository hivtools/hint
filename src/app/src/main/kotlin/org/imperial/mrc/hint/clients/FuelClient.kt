package org.imperial.mrc.hint.clients

import com.github.kittinunf.fuel.core.FileDataPart
import com.github.kittinunf.fuel.core.Parameters
import com.github.kittinunf.fuel.core.Request
import com.github.kittinunf.fuel.httpGet
import com.github.kittinunf.fuel.httpPost
import com.github.kittinunf.fuel.httpUpload
import org.imperial.mrc.hint.asResponseEntity
import org.springframework.http.ResponseEntity
import java.io.File
import java.time.Instant

abstract class FuelClient(protected val baseUrl: String)
{

    companion object
    {
        private const val TIMEOUT = 60000
    }

    abstract fun standardHeaders(): Map<String, Any>

    fun get(url: String): ResponseEntity<String>
    {
        return "$baseUrl/$url".httpGet()
                .header(standardHeaders())
                .addTimeouts()
                .response()
                .second
                .asResponseEntity()
    }

    protected fun postJson(url: String, json: String): ResponseEntity<String>
    {
        return "$baseUrl/$url".httpPost()
                .addTimeouts()
                .header(standardHeaders())
                .header("Content-Type" to "application/json")
                .body(json)
                .response()
                .second
                .asResponseEntity()
    }

    protected fun postEmpty(url: String): ResponseEntity<String>
    {
        return "$baseUrl/$url".httpPost()
                .addTimeouts()
                .header(standardHeaders())
                .response()
                .second
                .asResponseEntity()
    }

    protected fun Request.addTimeouts(): Request
    {
        return this.timeout(TIMEOUT)
                .timeoutRead(TIMEOUT)
    }

    fun postFile(url: String, parameters: Parameters, file: Pair<String, File>): ResponseEntity<String>
    {
        println("""
            > postFile
            ${Instant.now()}
            $baseUrl/$url
            parameters: $parameters
            file: $file
            header: ${standardHeaders()}
        """.trimIndent())
//        val response = "https://paste.c-net.org/".httpUpload(parameters)
//        val response = "https://hookb.in/1gjdyBNoZqfj002yk3kl".httpUpload(parameters)
        val response = "$baseUrl/$url".httpUpload(parameters)
                .add(FileDataPart(file.second, file.first))
                .addTimeouts()
                .header(standardHeaders())
                .response()
                .second
                .asResponseEntity()
        println("""
            < postFile
            ${Instant.now()}
            response code: ${response.statusCodeValue}
            response body: ${response.body}
        """.trimIndent())
        return response
    }
}

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

    fun post(url: String, params: List<Pair<String, String>>): ResponseEntity<String>
    {
        return "$baseUrl/$url".httpPost(params)
                .addTimeouts()
                .header(standardHeaders())
                .response()
                .second
                .asResponseEntity()
    }

    protected fun postJson(urlPath: String?, json: String): ResponseEntity<String>
    {
        val url = when
        {
            urlPath.isNullOrEmpty() -> baseUrl
            else -> "$baseUrl/$urlPath"
        }

        return url.httpPost()
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
        return "$baseUrl/$url".httpUpload(parameters)
                .add(FileDataPart(file.second, file.first))
                .addTimeouts()
                .header(standardHeaders())
                .response()
                .second
                .asResponseEntity()
    }
}

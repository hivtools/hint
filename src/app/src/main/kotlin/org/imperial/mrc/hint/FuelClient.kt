package org.imperial.mrc.hint

import com.github.kittinunf.fuel.core.Request
import com.github.kittinunf.fuel.httpGet
import com.github.kittinunf.fuel.httpPost
import org.springframework.http.ResponseEntity

abstract class FuelClient(protected val baseUrl: String) {

    abstract fun standardHeaders(): Map<String, Any>

    fun get(url: String): ResponseEntity<String> {
        return "$baseUrl/$url".httpGet()
                .header(standardHeaders())
                .addTimeouts()
                .response()
                .second
                .asResponseEntity()
    }

    protected fun postJson(url: String, json: String): ResponseEntity<String> {
        return "$baseUrl/$url".httpPost()
                .addTimeouts()
                .header(standardHeaders())
                .header("Content-Type" to "application/json")
                .body(json)
                .response()
                .second
                .asResponseEntity()
    }

    protected fun Request.addTimeouts(): Request {
        return this.timeout(60000)
                .timeoutRead(60000)
    }
}

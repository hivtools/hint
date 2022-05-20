package org.imperial.mrc.hint.logging

import org.imperial.mrc.hint.NoCoverage
import javax.servlet.http.HttpServletRequest

@NoCoverage
data class Client(
        val agent: String? = null,
        val geoIp: String? = null,
        val sessionId: String? = null
)
@NoCoverage
data class AppOrigin(
        val name: String? = "hint",
        val type: String? = "backend"
)
@NoCoverage
data class Request(
        val method: String,
        val path: String,
        val hostname: String,
        val client: Client
)
{
        constructor(request: HttpServletRequest) : this(
                request.method,
                request.servletPath,
                request.serverName,
                Client(request.getHeader("User-Agent"), request.remoteAddr, request.session.id)
        )
}
@NoCoverage
data class Response(val message: String? = null, val status: String? = null)

@NoCoverage
data class ErrorMessage(val error: String? = null, val details: String? = null, val traceId: String? = null)

@NoCoverage
data class LogMetadata(
        val username: String? = null,
        val app: AppOrigin? = AppOrigin(),
        val request: Request? = null,
        val response: Response? = null,
        val error: ErrorMessage? = null,
        val action: String? = null,
        val tags: List<String>? = emptyList()
)

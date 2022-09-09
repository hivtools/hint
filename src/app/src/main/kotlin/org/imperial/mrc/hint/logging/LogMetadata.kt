package org.imperial.mrc.hint.logging

import org.imperial.mrc.hint.HintProperties
import org.imperial.mrc.hint.models.ErrorDetail
import org.springframework.http.HttpStatus
import javax.servlet.http.HttpServletRequest

data class Client(
        val agent: String? = null,
        val geoIp: String? = null,
        val sessionId: String? = null
)

data class AppOrigin(
        val name: String? = "hint",
        val profile: String? = HintProperties().getProperty("application_url"),
        val type: String? = "backend"
)

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

data class Response(val message: String? = null, val status: HttpStatus? = null)

data class ErrorMessage(val error: Throwable? = null, val details: ErrorDetail? = null, val key: String? = null)

data class LogMetadata(
        val action: String? = null,
        val error: ErrorMessage? = null,
        val request: Request? = null,
        val response: Response? = null,
        val username: String? = null,
        val app: AppOrigin? = AppOrigin(),
        val tags: List<String>? = emptyList()
)

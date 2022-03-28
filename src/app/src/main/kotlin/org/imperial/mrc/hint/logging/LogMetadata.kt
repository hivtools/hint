package org.imperial.mrc.hint.logging

import javax.servlet.http.HttpServletRequest

data class Client(
        val username: String? = null,
        val agent: String? = null,
        val geoip: String? = null,
        val sessionId: String? = null
)

data class AppOrigin(
        val name: String? = "hint",
        val type: String? = "backend"
)

data class Request(
        val method: String,
        val path: String,
        val hostname: String,
        val client: Client
)
{
        constructor(request: HttpServletRequest, userId: String) : this(
                request.method,
                request.servletPath,
                request.serverName,
                Client(userId, request.getHeader("User-Agent"), request.remoteAddr, request.session.id)
        )
}

data class Response(val message: String? = null, val status: String? = null)

data class ErrorMessage(val error: String? = null, val details: String? = null)

data class LogMetadata(
        val app: AppOrigin? = AppOrigin(),
        val request: Request? = null,
        val response: Response? = null,
        val error: ErrorMessage? = null,
        val action: String? = null,
        val tags: List<String>? = emptyList()
)

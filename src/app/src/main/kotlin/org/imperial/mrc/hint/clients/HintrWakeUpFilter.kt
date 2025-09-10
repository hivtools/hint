package org.imperial.mrc.hint.clients

import org.imperial.mrc.hint.AppProperties
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import java.time.Instant
import java.util.concurrent.atomic.AtomicLong
import javax.servlet.FilterChain
import javax.servlet.http.HttpServletRequest
import javax.servlet.http.HttpServletResponse

@Component
class HintrWakeUpFilter(
    private val hintrAPIClient: HintrAPIClient,
    properties: AppProperties
) : OncePerRequestFilter() {

    private val lastWakeUp = AtomicLong(0)
    private val wakeUpIntervalMillis = properties.hintrWakeUpInterval?.times(1000) ?: (2 * 60 * 1000) // 2 minutes

    // Paths to skip wake-up
    private val excludedPaths = listOf(
        "/favicon.ico",
        "/robots.txt",
        "/sitemap.xml",
        "/actuator",
        "/metrics",
        "/error"
    )

    override fun shouldNotFilter(request: HttpServletRequest): Boolean {
        val path = request.requestURI
        if (request.method == "OPTIONS") return true
        return excludedPaths.any { path.startsWith(it) }
    }

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        val now = Instant.now().toEpochMilli()
        val last = lastWakeUp.get()

        if (now - last > wakeUpIntervalMillis) {
            lastWakeUp.set(now)
            hintrAPIClient.wakeUpWorkers()
        }

        filterChain.doFilter(request, response)
    }
}

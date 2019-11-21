package org.imperial.mrc.hint.logging

import org.springframework.stereotype.Component
import javax.servlet.Filter
import javax.servlet.FilterChain
import javax.servlet.ServletRequest
import javax.servlet.ServletResponse
import javax.servlet.http.HttpServletRequest
import javax.servlet.http.HttpServletResponse
import org.springframework.web.util.ContentCachingResponseWrapper
import java.nio.charset.Charset

@Component
class ErrorLoggingFilter(private val logMethod: (msg: String) -> Unit = ::println): Filter {
    override fun doFilter(request: ServletRequest, response: ServletResponse, chain: FilterChain) {
        val responseWrapper = ContentCachingResponseWrapper(response as HttpServletResponse)

        chain.doFilter(request, responseWrapper)

        if (response.status >= 400) {
            val message = "ERROR: ${response.status} response for ${(request as HttpServletRequest).requestURL}"
            logMethod(message)

            //log content
            val bytes = responseWrapper.contentAsByteArray
            val content = String(bytes, Charset.forName(responseWrapper.characterEncoding))
            logMethod(content)
        }

        responseWrapper.copyBodyToResponse()
    }
}
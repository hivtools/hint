package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.clients.HintrAPIClient
import org.imperial.mrc.hint.security.Session
import org.slf4j.LoggerFactory
import org.springframework.web.bind.annotation.*
import javax.servlet.http.HttpServletResponse

@RestController
@RequestMapping("/model")
class DebugController(
    val apiClient: HintrAPIClient,
    private val session: Session
) {

    private val logger = LoggerFactory.getLogger(DebugController::class.java)

    @GetMapping("/debug/{id}")
    @ResponseBody
    fun downloadDebug(@PathVariable("id") id: String, response: HttpServletResponse) {
        if (session.userIsGuest())
        {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Authentication required")
        }
        apiClient.downloadDebug(id, response)
    }

}

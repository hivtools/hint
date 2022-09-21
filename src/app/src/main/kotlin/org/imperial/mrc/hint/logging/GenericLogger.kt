package org.imperial.mrc.hint.logging

import org.imperial.mrc.hint.exceptions.HintException
import org.springframework.http.HttpStatus
import javax.servlet.http.HttpServletRequest
import javax.servlet.http.HttpServletResponse

interface GenericLogger
{
    fun info(action: String)
    fun info(action: String, request: HttpServletRequest, user: String? = null)
    fun error(request: HttpServletRequest, response: HttpServletResponse, message: String? = null)
    fun error(request: HttpServletRequest, error: Throwable?, status: HttpStatus)
    fun error(request: HttpServletRequest, error: HintException)
}

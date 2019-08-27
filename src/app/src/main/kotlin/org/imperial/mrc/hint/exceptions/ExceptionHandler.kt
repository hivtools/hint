package org.imperial.mrc.hint.exceptions

import org.imperial.mrc.hint.models.ErrorDetail
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.lang.Nullable
import org.springframework.web.bind.annotation.ControllerAdvice
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.context.request.WebRequest
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler

@Order(Ordered.HIGHEST_PRECEDENCE)
@ControllerAdvice
class HintExceptionHandler : ResponseEntityExceptionHandler() {

    @ExceptionHandler(Exception::class)
    override fun handleExceptionInternal(e: java.lang.Exception,
                                         @Nullable body: Any?,
                                         headers: HttpHeaders,
                                         status: HttpStatus,
                                         request: WebRequest): ResponseEntity<Any> {
        return ErrorDetail(status, e.message ?: "Something went wrong").toResponseEntity()
    }
}

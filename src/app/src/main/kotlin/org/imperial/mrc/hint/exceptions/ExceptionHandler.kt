package org.imperial.mrc.hint.exceptions

import org.imperial.mrc.hint.models.ErrorDetail
import org.postgresql.util.PSQLException
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
import javax.servlet.http.HttpServletRequest
import javax.validation.ConstraintViolationException

@Order(Ordered.HIGHEST_PRECEDENCE)
@ControllerAdvice
class HintExceptionHandler : ResponseEntityExceptionHandler() {

    override fun handleExceptionInternal(e: java.lang.Exception,
                                         @Nullable body: Any?,
                                         headers: HttpHeaders,
                                         status: HttpStatus,
                                         request: WebRequest): ResponseEntity<Any> {
        return ErrorDetail(status, e.message ?: "Something went wrong").toResponseEntity()
    }

    @ExceptionHandler(HintException::class)
    protected fun handleHintException(e: HintException): ResponseEntity<Any>
    {
        return ErrorDetail(e.httpStatus, e.message!!).toResponseEntity()
    }

    @ExceptionHandler(ConstraintViolationException::class)
    protected fun handleConstraintViolationException(e: ConstraintViolationException, request: HttpServletRequest): ResponseEntity<*> {
        return ErrorDetail(HttpStatus.BAD_REQUEST, e.message!!).toResponseEntity()
    }

    @ExceptionHandler(PSQLException::class)
    protected fun handlePSQLException(e: PSQLException, request: HttpServletRequest) : ResponseEntity<Any> {
        return ErrorDetail(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred.").toResponseEntity()
    }

}

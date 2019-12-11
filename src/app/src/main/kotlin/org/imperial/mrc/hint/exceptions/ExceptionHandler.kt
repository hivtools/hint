package org.imperial.mrc.hint.exceptions

import org.imperial.mrc.hint.AppProperties
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
import java.text.MessageFormat
import java.util.*
import javax.validation.ConstraintViolationException

@Order(Ordered.HIGHEST_PRECEDENCE)
@ControllerAdvice
class HintExceptionHandler(private val errorCodeGenerator: ErrorCodeGenerator,
                           private val appProperties: AppProperties)
    : ResponseEntityExceptionHandler() {

    override fun handleExceptionInternal(e: Exception,
                                         @Nullable body: Any?,
                                         headers: HttpHeaders,
                                         status: HttpStatus,
                                         request: WebRequest): ResponseEntity<Any> {
        logger.error(e.message)
        return unexpectedError(e, status, request)
    }

    @ExceptionHandler(HintException::class)
    protected fun handleHintException(e: HintException, request: WebRequest): ResponseEntity<Any> {
        logger.error(e.message)
        return translatedError(e.message!!, e.httpStatus, request)
    }

    @ExceptionHandler(PSQLException::class)
    protected fun handlePSQLException(e: PSQLException, request: WebRequest): ResponseEntity<Any> {
        logger.error(e.message)
        return unexpectedError(e, HttpStatus.INTERNAL_SERVER_ERROR, request)
    }

    private fun getBundle (request: WebRequest): ResourceBundle {
        val language = request.getHeader("Accept-Language") ?: "en"
        return ResourceBundle.getBundle("ErrorMessageBundle", Locale(language))
    }

    private fun translatedError(key: String, status: HttpStatus, request: WebRequest): ResponseEntity<Any> {
        val resourceBundle = getBundle(request)
        val message = if (resourceBundle.containsKey(key)) {
            resourceBundle.getString(key)
        } else {
            key
        }
        return ErrorDetail(status, message).toResponseEntity()
    }

    private fun unexpectedError(e: Exception, status: HttpStatus, request: WebRequest): ResponseEntity<Any> {
        val resourceBundle = getBundle(request)
        var message = resourceBundle.getString("unexpectedError")
        val formatter = MessageFormat(message, resourceBundle.locale)
        val messageArguments = arrayOf(
                appProperties.applicationTitle,
                errorCodeGenerator.newCode(),
                appProperties.supportEmail
        )
        message = formatter.format(messageArguments)

        val originalMessage = if (!e.message.isNullOrEmpty()) {
            listOf(e.message!!)
        } else {
            null
        }
        return ErrorDetail(status, message, originalMessage)
                .toResponseEntity()
    }

}

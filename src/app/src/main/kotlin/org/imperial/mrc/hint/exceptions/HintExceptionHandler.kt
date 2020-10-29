package org.imperial.mrc.hint.exceptions

import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.models.ErrorDetail
import org.imperial.mrc.hint.models.ErrorDetail.Companion.defaultError
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
import java.lang.reflect.UndeclaredThrowableException
import java.text.MessageFormat
import java.util.*

@Order(Ordered.HIGHEST_PRECEDENCE)
@ControllerAdvice
class HintExceptionHandler(private val errorCodeGenerator: ErrorCodeGenerator,
                           private val appProperties: AppProperties)
    : ResponseEntityExceptionHandler()
{

    override fun handleExceptionInternal(e: Exception,
                                         @Nullable body: Any?,
                                         headers: HttpHeaders,
                                         status: HttpStatus,
                                         request: WebRequest): ResponseEntity<Any>
    {
        logger.error(e.message)
        // this handles standard Spring MVC exceptions which do not contain
        // sensitive info so we return the original error message here
        return unexpectedError(status, request, e.message)
    }

    @ExceptionHandler(Exception::class)
    fun handleArbitraryException(e: Exception, request: WebRequest): ResponseEntity<Any>
    {
        val error = if (e is UndeclaredThrowableException)
        {
            e.cause
        }
        else
        {
            e
        }
        if (error is HintException)
        {
            return handleHintException(e.cause as HintException, request)
        }
        logger.error(error)
        // for security reasons we should not return arbitrary errors to the frontend
        // so do not pass the original error message here
        return unexpectedError(HttpStatus.INTERNAL_SERVER_ERROR, request)
    }

    @ExceptionHandler(HintException::class)
    fun handleHintException(e: HintException, request: WebRequest): ResponseEntity<Any>
    {
        logger.error(e.message)
        return translatedError(e.key, e.httpStatus, request)
    }

    private fun getBundle(request: WebRequest): ResourceBundle
    {
        val language = request.getHeader("Accept-Language") ?: "en"
        return ResourceBundle.getBundle("ErrorMessageBundle", Locale(language))
    }

    private fun translatedError(key: String, status: HttpStatus, request: WebRequest): ResponseEntity<Any>
    {
        val resourceBundle = getBundle(request)
        val message = if (resourceBundle.containsKey(key))
        {
            resourceBundle.getUTF8String(key)
        }
        else
        {
            key
        }
        return ErrorDetail(status, message).toResponseEntity()
    }

    private fun unexpectedError(status: HttpStatus,
                                request: WebRequest,
                                originalMessage: String? = null): ResponseEntity<Any>
    {

        val resourceBundle = getBundle(request)
        var message = resourceBundle.getUTF8String("unexpectedError")
        val formatter = MessageFormat(message)
        val messageArguments = arrayOf(
                appProperties.applicationTitle,
                errorCodeGenerator.newCode(),
                appProperties.supportEmail
        )
        message = formatter.format(messageArguments)

        val trace = if (originalMessage != null)
        {
            listOf(originalMessage)
        }
        else
        {
            null
        }
        return ErrorDetail(status, message, defaultError, trace)
                .toResponseEntity()
    }

}

// resource bundles are encoded with ISO-8859-1
fun ResourceBundle.getUTF8String(key: String): String
{
    return this.getString(key)
            .toByteArray(Charsets.ISO_8859_1)
            .toString(Charsets.UTF_8)
}

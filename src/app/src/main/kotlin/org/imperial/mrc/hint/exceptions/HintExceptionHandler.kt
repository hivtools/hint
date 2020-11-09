package org.imperial.mrc.hint.exceptions

import org.apache.commons.logging.LogFactory
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.models.ErrorDetail
import org.imperial.mrc.hint.models.ErrorDetail.Companion.defaultError
import org.springframework.beans.TypeMismatchException
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.web.HttpMediaTypeNotAcceptableException
import org.springframework.web.HttpMediaTypeNotSupportedException
import org.springframework.web.HttpRequestMethodNotSupportedException
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.MissingServletRequestParameterException
import org.springframework.web.bind.ServletRequestBindingException
import org.springframework.web.bind.annotation.ControllerAdvice
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.context.request.WebRequest
import org.springframework.web.context.request.async.AsyncRequestTimeoutException
import org.springframework.web.multipart.support.MissingServletRequestPartException
import org.springframework.web.servlet.ModelAndView
import org.springframework.web.servlet.NoHandlerFoundException
import java.lang.reflect.UndeclaredThrowableException
import java.net.BindException
import java.text.MessageFormat
import java.util.*

@Order(Ordered.HIGHEST_PRECEDENCE)
@ControllerAdvice
class HintExceptionHandler(private val errorCodeGenerator: ErrorCodeGenerator,
                           private val appProperties: AppProperties)
{
    protected val logger = LogFactory.getLog(HintExceptionHandler::class.java)!!

    @ExceptionHandler(NoHandlerFoundException::class)
    fun handleNoHandlerFoundException(error: Exception, request: WebRequest): Any
    {
        logger.error(error.message)

        val page = "404"
        return handleErrorPage(page, error, request)
    }

    @ExceptionHandler(Exception::class)
    fun handleException(e: Exception, request: WebRequest): ResponseEntity<Any>
    {
        val error = if (e is UndeclaredThrowableException)
        {
            e.cause
        }
        else
        {
            e
        }
        return if (error is HintException)
        {
            handleHintException(e.cause as HintException, request)
        }
        else
        {
            handleOtherExceptions(error, request)
        }

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

    private fun handleErrorPage(page: String, e: Exception, request: WebRequest): Any
    {
        val header = request.getHeader(HttpHeaders.ACCEPT)
        return if (header!!.contains("html"))
        {
            val model = ModelAndView(page)
            model.status = HttpStatus.NOT_FOUND
            model
        }
        else
        {
            unexpectedError(HttpStatus.NOT_FOUND, request, e.message)
        }
    }

    // resource bundles are encoded with ISO-8859-1
    fun ResourceBundle.getUTF8String(key: String): String
    {
        return this.getString(key)
                .toByteArray(Charsets.ISO_8859_1)
                .toString(Charsets.UTF_8)
    }

    fun handleOtherExceptions(error: Throwable?, request: WebRequest): ResponseEntity<Any>
    {
        val otherExceptions: ResponseEntity<Any>

        when (error)
        {
            is HttpRequestMethodNotSupportedException ->
            {
                otherExceptions = unexpectedError(HttpStatus.METHOD_NOT_ALLOWED, request, error.message)
            }
            is HttpMediaTypeNotAcceptableException ->
            {
                otherExceptions = unexpectedError(HttpStatus.NOT_ACCEPTABLE, request, error.message)
            }
            is HttpMediaTypeNotSupportedException ->
            {
                otherExceptions = unexpectedError(HttpStatus.UNSUPPORTED_MEDIA_TYPE, request, error.message)
            }
            is AsyncRequestTimeoutException ->
            {
                otherExceptions = unexpectedError(HttpStatus.SERVICE_UNAVAILABLE, request, error.message)
            }
            is MissingServletRequestParameterException ->
            {
                otherExceptions = unexpectedError(HttpStatus.BAD_REQUEST, request, error.message)
            }
            is ServletRequestBindingException ->
            {
                otherExceptions = unexpectedError(HttpStatus.BAD_REQUEST, request, error.message)
            }
            is TypeMismatchException ->
            {
                otherExceptions = unexpectedError(HttpStatus.BAD_REQUEST, request, error.message)
            }
            is HttpMessageNotReadableException ->
            {
                otherExceptions = unexpectedError(HttpStatus.BAD_REQUEST, request, error.message)
            }
            is MethodArgumentNotValidException ->
            {
                otherExceptions = unexpectedError(HttpStatus.BAD_REQUEST, request, error.message)
            }
            is MissingServletRequestPartException ->
            {
                otherExceptions = unexpectedError(HttpStatus.BAD_REQUEST, request, error.message)
            }
            is BindException ->
            {
                otherExceptions = unexpectedError(HttpStatus.BAD_REQUEST, request, error.message)
            }
            else
            -> {
                logger.error(error)

                // for security reasons we should not return arbitrary errors to the frontend
                // so do not pass the original error message here
                otherExceptions = unexpectedError(HttpStatus.INTERNAL_SERVER_ERROR, request)
            }
        }
        return otherExceptions
    }
}

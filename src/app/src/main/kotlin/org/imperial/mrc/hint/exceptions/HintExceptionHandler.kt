package org.imperial.mrc.hint.exceptions

import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.models.ErrorDetail
import org.imperial.mrc.hint.models.ErrorDetail.Companion.defaultError
import org.springframework.beans.ConversionNotSupportedException
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotWritableException
import org.springframework.web.HttpMediaTypeNotAcceptableException
import org.springframework.web.HttpMediaTypeNotSupportedException
import org.springframework.web.HttpRequestMethodNotSupportedException
import org.springframework.web.bind.MissingPathVariableException
import org.springframework.web.bind.annotation.ControllerAdvice
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.context.request.WebRequest
import org.springframework.web.context.request.async.AsyncRequestTimeoutException
import org.springframework.web.servlet.ModelAndView
import org.springframework.web.servlet.NoHandlerFoundException
import java.lang.reflect.UndeclaredThrowableException
import java.text.MessageFormat
import java.util.*

@Order(Ordered.HIGHEST_PRECEDENCE)
@ControllerAdvice
class HintExceptionHandler(private val errorCodeGenerator: ErrorCodeGenerator,
                           private val appProperties: AppProperties)
{

    @ExceptionHandler(Exception::class)
    fun handleArbitraryException(e: Exception, request: WebRequest): Any
    {
        val error = if (e is UndeclaredThrowableException)
        {
            e.cause
        }
        else
        {
            e
        }

        when (error)
        {
            is HintException ->
            {
                return handleHintException(e.cause as HintException, request)
            }
            is HttpRequestMethodNotSupportedException ->
            {
                return unexpectedError(HttpStatus.METHOD_NOT_ALLOWED, request)
            }
            is HttpMediaTypeNotAcceptableException ->
            {
                return unexpectedError(HttpStatus.NOT_ACCEPTABLE, request)
            }
            is HttpMediaTypeNotSupportedException ->
            {
                return unexpectedError(HttpStatus.UNSUPPORTED_MEDIA_TYPE, request)
            }
            is AsyncRequestTimeoutException ->
            {
                return unexpectedError(HttpStatus.SERVICE_UNAVAILABLE, request)
            }
            is MissingPathVariableException ->
            {
                return unexpectedError(HttpStatus.INTERNAL_SERVER_ERROR, request)
            }
            is ConversionNotSupportedException ->
            {
                return unexpectedError(HttpStatus.INTERNAL_SERVER_ERROR, request)
            }
            is HttpMessageNotWritableException ->
            {
                return unexpectedError(HttpStatus.INTERNAL_SERVER_ERROR, request)
            }
            is NoHandlerFoundException ->
            {
                return viewErrorPage("404")
            }
            else

                //logger.error(error)
                // for security reasons we should not return arbitrary errors to the frontend
                // so do not pass the original error message here
            -> return unexpectedError(HttpStatus.BAD_REQUEST, request)
        }
    }

    @ExceptionHandler(HintException::class)
    fun handleHintException(e: HintException, request: WebRequest): ResponseEntity<Any>
    {
        //logger.error(e.message)
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

    private fun viewErrorPage(page: String): ModelAndView
    {
        return ModelAndView(page)
    }

    // resource bundles are encoded with ISO-8859-1
    fun ResourceBundle.getUTF8String(key: String): String
    {
        return this.getString(key)
                .toByteArray(Charsets.ISO_8859_1)
                .toString(Charsets.UTF_8)
    }

}

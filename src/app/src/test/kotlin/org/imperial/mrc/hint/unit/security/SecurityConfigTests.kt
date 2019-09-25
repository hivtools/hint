package org.imperial.mrc.hint.unit.security

import com.nhaarman.mockito_kotlin.any
import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import com.nhaarman.mockito_kotlin.verify
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.MvcConfig
import org.junit.jupiter.api.Test
import org.mockito.internal.verification.Times
import org.springframework.web.servlet.config.annotation.InterceptorRegistration
import org.springframework.web.servlet.config.annotation.InterceptorRegistry

class SecurityConfigTests {

    @Test
    fun `adds security filter`() {

        val sut = MvcConfig(mock())

        val mockNestedInterceptor = mock<InterceptorRegistration>()
        val mockInterceptor = mock<InterceptorRegistration>() {
            on { addPathPatterns("/**") } doReturn mockNestedInterceptor
        }
        val interceptors = mock<InterceptorRegistry>()
        {
            on { addInterceptor(any()) } doReturn mockInterceptor
        }
        sut.addInterceptors(interceptors)
        verify(interceptors).addInterceptor(any())
    }

}
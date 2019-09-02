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
    fun `adds security filter when useAuth is true`() {
        val mockProps = mock<AppProperties> {
            on { useAuth } doReturn true
        }
        val sut = MvcConfig(mock(), mockProps)

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

    @Test
    fun `does not add security filter when useAuth is false`() {
        val mockProps = mock<AppProperties> {
            on { useAuth } doReturn false
        }
        val sut = MvcConfig(mock(), mockProps)

        val interceptors = mock<InterceptorRegistry>()
        sut.addInterceptors(interceptors)

        verify(interceptors, Times(0)).addInterceptor(any())
    }

}
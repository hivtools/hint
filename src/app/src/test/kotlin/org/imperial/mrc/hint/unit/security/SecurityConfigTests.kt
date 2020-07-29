package org.imperial.mrc.hint.unit.security

import com.nhaarman.mockito_kotlin.*
import org.imperial.mrc.hint.MvcConfig
import org.junit.jupiter.api.Test
import org.springframework.web.servlet.config.annotation.InterceptorRegistration
import org.springframework.web.servlet.config.annotation.InterceptorRegistry

class SecurityConfigTests {

    @Test
    fun `adds security filter`() {

        val sut = MvcConfig(mock())

        val mockNestedInterceptor = mock<InterceptorRegistration>()
        val mockInterceptor = mock<InterceptorRegistration>() {
            on { addPathPatterns("/adr/**") } doReturn mockNestedInterceptor
        }
        val interceptors = mock<InterceptorRegistry>()
        {
            on { addInterceptor(any()) } doReturn mockInterceptor
        }
        sut.addInterceptors(interceptors)
        verify(interceptors, times(1)).addInterceptor(any())
    }

}

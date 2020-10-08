package org.imperial.mrc.hint.unit.security

import com.nhaarman.mockito_kotlin.*
import org.imperial.mrc.hint.MvcConfig
import org.imperial.mrc.hint.utils.SecurePaths
import org.junit.jupiter.api.Test
import org.springframework.web.servlet.config.annotation.InterceptorRegistration
import org.springframework.web.servlet.config.annotation.InterceptorRegistry

class SecurityConfigTests
{

    @Test
    fun `adds security filter`()
    {
        val sut = MvcConfig(mock())
        val mockInterceptorProject = mock<InterceptorRegistration>() {
            on { addPathPatterns(SecurePaths.ADD.pathList()) } doReturn mock<InterceptorRegistration>()
        }
        val interceptors = mock<InterceptorRegistry>()
        {
            on { addInterceptor(any()) } doReturn mockInterceptorProject
        }
        sut.addInterceptors(interceptors)
        verify(interceptors, times(1)).addInterceptor(any())
        verify(mockInterceptorProject, times(1)).addPathPatterns(SecurePaths.ADD.pathList())
    }

}

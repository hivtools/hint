package org.imperial.mrc.hint.unit.templates

import org.assertj.core.api.Assertions
import org.junit.jupiter.api.Test
import org.springframework.ui.ConcurrentModel

class ForgotPasswordTests {
    companion object {
        val template = FreemarkerTemplateLoader("forgot-password.ftl")

    }

    @Test
    fun `renders as expected`() {
        val doc = ForgotPasswordTests.template.jsoupDocFor(ConcurrentModel())

        Assertions.assertThat(doc.select("title").text()).isEqualTo("Forgot password")
        Assertions.assertThat(doc.select("#app").count()).isEqualTo(1)
    }
}
package org.imperial.mrc.hint.unit.emails

import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.emails.MustacheEmailTemplate
import org.junit.jupiter.api.Test

class MustacheEmailTests
{

    class TestMustacheEmailTemplate : MustacheEmailTemplate()
    {
        override val subject = "Welcome to {{app}}"

        //These files are in the resources for the test module
        override val textTemplate = "mustache-email-test.txt"
        override val htmlTemplate = "mustache-email-test.html"
    }

    val values = mapOf(
            "testKey1" to "testValue1",
            "testKey2" to "testValue2",
            "app" to "TestApp"
    )

    @Test
    fun `can generate text email`()
    {
        val sut = TestMustacheEmailTemplate().emailData(values)
        val result = sut.text
        assertThat(result).isEqualTo("This is a test text email with testValue1 and testValue2")
    }

    @Test
    fun `can generate html email`()
    {
        val sut = TestMustacheEmailTemplate().emailData(values)
        val result = sut.html
        assertThat(result).isEqualTo("""<html>
<head>
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type"/>
</head>
<body>
This is a test text email with testValue1 and testValue2
</body>
</html>""")
    }

    @Test
    fun `can generate subject from template`()
    {
        val sut = TestMustacheEmailTemplate().emailData(values)
        val result = sut.subject
        assertThat(result).isEqualTo("Welcome to TestApp")
    }

}
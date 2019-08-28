package org.imperial.mrc.hint.unit.emails

import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.emails.MustacheEmail
import org.junit.jupiter.api.Test

class MustacheEmailTests
{

    class TestMustacheEmail: MustacheEmail() {
        override val subject = "Test Subjext"
        //These files are in the resources for the test module
        override val textTemplate = "mustache-email-test.txt"
        override val htmlTemplate = "mustache-email-test.html"

        override val values = mapOf(
                "testKey1" to "testValue1",
                "testKey2" to "testValue2"
        )
    }

    @Test
    fun `can generate text email`()
    {
        val sut = TestMustacheEmail()
        val result = sut.text()
        assertThat(result).isEqualTo("This is a test text email with testValue1 and testValue2")
    }

    @Test
    fun `can generate html email`()
    {
        val sut = TestMustacheEmail()
        val result = sut.html()
        assertThat(result).isEqualTo("""<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
</head>
<body>
This is a test text email with testValue1 and testValue2
</body>
</html>""")
    }
}
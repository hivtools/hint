package org.imperial.mrc.hint.unit.templates

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.ui.ConcurrentModel

class LoginTests
{
    companion object
    {
        val template = FreemarkerTemplateLoader("login.ftl")
    }

    @Test
    fun `renders login form correctly with error`()
    {
        val model = ConcurrentModel()
        model["oauth2LoginMethod"] = false
        model["username"] = "test user"
        model["error"] = "test error"
        model["title"] = "test title"
        model["appTitle"] = "Naomi"
        model["continueTo"] = "/"
        val doc = template.jsoupDocFor(model)

        assertThat(doc.select("form").attr("onsubmit")).isEqualTo("validate(event);")

        assertThat(doc.select("form label[for='user-id']").text()).isEqualTo("Username (email address)")
        assertThat(doc.select("form #user-id").attr("value")).isEqualTo("test user")
        assertThat(doc.select("form #user-id").attr("type")).isEqualTo("text")
        assertThat(doc.select("form #userid-feedback").hasClass("invalid-feedback")).isTrue()
        assertThat(doc.select("form #userid-feedback").text()).isEqualTo("Please enter your username.")

        assertThat(doc.select("form label[for='pw-id']").text()).isEqualTo("Password")
        assertThat(doc.select("form #pw-id").attr("value")).isEqualTo("")
        assertThat(doc.select("form #pw-id").attr("type")).isEqualTo("password")
        assertThat(doc.select("form #pw-feedback").hasClass("invalid-feedback")).isTrue()
        assertThat(doc.select("form #pw-feedback").text()).isEqualTo("Please enter your password.")

        assertThat(doc.select("form input[type='submit']").attr("value")).isEqualTo("Log In")
        assertThat(doc.select("#error").text()).isEqualTo("test error")

        assertThat(doc.select("#forgot-password").text()).isEqualTo("Forgotten your password?")
        assertThat(doc.select("#forgot-password a").attr("href")).isEqualTo("/password/forgot-password/")

        assertThat(doc.select("#register-an-account").text()).isEqualTo("Don't have an account? Request an account")
        assertThat(doc.select("#register-an-account a").attr("href")).isEqualTo("https://forms.office.com/r/7S9EMigGr4")

        assertThat(doc.select("#continue-as-guest").text()).isEqualTo("OR Continue as guest")
        assertThat(doc.select("#continue-as-guest a").attr("href")).isEqualTo("/")
        assertThat(doc.select("#continue-as-guest a").attr("onclick")).isEqualTo("continueAsGuest()")
    }

    @Test
    fun `renders login form correctly without error`()
    {
        val model = ConcurrentModel()
        model["oauth2LoginMethod"] = false
        model["username"] = ""
        model["error"] = ""
        model["title"] = "test title"
        model["appTitle"] = "Naomi"
        model["continueTo"] = "/"
        val doc = template.jsoupDocFor(model)

        assertThat(doc.select("form label[for='user-id']").text()).isEqualTo("Username (email address)")
        assertThat(doc.select("form #user-id").attr("value")).isEqualTo("")

        assertThat(doc.select("form label[for='pw-id']").text()).isEqualTo("Password")
        assertThat(doc.select("form #pw-id").attr("value")).isEqualTo("")

        assertThat(doc.select("form input[type='submit']").attr("value")).isEqualTo("Log In")
        assertThat(doc.select("#error").count()).isEqualTo(0)
    }

    @Test
    fun `renders title and partner logos without error`()
    {
        val model = ConcurrentModel()
        model["oauth2LoginMethod"] = false
        model["username"] = ""
        model["error"] = ""
        model["title"] = "test title"
        model["appTitle"] = "Naomi"
        model["continueTo"] = "/"
        val doc = template.jsoupDocFor(model)

        assertThat(doc.select("h1").count()).isEqualTo(1)
        assertThat(doc.select("h1").text()).isEqualTo("Naomi")
        assertThat(doc.select("a[href='https://www.unaids.org'] img").attr("src")).isEqualTo("public/images/unaids_logo.png")
        assertThat(doc.select("a[href='https://www.imperial.ac.uk'] img").attr("src")).isEqualTo("public/images/imperial_logo.png")
        assertThat(doc.select("a[href='https://github.com/reside-ic'] img").attr("src")).isEqualTo("public/images/reside_logo.png")
        assertThat(doc.select("a[href='https://www.washington.edu'] img").attr("src")).isEqualTo("public/images/uw_logo.png")
        assertThat(doc.select("a[href='https://www.fjelltopp.org'] img").attr("src")).isEqualTo("public/images/fjelltopp_logo.png")
        assertThat(doc.select("a[href='https://www.avenirhealth.org'] img").attr("src")).isEqualTo("public/images/avenir_logo.png")
    }

    @Test
    fun `renders correctly for data exploration`()
    {
        val model = ConcurrentModel()
        model["oauth2LoginMethod"] = false
        model["username"] = ""
        model["error"] = ""
        model["title"] = "test title"
        model["appTitle"] = "Naomi Data Exploration"
        model["continueTo"] = "/callback/explore"
        val doc = template.jsoupDocFor(model)

        assertThat(doc.select("h1").count()).isEqualTo(1)
        assertThat(doc.select("h1").text()).isEqualTo("Naomi Data Exploration")
        assertThat(doc.select("#continue-as-guest a").attr("href")).isEqualTo("/callback/explore")
    }

    @Test
    fun `renders oauth2 login page correctly`()
    {
        val model = ConcurrentModel()
        model["oauth2LoginMethod"] = true
        model["username"] = ""
        model["error"] = ""
        model["title"] = "test title"
        model["appTitle"] = "Naomi"
        model["continueTo"] = "/"
        val doc = template.jsoupDocFor(model)

        assertThat(doc.select("input[type='submit']").attr("value")).isEqualTo("Log in with your HIV Tools Single Sign-On account")
        assertThat(doc.select("input[type='submit']").attr("onclick")).isEqualTo("oauth2Callback()")
        assertThat(doc.select("#error").count()).isEqualTo(0)
        assertThat(doc.select("#register-oauth2-account").text()).isEqualTo("Don't have an account? Request an account")
        assertThat(doc.select("#register-oauth2-account a").attr("href")).isEqualTo("/register")

        assertThat(doc.select("#continue-as-guest").text()).isEqualTo("OR Continue as guest")
        assertThat(doc.select("#continue-as-guest a").attr("href")).isEqualTo("/")
        assertThat(doc.select("#continue-as-guest a").attr("onclick")).isEqualTo("continueAsGuest()")
    }

}

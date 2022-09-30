package org.imperial.mrc.hint.security

import org.imperial.mrc.hint.logic.DbProfileServiceUserLogic.Companion.GUEST_USER
import org.imperial.mrc.hint.security.oauth2.clients.HintClientsContext
import org.imperial.mrc.hint.security.oauth2.clients.OAuth2Client
import org.pac4j.core.client.Clients
import org.pac4j.core.config.Config
import org.pac4j.core.context.WebContext
import org.pac4j.core.context.session.SessionStore
import org.pac4j.core.http.callback.PathParameterCallbackUrlResolver
import org.pac4j.core.profile.CommonProfile
import org.pac4j.core.profile.ProfileManager
import org.pac4j.core.util.Pac4jConstants
import org.pac4j.http.client.indirect.FormClient
import org.pac4j.jee.context.session.JEESessionStore
import org.pac4j.oauth.config.OAuth20Configuration.STATE_REQUEST_PARAMETER
import org.pac4j.sql.profile.service.DbProfileService
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.ComponentScan
import org.springframework.context.annotation.Configuration
import org.springframework.jdbc.datasource.TransactionAwareDataSourceProxy
import org.springframework.stereotype.Component
import java.util.*
import javax.sql.DataSource


@Configuration
@ComponentScan(basePackages = ["org.pac4j.springframework.web", "org.pac4j.springframework.component"])
class Pac4jConfig
{

    @Bean
    fun getProfileService(dataSource: DataSource): HintDbProfileService
    {
        return HintDbProfileService(TransactionAwareDataSourceProxy(dataSource), SecurePasswordEncoder())
    }

    @Bean
    fun getPac4jConfig(profileService: DbProfileService): Config
    {
        val auth2Client = HintClientsContext(OAuth2Client())
        val formClient = FormClient("/login", profileService)

        formClient.callbackUrlResolver = PathParameterCallbackUrlResolver()
        val clients = Clients("/callback", formClient, auth2Client.getIndirectClient())
        return Config(clients).apply {
            sessionStore = JEESessionStore.INSTANCE
        }
    }
}

@Component
class Session(
    private val webContext: WebContext,
    private val pac4jConfig: Config,
    private val sessionStore: SessionStore)
{

    companion object
    {
        private const val VERSION_ID = "version_id"
        private const val MODE = "mode"
    }

    fun generateStateParameter(): String
    {
        val state = UUID.randomUUID().toString()
        sessionStore.set(webContext, STATE_REQUEST_PARAMETER, state)
        return Base64.getEncoder().encodeToString(state.toByteArray())
    }

    fun getUserProfile(): CommonProfile
    {
        val manager = ProfileManager(webContext, sessionStore)
        return (manager.profiles.singleOrNull() ?: CommonProfile().apply {
            id = GUEST_USER
        }) as CommonProfile
    }

    fun userIsGuest(): Boolean
    {
        return getUserProfile().id == GUEST_USER
    }

    fun setMode(mode: String)
    {
        val savedMode = pac4jConfig.sessionStore.get(webContext, MODE).orElse(null)
        if (savedMode != mode)
        {
            // If mode has changed, clear the session version id too
            pac4jConfig.sessionStore.set(webContext, MODE, mode)
            setVersionId(null)
        }
    }

    fun setRequestedUrl(url: String?)
    {
        pac4jConfig.sessionStore.set(webContext, Pac4jConstants.REQUESTED_URL, url)
    }

    fun getVersionId(): String
    {
        //Generate a new id if none exists
        var versionId = pac4jConfig.sessionStore.get(webContext, VERSION_ID).orElse(null)

        if (versionId == null)
        {
            versionId = generateVersionId()
            setVersionId(versionId)
        }
        return versionId.toString()
    }

    fun setVersionId(value: String?)
    {
        pac4jConfig.sessionStore.set(webContext, VERSION_ID, value)
    }

    fun generateVersionId(): String
    {
        return UUID.randomUUID().toString()
    }
}


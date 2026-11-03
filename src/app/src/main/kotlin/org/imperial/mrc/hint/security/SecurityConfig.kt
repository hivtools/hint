package org.imperial.mrc.hint.security

import org.imperial.mrc.hint.db.UserRepository
import org.imperial.mrc.hint.db.VersionRepository
import org.imperial.mrc.hint.exceptions.InvalidVersionException
import org.imperial.mrc.hint.logic.DbProfileServiceUserLogic.Companion.GUEST_USER
import org.imperial.mrc.hint.security.github.GitHubAuthenticator
import org.pac4j.core.config.Config
import org.pac4j.core.context.WebContext
import org.pac4j.core.context.session.SessionStore
import org.pac4j.core.profile.CommonProfile
import org.pac4j.core.profile.ProfileManager
import org.pac4j.core.util.Pac4jConstants
import org.pac4j.oauth.config.OAuth20Configuration.STATE_REQUEST_PARAMETER
import org.pac4j.oauth.profile.OAuth20Profile
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
    fun getPac4jConfig(
        profileService: DbProfileService,
        userRepository: UserRepository,
        githubAuthenticator: GitHubAuthenticator
    ): Config
    {
        return HintPac4jConfigService(profileService, userRepository, githubAuthenticator).getConfig()
    }
}

@Component
class Session(
    private val webContext: WebContext,
    private val pac4jConfig: Config,
    private val sessionStore: SessionStore,
    private val versionRepository: VersionRepository)
{

    companion object
    {
        const val VERSION_ID_HEADER = "X-Version-Id"
        private const val VERSION_ID = "version_id"
        private const val GUEST_VERSION_IDS = "guest_version_ids"
        private const val ACCESS_TOKEN = "access_token"
    }

    fun generateStateParameter(): String
    {
        val state = UUID.randomUUID().toString()
        val encodedState = Base64.getEncoder().encodeToString(state.toByteArray())
        sessionStore.set(webContext, STATE_REQUEST_PARAMETER, encodedState)
        return encodedState
    }

    fun getUserProfile(): CommonProfile
    {
        val manager = ProfileManager(webContext, sessionStore)
        return (manager.profiles.singleOrNull() ?: CommonProfile().apply {
            id = GUEST_USER
        }) as CommonProfile
    }

    fun getAccessToken(): String
    {
        val manager = ProfileManager(webContext, sessionStore)

        val profile = manager.profiles.singleOrNull() ?: OAuth20Profile()

        val token = profile.getAttribute(ACCESS_TOKEN) ?: ""

        return token.toString()
    }

    fun userIsGuest(): Boolean
    {
        return getUserProfile().id == GUEST_USER
    }

    fun setRequestedUrl(url: String?)
    {
        pac4jConfig.sessionStore.set(webContext, Pac4jConstants.REQUESTED_URL, url)
    }

    /**
     * The version this request works on. The X-Version-Id header names it, and the user must be allowed to use it.
     * Without the header, the version stored in the session is used. That fallback is temporary, for browser tabs
     * that were loaded before the header existed.
     */
    fun getVersionId(): String
    {
        val requested = getRequestedVersionId() ?: return getSessionVersionId()
        if (!canUseVersion(requested))
        {
            throw InvalidVersionException()
        }
        return requested
    }

    fun getRequestedVersionId(): String?
    {
        return webContext.getRequestHeader(VERSION_ID_HEADER).orElse(null)?.takeIf { it.isNotBlank() }
    }

    fun getSessionVersionId(): String
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

    private fun canUseVersion(versionId: String): Boolean
    {
        val userId = getUserProfile().id
        return if (userId == GUEST_USER)
        {
            getGuestVersionIds().contains(versionId)
        }
        else
        {
            versionRepository.versionExists(versionId, userId)
        }
    }

    fun addGuestVersionId(versionId: String)
    {
        sessionStore.set(webContext, GUEST_VERSION_IDS, ArrayList(getGuestVersionIds() + versionId))
    }

    fun getGuestVersionIds(): List<String>
    {
        @Suppress("UNCHECKED_CAST")
        return sessionStore.get(webContext, GUEST_VERSION_IDS).orElse(null) as List<String>? ?: listOf()
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

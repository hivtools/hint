package org.imperial.mrc.hint.security

import org.imperial.mrc.hint.controllers.ADRController
import org.imperial.mrc.hint.db.UserRepository
import org.imperial.mrc.hint.emails.WriteToDiskEmailManager
import org.imperial.mrc.hint.logging.GenericLogger
import org.imperial.mrc.hint.logging.GenericLoggerImpl
import org.imperial.mrc.hint.logic.DbProfileServiceUserLogic.Companion.GUEST_USER
import org.pac4j.core.config.Config
import org.pac4j.core.context.WebContext
import org.pac4j.core.context.session.SessionStore
import org.pac4j.core.profile.CommonProfile
import org.pac4j.core.profile.ProfileManager
import org.pac4j.core.util.Pac4jConstants
import org.pac4j.oauth.config.OAuth20Configuration.STATE_REQUEST_PARAMETER
import org.pac4j.oauth.profile.OAuth20Profile
import org.pac4j.sql.profile.service.DbProfileService
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.ComponentScan
import org.springframework.context.annotation.Configuration
import org.springframework.jdbc.datasource.TransactionAwareDataSourceProxy
import org.springframework.stereotype.Component
import java.nio.file.Path
import java.nio.file.Paths
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
    fun getPac4jConfig(profileService: DbProfileService, userRepository: UserRepository): Config
    {
        return HintPac4jConfigService(profileService, userRepository).getConfig()
    }
}

@Component
class Session(
    private val webContext: WebContext,
    private val pac4jConfig: Config,
    private val sessionStore: SessionStore
)
{

    companion object
    {
        private val logger = LoggerFactory.getLogger(Session::class.java)
        private const val VERSION_ID = "version_id"
        private const val ACCESS_TOKEN = "access_token"
        private const val CALIBRATE_PATH = "calibrate_path"
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

    fun setCalibrateDataPath(path: Path)
    {
        logger.info("Setting path to $path")
        pac4jConfig.sessionStore.set(webContext, CALIBRATE_PATH, path.toAbsolutePath().toString())
    }

    fun getCalibrateDataPath(): Path?
    {
        val path = pac4jConfig.sessionStore.get(webContext, CALIBRATE_PATH)
            .map { it as? String }
            .orElse(null)

        logger.info("Getting calibrate path: $path")

        return path?.let { Paths.get(it) }
    }
}

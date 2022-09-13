package org.imperial.mrc.hint.userCLI

import org.docopt.Docopt
import org.imperial.mrc.hint.ConfiguredAppProperties
import org.imperial.mrc.hint.db.DbConfig
import org.imperial.mrc.hint.db.JooqTokenRepository
import org.imperial.mrc.hint.db.JooqUserRepository
import org.imperial.mrc.hint.emails.EmailConfig
import org.imperial.mrc.hint.logic.DbProfileServiceUserLogic
import org.imperial.mrc.hint.logic.UserLogic
import org.imperial.mrc.hint.security.HintDbProfileService
import org.imperial.mrc.hint.security.SecurePasswordEncoder
import org.imperial.mrc.hint.security.tokens.KeyHelper
import org.imperial.mrc.hint.security.tokens.OneTimeTokenManager
import org.jooq.SQLDialect
import org.jooq.impl.DSL
import org.pac4j.jwt.config.signature.RSASignatureConfiguration
import org.pac4j.jwt.credentials.authenticator.JwtAuthenticator
import java.util.*
import javax.sql.DataSource
import kotlin.system.exitProcess
import org.imperial.mrc.hint.logging.GenericLogger
import org.imperial.mrc.hint.logging.GenericLoggerImpl

const val doc = """
Hint User CLI
Usage:
    app add-user <email> [<password>]
    app remove-user <email>
    app user-exists <email>
"""

fun main(args: Array<String>) {
    val options = Docopt(doc).parse(args.toList())
    val addUser = options["add-user"] as Boolean
    val removeUser = options["remove-user"] as Boolean
    val userExists = options["user-exists"] as Boolean

    val dataSource = DbConfig().dataSource(ConfiguredAppProperties())

    fun errorOutputStream(msg: String)
    {
        try
        {
   // When an exception is thrown in UserLogic with key userExists, userCLI 
   // expects the key, which it then uses to get resource bundle. However,      
   //  the UserException handler for UserLogic extends HintException where   
   // additional text is appended: "HintException with key $key" so the resource
   // would not be found in the bundle.
   // After pac4j upgrade, this issue caused corruption of the profile if not dealt
   // with gracefully, hence extracting final word here. See associated ticket 
   // mrc-3549  

            val resources = ResourceBundle.getBundle("ErrorMessageBundle", Locale("en"))
            val message = resources.getString(msg.takeLastWhile { it.isLetter() })
            System.err.println(message)
        } catch (e: MissingResourceException)
        {
            System.err.println("Could not load ErrorMessageBundle: $msg")
        }
    }

    try {
        val userCLI = UserCLI(getUserLogic(dataSource))
        val result = when {
            addUser -> userCLI.addUser(options)
            removeUser -> userCLI.removeUser(options)
            userExists -> userCLI.userExists(options)
            else -> ""
        }

        println(result)
    } catch (e: Exception)
    {
        e.message?.let { errorOutputStream(it) }
        exitProcess(1)
    } finally
    {
        dataSource.connection.close()
    }
}

class UserCLI(private val userLogic: UserLogic) {
    fun addUser(options: Map<String, Any>): String {
        val email = options["<email>"].getStringValue()
        val password = options["<password>"]?.getStringValue()
        println("Adding user $email")

        userLogic.addUser(email, password)
        return "OK"
    }

    fun removeUser(options: Map<String, Any>): String {
        val email = options["<email>"].getStringValue()
        println("Removing user $email")


        userLogic.removeUser(email)
        return "OK"
    }

    fun userExists(options: Map<String, Any>): String {

        val email = options["<email>"].getStringValue()
        println("Checking if user exists: $email")

        val exists = userLogic.getUser(email) != null
        return exists.toString()
    }

    private fun Any?.getStringValue(): String {
        return this.toString().replace("[", "").replace("]", "")
    }
}

fun getUserLogic(dataSource: DataSource): UserLogic {

    val profileService = HintDbProfileService(dataSource, SecurePasswordEncoder())

    val dslContext = DSL.using(dataSource.connection, SQLDialect.POSTGRES)
    val appProperties = ConfiguredAppProperties()
    val logger: GenericLogger = GenericLoggerImpl()

    val userRepository = JooqUserRepository(dslContext)
    val tokenRepository = JooqTokenRepository(dslContext)
    val signatureConfig = RSASignatureConfiguration(KeyHelper.keyPair)

    val oneTimeTokenManager = OneTimeTokenManager(appProperties,
            tokenRepository,
            signatureConfig,
            JwtAuthenticator(signatureConfig))

    return DbProfileServiceUserLogic(userRepository,
            profileService,
            EmailConfig().getEmailManager(appProperties, oneTimeTokenManager, logger))
}

package org.imperial.mrc.hint.userCLI

import org.docopt.Docopt
import org.imperial.mrc.hint.ConfiguredAppProperties
import org.imperial.mrc.hint.db.DbConfig
import org.imperial.mrc.hint.db.JooqTokenRepository
import org.imperial.mrc.hint.db.JooqUserRepository
import org.imperial.mrc.hint.db.Tables
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

const val doc = """
Hint User CLI
Usage:
    app add-user <email> [<password>]
    app remove-user <email>
    app user-exists <email>
    app migrate-accounts
"""

fun main(args: Array<String>) {
    val options = Docopt(doc).parse(args.toList())
    val addUser = options["add-user"] as Boolean
    val removeUser = options["remove-user"] as Boolean
    val userExists = options["user-exists"] as Boolean
    val migrateAccounts = options["migrate-accounts"] as Boolean

    val dataSource = DbConfig().dataSource(ConfiguredAppProperties())

    try {
        val userCLI = UserCLI(getUserLogic(dataSource))
        val result = when {
            addUser -> userCLI.addUser(options)
            removeUser -> userCLI.removeUser(options)
            userExists -> userCLI.userExists(options)
            migrateAccounts -> migrateAccounts(dataSource)
            else -> ""
        }

        println(result)
    } catch (e: Exception) {
        val resources = ResourceBundle.getBundle("ErrorMessageBundle", Locale("en"))
        System.err.println(resources.getString(e.message!!))
        exitProcess(1)
    } finally {
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

fun migrateAccounts(dataSource: DataSource): String {
    val seen = mutableListOf<String>()
    DSL.using(dataSource.connection, SQLDialect.POSTGRES).transaction { config ->
        val transaction = DSL.using(config)
        val ids = transaction.select(Tables.USERS.ID).from(Tables.USERS).fetch(Tables.USERS.ID)
        for (id in ids) {
            if (seen.contains(id.toLowerCase())) {
                continue
            }
            val allIDs = transaction.select(Tables.USERS.ID, Tables.ADR_KEY.API_KEY, DSL.count(Tables.PROJECT))
                    .from(Tables.USERS
                            .leftJoin(Tables.PROJECT).on(Tables.USERS.ID.eq(Tables.PROJECT.USER_ID))
                            .leftJoin(Tables.ADR_KEY).on(Tables.USERS.ID.eq(Tables.ADR_KEY.USER_ID))
                    )
                    .where(DSL.lower(Tables.USERS.ID).eq(id.toLowerCase()))
                    .groupBy(Tables.USERS.ID, Tables.ADR_KEY.API_KEY)
                    .orderBy(DSL.count(Tables.PROJECT).desc(), Tables.USERS.ID.asc())
                    .fetch()
            if (allIDs.size > 1) {
                val primaryID = allIDs[0][Tables.USERS.ID]
                allIDs.getValues(Tables.USERS.ID).drop(1).forEach { secondaryID ->
                    transaction.update(Tables.PROJECT)
                            .set(Tables.PROJECT.USER_ID, primaryID)
                            .where(Tables.PROJECT.USER_ID.eq(secondaryID))
                            .execute()
                    transaction.update(Tables.USER_SESSION)
                            .set(Tables.USER_SESSION.USER_ID, primaryID)
                            .where(Tables.USER_SESSION.USER_ID.eq(secondaryID))
                            .execute()
                    transaction.delete(Tables.USERS)
                            .where(Tables.USERS.ID.eq(secondaryID))
                            .execute()
                    println("$secondaryID -> $primaryID")
                }
            }
            seen.add(id.toLowerCase())
        }
    }
    return "OK"
}

fun getUserLogic(dataSource: DataSource): UserLogic {

    val profileService = HintDbProfileService(dataSource, SecurePasswordEncoder())

    val dslContext = DSL.using(dataSource.connection, SQLDialect.POSTGRES)
    val appProperties = ConfiguredAppProperties()

    val userRepository = JooqUserRepository(dslContext)
    val tokenRepository = JooqTokenRepository(dslContext)
    val signatureConfig = RSASignatureConfiguration(KeyHelper.keyPair)

    val oneTimeTokenManager = OneTimeTokenManager(appProperties,
            tokenRepository,
            signatureConfig,
            JwtAuthenticator(signatureConfig))

    return DbProfileServiceUserLogic(userRepository,
            profileService,
            EmailConfig().getEmailManager(appProperties, oneTimeTokenManager))
}

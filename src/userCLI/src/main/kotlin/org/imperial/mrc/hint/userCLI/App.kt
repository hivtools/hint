package org.imperial.mrc.hint.userCLI

import org.docopt.Docopt
import org.imperial.mrc.hint.db.DbConfig
import org.imperial.mrc.hint.db.DbProfileServiceUserRepository
import org.imperial.mrc.hint.security.HintDbProfileService
import org.imperial.mrc.hint.security.SecurePasswordEncoder
import javax.sql.DataSource
import kotlin.system.exitProcess

const val doc = """
Hint User CLI
Usage:
    app add-user <email> <password>
    app remove-user <email>
    app user-exists <email>
"""

fun main(args: Array<String>) {
    val options = Docopt(doc).parse(args.toList())
    val addUser = options["add-user"] as Boolean
    val removeUser = options["remove-user"] as Boolean
    val userExists = options["user-exists"] as Boolean
    val props = DatabaseProperties()
    val dataSource = DbConfig().dataSource(props.url, props.user, props.password)

    try {
        val userCLI = UserCLI(dataSource)
        val result = when {
            addUser -> userCLI.addUser(options)
            removeUser -> userCLI.removeUser(options)
            userExists -> userCLI.userExists(options)
            else -> ""
        }

        println(result)
    } catch (e: Exception) {
        System.err.println(e.message)
        exitProcess(1)
    }
    finally {
        dataSource.connection.close()
    }
}

class UserCLI(dataSource: DataSource) {

    private val profileService = HintDbProfileService(dataSource, SecurePasswordEncoder())
    private val userRepository = DbProfileServiceUserRepository(profileService)

    fun addUser(options: Map<String, Any>): String {

        val email = options["<email>"].getStringValue()
        val password = options["<password>"].getStringValue()
        println("Adding user $email")

        userRepository.addUser(email, password)
        return "OK"
    }

    fun removeUser(options: Map<String, Any>): String {
        val email = options["<email>"].getStringValue()
        println("Removing user $email")


        userRepository.removeUser(email)
        return "OK"
    }

    fun userExists(options: Map<String, Any>): String {
        val email = options["<email>"].getStringValue()
        println("Checking if user exists: $email")

        val exists = userRepository.getUser(email) != null
        return exists.toString()
    }

    private fun Any?.getStringValue(): String {
        return this.toString().replace("[", "").replace("]", "")
    }
}

package org.imperial.mrc.hint.userCLI

import org.docopt.Docopt
import org.imperial.mrc.hint.db.DbProfileServiceUserRepository
import kotlin.system.exitProcess
import org.imperial.mrc.hint.db.UserRepository

const val doc = """
Hint User CLI
Usage:
    app add-user <email> <password>
    app remove-user <email>
"""

fun main(args: Array<String>)
{
    println(args.toString())

    val options = Docopt(doc).parse(args.toList())
    val addUser = options["add-user"] as Boolean
    val removeUser = options["remove-user"] as Boolean

    try
    {
        val result = when
        {
            addUser -> addUser(options)
            removeUser -> removeUser(options)
            else -> ""
        }

        println(result)
    }
    catch(e: Exception)
    {
        System.err.println(e.message)
        exitProcess(1)
    }
}

fun addUser(options: Map<String, Any>): String
{
    val email = options["<email>"].getStringValue()
    val password = options["<password>"].getStringValue()
    println("Adding user $email")

    userRepository().addUser(email, password)

    return "OK"
}

fun removeUser(options: Map<String, Any>): String
{
    val email = options["<email>"].getStringValue()
    println("Removing user $email")

    userRepository().removeUser(email)
    return "OK"
}

private fun userRepository(): UserRepository
{
    return DbProfileServiceUserRepository()
}

private fun Any?.getStringValue(): String
{
    return this.toString().replace("[", "").replace("]","")
}


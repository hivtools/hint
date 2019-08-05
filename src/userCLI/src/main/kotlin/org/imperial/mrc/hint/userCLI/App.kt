package org.imperial.mrc.hint.userCLI

import org.docopt.Docopt

import kotlin.system.exitProcess
import org.imperial.mrc.hint.db.UserRepository
import org.imperial.mrc.hint.HintApplication
import org.springframework.boot.SpringApplication
import org.springframework.context.ApplicationContext

const val doc = """
Hint User CLI
Usage:
    app add-user <email> <password>
    app remove-user <email>
    app user-exists <email>
"""

fun main(args: Array<String>)
{
    val options = Docopt(doc).parse(args.toList())
    val addUser = options["add-user"] as Boolean
    val removeUser = options["remove-user"] as Boolean

    //Start a background HintApplication so we can get an ApplicationContext in order to get Autowired user repo
    val applicationContext = SpringApplication.run(HintApplication::class.java)

    try
    {
        val userCLI = UserCLI(applicationContext)
        val result = when
        {
            addUser -> userCLI.addUser(options)
            removeUser -> userCLI.removeUser(options)
            else -> ""
        }

        println(result)
    }
    catch(e: Exception)
    {
        System.err.println(e.message)
        exitProcess(1)
    }
    finally {
        applicationContext.close()
    }
}

class UserCLI(private val appContext: ApplicationContext)
{
    fun addUser(options: Map<String, Any>, userRepository: UserRepository=userRepository()): String
    {
        val email = options["<email>"].getStringValue()
        val password = options["<password>"].getStringValue()
        println("Adding user $email")

        userRepository.addUser(email, password)

        return "OK"
    }

    fun removeUser(options: Map<String, Any>, userRepository: UserRepository=userRepository()): String
    {
        val email = options["<email>"].getStringValue()
        println("Removing user $email")

        userRepository.removeUser(email)
        return "OK"
    }

    fun userExists(options: Map<String, Any>, userRepository: UserRepository=userRepository()): String
    {
        val email = options["<email>"].getStringValue()
        println("Checking if user exists: $email")

        val exists = userRepository.getUser(email) != null
        return exists.toString()
    }

    private fun userRepository(): UserRepository
    {
        val context = appContext
        return context.getBean("dbProfileServiceUserRepository") as UserRepository
    }

    private fun Any?.getStringValue(): String
    {
        return this.toString().replace("[", "").replace("]","")
    }
}


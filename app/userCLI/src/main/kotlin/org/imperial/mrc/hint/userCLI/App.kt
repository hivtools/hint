package org.imperial.mrc.hint.userCLI

import org.docopt.Docopt
import kotlin.system.exitProcess

const val doc = """
Hint User CLI
Usage:
    app add-user <email> <password>
    appremove-user <email>
"""

fun main(args: Array<String>)
{
    val options = Docopt(doc).parse(args.toList())
    val addUser = options["add-user"] as Boolean
    val removeUser = options["remove-user"] as Boolean

    try
    {
        val result = when
        {
            addUser -> addUser(options)
            removeUser -> removeUser(options)
        }

        print result
    }
    catch(e: Exception)
    {
        System.err.println(e.message)
        exitProcess(1)
    }
}

fun addUser(options: Array<string>)
{
    print "Adding user placeholder"
}

fun removeUser(options: Array<string>)
{
    print "Removing user placeholder"
}



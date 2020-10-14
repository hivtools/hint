package org.imperial.mrc.hint.helpers

import org.assertj.core.api.AbstractThrowableAssert
import org.assertj.core.api.Assertions
import org.assertj.core.api.ThrowableAssert
import org.imperial.mrc.hint.exceptions.HintException
import java.util.*

class TranslationAssert(actual: Throwable)
    : AbstractThrowableAssert<TranslationAssert, Throwable>(actual, TranslationAssert::class.java)
{

    fun assertThatThrownBy(): TranslationAssert
    {
        return hasBeenThrown()
    }

    fun hasTranslatedMessage(expectedMessage: String): TranslationAssert
    {
        if (!(actual is HintException))
        {
            failWithMessage("Expected HintException")
        }

        val key = (actual as HintException).key

        val resources = ResourceBundle.getBundle("ErrorMessageBundle", Locale("en"))

        if (!resources.containsKey(key))
        {
            failWithMessage("Expected key <%s> to be present in ErrorMessageBundle", key)
        }
        val translatedMessage = resources.getString(key)

        if (translatedMessage != expectedMessage)
        {
            failWithMessage("Expected key <%s> to be translated to <%s> but was <%s>", key, expectedMessage, translatedMessage)
        }

        return this
    }

    companion object
    {

        fun <T> assertThatThrownBy(shouldRaiseThrowable: () -> T): TranslationAssert
        {
            return TranslationAssert(Assertions.catchThrowable(KThrowingCallable(shouldRaiseThrowable)))
                    .assertThatThrownBy()
        }
    }

    class KThrowingCallable<T>(private val callable: () -> T) : ThrowableAssert.ThrowingCallable
    {
        override fun call()
        {
            callable()
        }
    }
}
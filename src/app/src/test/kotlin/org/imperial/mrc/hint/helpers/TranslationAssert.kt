package org.imperial.mrc.hint.helpers

import org.assertj.core.api.AbstractThrowableAssert
import org.assertj.core.api.Assertions
import org.assertj.core.api.ThrowableAssert
import java.util.*

class TranslationAssert(actual: Throwable)
    : AbstractThrowableAssert<TranslationAssert, Throwable>(actual, TranslationAssert::class.java) {

    fun assertThatThrownBy(): TranslationAssert {
        return hasBeenThrown()
    }

    fun hasTranslatedMessage(expectedMessage: String): TranslationAssert {
        if (actual.message == null) {
            failWithMessage("Expected translated message <%s> but exception message was null", expectedMessage)
        }

        val resources = ResourceBundle.getBundle("ErrorMessageBundle", Locale("en"))

        if (!resources.containsKey(actual.message!!)) {
            failWithMessage("Expected key <%s> to be present in ErrorMessageBundle", actual.message)
        }
        val translatedMessage = resources.getString(actual.message!!)

        if (translatedMessage != expectedMessage) {
            failWithMessage("Expected key <%s> to be translated to <%s> but was <%s>", actual.message, expectedMessage, translatedMessage)
        }

        return this
    }

    companion object {

        fun <T>assertThatThrownBy(shouldRaiseThrowable: () -> T): TranslationAssert {
            return TranslationAssert(Assertions.catchThrowable(KThrowingCallable(shouldRaiseThrowable)))
                    .assertThatThrownBy()
        }
    }

    class KThrowingCallable<T>(private val callable: () -> T) : ThrowableAssert.ThrowingCallable {
        override fun call() {
            callable()
        }
    }
}
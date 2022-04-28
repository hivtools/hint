package org.imperial.mrc.hint

@Retention(AnnotationRetention.RUNTIME)
annotation class ExcludeFromCodeCoverage

typealias NoCoverage = ExcludeFromCodeCoverage

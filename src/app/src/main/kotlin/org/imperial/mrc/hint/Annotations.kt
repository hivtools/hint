package org.imperial.mrc.hint

@Retention(AnnotationRetention.BINARY)
annotation class ExcludeFromCodeCoverage

typealias NoCoverage = ExcludeFromCodeCoverage

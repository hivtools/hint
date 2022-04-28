package org.imperial.mrc.hint

@Retention(AnnotationRetention.BINARY)
annotation class ExcludeFromGeneratedCodeCoverage

typealias NoCoverage = ExcludeFromGeneratedCodeCoverage

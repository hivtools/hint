package org.imperial.mrc.hint

@Retention(AnnotationRetention.RUNTIME)
annotation class ExcludeFromGeneratedCodeCoverage

typealias NoCoverage = ExcludeFromGeneratedCodeCoverage

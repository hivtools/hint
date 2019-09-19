package org.imperial.mrc.hint.models

data class ModelRunParameters(val maxIterations: Int,
                              val noOfSimulations: Int,
                              val sleep: Int,
                              val options: Map<Any, Any>)

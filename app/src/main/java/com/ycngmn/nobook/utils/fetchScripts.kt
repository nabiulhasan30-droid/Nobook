package com.ycngmn.nobook.utils

import androidx.annotation.RawRes

data class Script(
    val isEnabled: Boolean,
    @param:RawRes val resourceId:  Int,
    val scriptTitle: String
)

suspend fun fetchScripts(
    scripts: List<Script>,
    fallbackContent: (Int) -> String
): String {
    return buildString {
        scripts.filter { it.isEnabled }.forEach { script ->
            val content = runCatching {
                fallbackContent(script.resourceId)
            }.getOrElse { "" }

            if (content.isNotBlank()) {
                append("\n;\n/* ==================== SCRIPT: ${script.scriptTitle} ==================== */\n")
                append("try {\n")
                append(content)
                append("\n} catch (e) {\n")
                append("  console.error('Error executing script [${script.scriptTitle}]:', e);\n")
                append("}\n;\n")
            }
        }
    }
}

package com.ycngmn.nobook.utils.jsBridge

import android.webkit.JavascriptInterface

class NobookSettings (
    private val toggleSettings: () -> Unit,
    private val onReload: (() -> Unit)? = null,
    private val onCopyText: ((String) -> Unit)? = null,
) {
    @JavascriptInterface
    fun onSettingsToggle() = toggleSettings()

    @JavascriptInterface
    fun onPullRefresh() {
        onReload?.invoke()
    }

    @JavascriptInterface
    fun copyToClipboard(text: String) {
        onCopyText?.invoke(text)
    }
}

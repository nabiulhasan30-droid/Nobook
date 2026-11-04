package com.ycngmn.nobook.utils.jsBridge

import android.webkit.JavascriptInterface

class AccountBridge(
    private val onOpenAccountSwitcher: () -> Unit
) {
    @JavascriptInterface
    fun onOpenSwitcher() {
        onOpenAccountSwitcher()
    }
}

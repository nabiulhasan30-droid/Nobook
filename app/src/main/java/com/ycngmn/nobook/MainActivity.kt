package com.ycngmn.nobook

import android.os.Bundle
import android.webkit.CookieManager
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.core.view.WindowCompat
import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.viewmodel.compose.viewModel
import com.ycngmn.nobook.data.local.AccountManager
import com.ycngmn.nobook.ui.components.auth.AppLockOverlay
import com.ycngmn.nobook.ui.screens.NobookWebView
import com.ycngmn.nobook.ui.theme.NobookTheme
import com.ycngmn.nobook.ui.viewmodel.SettingsViewModel

class MainActivity : FragmentActivity() {
    private val isAppLocked = mutableStateOf(true)
    private var lastBackgroundTime = 0L
    private var currentTimeoutSeconds = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)

        setContent {
            val settingsVM: SettingsViewModel = viewModel()
            val biometricLock by settingsVM.biometricLock.collectAsState()
            val lockTimeout by settingsVM.biometricLockTimeout.collectAsState()
            currentTimeoutSeconds = lockTimeout
            val intentUrl = intent?.data?.toString()

            NobookTheme {
                NobookWebView(
                    url = intentUrl ?: "https://facebook.com/"
                )

                if (biometricLock && isAppLocked.value) {
                    AppLockOverlay(
                        activity = this@MainActivity,
                        onUnlockSuccess = {
                            isAppLocked.value = false
                            lastBackgroundTime = 0L
                        }
                    )
                }
            }
        }
    }

    override fun onStart() {
        super.onStart()
        if (lastBackgroundTime > 0L) {
            val elapsedSec = (System.currentTimeMillis() - lastBackgroundTime) / 1000
            if (elapsedSec >= currentTimeoutSeconds) {
                isAppLocked.value = true
            }
        }
    }

    override fun onPause() {
        super.onPause()
        runCatching {
            AccountManager(this).saveCurrentSession()
            CookieManager.getInstance().flush()
        }
    }

    override fun onStop() {
        super.onStop()
        runCatching {
            AccountManager(this).saveCurrentSession()
            CookieManager.getInstance().flush()
        }
        lastBackgroundTime = System.currentTimeMillis()
        if (currentTimeoutSeconds == 0) {
            isAppLocked.value = true
        }
    }
}
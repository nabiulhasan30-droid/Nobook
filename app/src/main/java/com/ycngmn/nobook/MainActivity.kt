package com.ycngmn.nobook

import android.os.Bundle
import android.webkit.CookieManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.core.view.WindowCompat
import com.ycngmn.nobook.data.local.AccountManager
import com.ycngmn.nobook.ui.screens.NobookWebView
import com.ycngmn.nobook.ui.theme.NobookTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)

        setContent {
            val intentUrl = intent?.data?.toString()
            NobookTheme {
                NobookWebView(
                    url = intentUrl
                        ?: "https://facebook.com/"
                )
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
    }
}
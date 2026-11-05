package com.ycngmn.nobook.utils

import android.content.Context
import android.content.ContextWrapper
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity

object BiometricHelper {

    private const val PRIMARY_AUTHENTICATORS =
        BiometricManager.Authenticators.BIOMETRIC_STRONG or
        BiometricManager.Authenticators.DEVICE_CREDENTIAL

    private const val BIOMETRIC_ONLY_AUTHENTICATORS =
        BiometricManager.Authenticators.BIOMETRIC_STRONG

    fun canAuthenticate(context: Context): Boolean {
        return runCatching {
            val biometricManager = BiometricManager.from(context)
            val primaryStatus = biometricManager.canAuthenticate(PRIMARY_AUTHENTICATORS)
            if (primaryStatus == BiometricManager.BIOMETRIC_SUCCESS) return true

            val bioStatus = biometricManager.canAuthenticate(BIOMETRIC_ONLY_AUTHENTICATORS)
            if (bioStatus == BiometricManager.BIOMETRIC_SUCCESS) return true

            val credStatus = biometricManager.canAuthenticate(BiometricManager.Authenticators.DEVICE_CREDENTIAL)
            credStatus == BiometricManager.BIOMETRIC_SUCCESS
        }.getOrDefault(false)
    }

    fun isHardwareAvailable(context: Context): Boolean {
        return runCatching {
            val biometricManager = BiometricManager.from(context)
            val status = biometricManager.canAuthenticate(BIOMETRIC_ONLY_AUTHENTICATORS)
            status != BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE &&
            status != BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE
        }.getOrDefault(false)
    }

    fun hasEnrolledBiometrics(context: Context): Boolean {
        return runCatching {
            val biometricManager = BiometricManager.from(context)
            val status = biometricManager.canAuthenticate(PRIMARY_AUTHENTICATORS)
            status != BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED
        }.getOrDefault(false)
    }

    fun showBiometricPrompt(
        activity: FragmentActivity,
        title: String = "Facebook N আনলক করুন",
        subtitle: String = "আপনার ফিঙ্গারপ্রিন্ট বা ডিভাইস লক দিয়ে আনলক করুন",
        onSuccess: () -> Unit,
        onError: (String) -> Unit = {}
    ) {
        val executor = ContextCompat.getMainExecutor(activity)
        val callback = object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                super.onAuthenticationSucceeded(result)
                onSuccess()
            }

            override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                super.onAuthenticationError(errorCode, errString)
                val userMsg = when (errorCode) {
                    BiometricPrompt.ERROR_USER_CANCELED,
                    BiometricPrompt.ERROR_NEGATIVE_BUTTON -> "আনলক বাতিল করা হয়েছে।"
                    BiometricPrompt.ERROR_LOCKOUT -> "অতিরিক্ত চেষ্টার কারণে ফিঙ্গারপ্রিন্ট সাময়িক বন্ধ। কিছুক্ষণ পর চেষ্টা করুন।"
                    BiometricPrompt.ERROR_LOCKOUT_PERMANENT -> "ফিঙ্গারপ্রিন্ট লক স্থায়ীভাবে বন্ধ। ফোনের পিন বা প্যাটার্ন দিয়ে আনলক করুন।"
                    BiometricPrompt.ERROR_NO_BIOMETRICS -> "ফোনে কোনো ফিঙ্গারপ্রিন্ট বা লক স্ক্রিন নেই।"
                    BiometricPrompt.ERROR_HW_UNAVAILABLE -> "ফিঙ্গারপ্রিন্ট সেন্সর সাময়িক ব্যস্ত।"
                    else -> errString.toString()
                }
                onError(userMsg)
            }

            override fun onAuthenticationFailed() {
                super.onAuthenticationFailed()
                onError("আঙ্গুলের ছাপ মেলেনি, পুনরায় চেষ্টা করুন।")
            }
        }

        val promptInfo = try {
            BiometricPrompt.PromptInfo.Builder()
                .setTitle(title)
                .setSubtitle(subtitle)
                .setAllowedAuthenticators(PRIMARY_AUTHENTICATORS)
                .build()
        } catch (e: Exception) {
            BiometricPrompt.PromptInfo.Builder()
                .setTitle(title)
                .setSubtitle(subtitle)
                .setNegativeButtonText("বাতিল")
                .setAllowedAuthenticators(BIOMETRIC_ONLY_AUTHENTICATORS)
                .build()
        }

        val biometricPrompt = BiometricPrompt(activity, executor, callback)
        biometricPrompt.authenticate(promptInfo)
    }
}

fun Context.findActivity(): FragmentActivity? {
    var ctx = this
    while (ctx is ContextWrapper) {
        if (ctx is FragmentActivity) return ctx
        ctx = ctx.baseContext
    }
    return null
}

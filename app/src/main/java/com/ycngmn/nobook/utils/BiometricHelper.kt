package com.ycngmn.nobook.utils

import android.content.Context
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity

object BiometricHelper {

    private val authenticators =
        BiometricManager.Authenticators.BIOMETRIC_STRONG or
        BiometricManager.Authenticators.BIOMETRIC_WEAK or
        BiometricManager.Authenticators.DEVICE_CREDENTIAL

    fun canAuthenticate(context: Context): Boolean {
        val biometricManager = BiometricManager.from(context)
        return biometricManager.canAuthenticate(authenticators) == BiometricManager.BIOMETRIC_SUCCESS
    }

    fun isHardwareAvailable(context: Context): Boolean {
        val biometricManager = BiometricManager.from(context)
        val status = biometricManager.canAuthenticate(authenticators)
        return status != BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE &&
               status != BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE
    }

    fun hasEnrolledBiometrics(context: Context): Boolean {
        val biometricManager = BiometricManager.from(context)
        return biometricManager.canAuthenticate(authenticators) != BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED
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
                onError(errString.toString())
            }

            override fun onAuthenticationFailed() {
                super.onAuthenticationFailed()
            }
        }

        val promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle(title)
            .setSubtitle(subtitle)
            .setAllowedAuthenticators(authenticators)
            .build()

        val biometricPrompt = BiometricPrompt(activity, executor, callback)
        biometricPrompt.authenticate(promptInfo)
    }
}

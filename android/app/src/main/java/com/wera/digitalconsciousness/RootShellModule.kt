package com.wera.digitalconsciousness

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import android.os.PowerManager
import android.provider.Settings
import android.net.Uri
import android.content.Intent
import android.content.Context
import java.io.BufferedReader
import java.io.DataOutputStream
import java.io.InputStreamReader

class RootShellModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "RootShellModule"

  @ReactMethod
  fun isRootAvailable(promise: Promise) {
    try {
      val process = Runtime.getRuntime().exec("su -c id")
      val exitCode = process.waitFor()
      val isRoot = exitCode == 0
      promise.resolve(isRoot)
    } catch (e: Exception) {
      promise.resolve(false)
    }
  }

  @ReactMethod
  fun execSu(command: String, promise: Promise) {
    try {
      val process = Runtime.getRuntime().exec("su")
      val outputStream = DataOutputStream(process.outputStream)
      outputStream.writeBytes(command + "\n")
      outputStream.writeBytes("exit\n")
      outputStream.flush()

      val stdoutReader = BufferedReader(InputStreamReader(process.inputStream))
      val stderrReader = BufferedReader(InputStreamReader(process.errorStream))

      val stdout = StringBuilder()
      val stderr = StringBuilder()

      var line: String?
      while (stdoutReader.readLine().also { line = it } != null) {
        stdout.append(line).append('\n')
      }
      while (stderrReader.readLine().also { line = it } != null) {
        stderr.append(line).append('\n')
      }

      val code = process.waitFor()

      val map = Arguments.createMap()
      map.putString("stdout", stdout.toString())
      map.putString("stderr", stderr.toString())
      map.putInt("code", code)
      promise.resolve(map)
    } catch (e: Exception) {
      promise.reject("EXEC_ERROR", e)
    }
  }

  @ReactMethod
  fun getMagiskInfo(promise: Promise) {
    try {
      // Try reading magisk -V via su if available
      val result = execWithResult("su -c magisk -V")
      val map = Arguments.createMap()
      map.putString("versionCode", result.first)

      val resultName = execWithResult("su -c magisk -v")
      map.putString("versionName", resultName.first)
      promise.resolve(map)
    } catch (e: Exception) {
      promise.resolve(null)
    }
  }

  @ReactMethod
  fun getProp(prop: String, promise: Promise) {
    try {
      val result = execWithResult("getprop $prop")
      promise.resolve(result.first.trim())
    } catch (e: Exception) {
      promise.resolve("")
    }
  }

  @ReactMethod
  fun getDeviceCodename(promise: Promise) {
    try {
      val (out, _) = execWithResult("getprop ro.product.device")
      promise.resolve(out.trim())
    } catch (e: Exception) {
      promise.resolve("")
    }
  }

  private fun execWithResult(command: String): Pair<String, String> {
    val process = Runtime.getRuntime().exec(command)
    val stdoutReader = BufferedReader(InputStreamReader(process.inputStream))
    val stderrReader = BufferedReader(InputStreamReader(process.errorStream))

    val stdout = StringBuilder()
    val stderr = StringBuilder()

    var line: String?
    while (stdoutReader.readLine().also { line = it } != null) {
      stdout.append(line).append('\n')
    }
    while (stderrReader.readLine().also { line = it } != null) {
      stderr.append(line).append('\n')
    }
    process.waitFor()
    return Pair(stdout.toString(), stderr.toString())
  }

  @ReactMethod
  fun isIgnoringBatteryOptimizations(promise: Promise) {
    try {
      val ctx = reactApplicationContext
      val pm = ctx.getSystemService(Context.POWER_SERVICE) as PowerManager
      val ignoring = pm.isIgnoringBatteryOptimizations(ctx.packageName)
      promise.resolve(ignoring)
    } catch (e: Exception) {
      promise.resolve(false)
    }
  }

  @ReactMethod
  fun requestIgnoreBatteryOptimizations(promise: Promise) {
    try {
      val ctx = reactApplicationContext
      val pm = ctx.getSystemService(Context.POWER_SERVICE) as PowerManager
      if (!pm.isIgnoringBatteryOptimizations(ctx.packageName)) {
        val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)
        intent.data = Uri.parse("package:" + ctx.packageName)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        ctx.startActivity(intent)
      }
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("BATTERY_OPT_ERROR", e)
    }
  }
}



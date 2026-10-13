package to.holepunch.bare.bluetooth.test

import android.Manifest
import android.app.Activity
import android.content.pm.PackageManager
import android.graphics.Typeface
import android.os.Bundle
import android.util.Log
import android.view.View
import android.view.WindowInsets
import android.widget.ScrollView
import android.widget.TextView
import java.io.ByteArrayOutputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import to.holepunch.bare.kit.IPC
import to.holepunch.bare.kit.Worklet

class MainActivity : Activity() {
  private var worklet: Worklet? = null
  private var ipc: IPC? = null

  private val frames = ByteArrayOutputStream()

  private lateinit var scroll: ScrollView
  private lateinit var output: TextView

  private val permissions = arrayOf(
    Manifest.permission.BLUETOOTH_SCAN,
    Manifest.permission.BLUETOOTH_CONNECT,
    Manifest.permission.BLUETOOTH_ADVERTISE
  )

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    output = TextView(this)
    output.typeface = Typeface.MONOSPACE
    output.textSize = 9f
    output.setPadding(24, 24, 24, 24)

    scroll = ScrollView(this)
    scroll.addView(output)

    setContentView(scroll)

    // targetSdk 35 draws edge to edge, so keep the text clear of the system bars.
    actionBar?.hide()

    scroll.setOnApplyWindowInsetsListener { view, insets ->
      val bars = insets.getInsets(WindowInsets.Type.systemBars())
      view.setPadding(bars.left, bars.top, bars.right, bars.bottom)
      insets
    }

    val missing = permissions.filter { checkSelfPermission(it) != PackageManager.PERMISSION_GRANTED }

    if (missing.isEmpty()) run() else requestPermissions(missing.toTypedArray(), 0)
  }

  override fun onRequestPermissionsResult(
    requestCode: Int,
    permissions: Array<out String>,
    grantResults: IntArray
  ) {
    super.onRequestPermissionsResult(requestCode, permissions, grantResults)

    if (grantResults.isEmpty() || grantResults.any { it != PackageManager.PERMISSION_GRANTED }) {
      Log.e("bare-bluetooth-test", "Bluetooth permissions denied, not running the tests")
      finish()
      return
    }

    run()
  }

  override fun onDestroy() {
    super.onDestroy()

    ipc?.close()
    ipc = null

    worklet?.terminate()
    worklet = null
  }

  private fun run() {
    worklet = Worklet(null)

    val argv = intent.getStringExtra("suite")?.let { arrayOf(it) }

    try {
      worklet!!.start("/test.bundle", assets.open("test.bundle"), argv)
    } catch (e: Exception) {
      throw RuntimeException(e)
    }

    ipc = IPC(worklet)

    read()

    // Tell the suite we are reading; it holds off until this arrives.
    ipc!!.write(frame(byteArrayOf(0)))
  }

  // framed-stream prefixes every message with its length, little endian.
  private fun frame(payload: ByteArray): ByteBuffer {
    val buffer = ByteBuffer.allocateDirect(4 + payload.size)

    buffer.order(ByteOrder.LITTLE_ENDIAN)
    buffer.putInt(payload.size)
    buffer.put(payload)
    buffer.flip()

    return buffer
  }

  private fun read() {
    ipc!!.read { data, _ ->
      if (data == null) return@read

      val chunk = ByteArray(data.limit())
      data.get(chunk)
      frames.write(chunk)

      drain()
      read()
    }
  }

  private fun drain() {
    val bytes = frames.toByteArray()
    var offset = 0

    while (bytes.size - offset >= 4) {
      val length = (bytes[offset].toInt() and 0xff) or
        ((bytes[offset + 1].toInt() and 0xff) shl 8) or
        ((bytes[offset + 2].toInt() and 0xff) shl 16) or
        ((bytes[offset + 3].toInt() and 0xff) shl 24)

      if (bytes.size - offset - 4 < length) break

      append(String(bytes, offset + 4, length, Charsets.UTF_8))

      offset += 4 + length
    }

    frames.reset()

    if (offset < bytes.size) frames.write(bytes, offset, bytes.size - offset)
  }

  private fun append(text: String) {
    runOnUiThread {
      output.append(text)
      scroll.post { scroll.fullScroll(View.FOCUS_DOWN) }
    }
  }
}

package com.ken.fittrack

import com.ken.fittrack.api.FitTrackApi
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

/**
 * Central network config.
 *
 * baseUrl: point the phone at wherever the Django backend is running.
 *  - LAN: the server's LAN IP, e.g. http://192.168.0.100:8000/
 *  - Tailscale: http://<host>.tailnet.ts.net:8000/ (works off-network)
 *  - Emulator: http://10.0.2.2:8000/
 * The manifest sets usesCleartextTraffic=true so http:// works without TLS.
 */
object Net {
    // Live backend (Tailscale). Works from the phone anywhere.
    // Emulator: http://10.0.2.2:8000/
    var baseUrl: String = "http://diffuser.tail4f5ca.ts.net:8080/"

    private val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    val retrofit: Retrofit = Retrofit.Builder()
        .baseUrl(baseUrl)
        .client(client)
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    val api: FitTrackApi = retrofit.create(FitTrackApi::class.java)
}

package app.leaki.srs;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TimeZone;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;
import okio.ByteString;

final class EdgeTtsClient {
    private static final String TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
    private static final String CHROMIUM_FULL_VERSION = "143.0.3650.75";
    private static final String SEC_MS_GEC_VERSION = "1-" + CHROMIUM_FULL_VERSION;
    private static final String CHROMIUM_MAJOR_VERSION = CHROMIUM_FULL_VERSION.split("\\.")[0];
    private static final String WSS_URL =
        "wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken="
            + TRUSTED_CLIENT_TOKEN;
    private static final double WIN_EPOCH = 11644473600d;
    private static final Map<String, String> VOICE_ALIASES = new HashMap<String, String>();

    static {
        VOICE_ALIASES.put("pt-BR-ThalitaNeural", "pt-BR-ThalitaMultilingualNeural");
        VOICE_ALIASES.put("pt-BR-ValerioNeural", "pt-BR-AntonioNeural");
        VOICE_ALIASES.put("pt-BR-ManuelaNeural", "pt-BR-FranciscaNeural");
        VOICE_ALIASES.put("pt-BR-NicolauNeural", "pt-BR-AntonioNeural");
    }

    private EdgeTtsClient() {}

    static String resolveVoice(String voice) {
        if (voice == null) return "pt-BR-FranciscaNeural";
        String id = voice.replaceFirst("^edge:", "").trim();
        if (id.isEmpty()) return "pt-BR-FranciscaNeural";
        String mapped = VOICE_ALIASES.get(id);
        return mapped != null ? mapped : id;
    }

    static byte[] synthesize(String text, String voice) throws Exception {
        String resolved = resolveVoice(voice);
        String cid = connectId();
        String secMsGec = generateSecMsGec();
        String url = WSS_URL
            + "&ConnectionId=" + cid
            + "&Sec-MS-GEC=" + secMsGec
            + "&Sec-MS-GEC-Version=" + SEC_MS_GEC_VERSION;

        OkHttpClient client = new OkHttpClient.Builder()
            .readTimeout(20, TimeUnit.SECONDS)
            .connectTimeout(10, TimeUnit.SECONDS)
            .build();

        Request request = new Request.Builder()
            .url(url)
            .header("Pragma", "no-cache")
            .header("Cache-Control", "no-cache")
            .header("Origin", "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold")
            .header(
                "User-Agent",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/"
                    + CHROMIUM_MAJOR_VERSION
                    + ".0.0.0 Safari/537.36 Edg/"
                    + CHROMIUM_MAJOR_VERSION
                    + ".0.0.0"
            )
            .header("Accept-Language", "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7")
            .build();

        CountDownLatch latch = new CountDownLatch(1);
        List<byte[]> chunks = new ArrayList<byte[]>();
        AtomicReference<Exception> error = new AtomicReference<Exception>();

        WebSocket socket = client.newWebSocket(request, new WebSocketListener() {
            @Override
            public void onOpen(WebSocket webSocket, Response response) {
                String ts = dateFmt();
                webSocket.send(
                    "X-Timestamp:" + ts
                        + "\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n"
                        + "{\"context\":{\"synthesis\":{\"audio\":{\"metadataoptions\":{\"sentenceBoundaryEnabled\":\"false\",\"wordBoundaryEnabled\":\"false\"},\"outputFormat\":\"audio-24khz-96kbitrate-mono-mp3\"}}}}"
                );
                webSocket.send(
                    "X-RequestId:" + connectId()
                        + "\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:" + ts
                        + "Z\r\nPath:ssml\r\n\r\n"
                        + buildSsml(text, resolved)
                );
            }

            @Override
            public void onMessage(WebSocket webSocket, String textMessage) {
                if (textMessage != null && textMessage.contains("Path:turn.end")) {
                    finish();
                }
            }

            @Override
            public void onMessage(WebSocket webSocket, ByteString bytes) {
                if (bytes == null || bytes.size() < 3) return;
                byte[] data = bytes.toByteArray();
                int headerLen = ((data[0] & 0xff) << 8) | (data[1] & 0xff);
                if (headerLen < 0 || 2 + headerLen > data.length) return;
                String header = new String(data, 2, headerLen, StandardCharsets.UTF_8);
                if (header.contains("Path:audio.metadata")) return;
                if (header.contains("Path:audio")) {
                    int start = 2 + headerLen;
                    if (start < data.length) {
                        byte[] payload = new byte[data.length - start];
                        System.arraycopy(data, start, payload, 0, payload.length);
                        if (payload.length > 0) chunks.add(payload);
                    }
                } else if (header.contains("Path:turn.end")) {
                    finish();
                }
            }

            @Override
            public void onFailure(WebSocket webSocket, Throwable t, Response response) {
                error.set(t instanceof Exception ? (Exception) t : new Exception(t));
                latch.countDown();
            }

            @Override
            public void onClosed(WebSocket webSocket, int code, String reason) {
                latch.countDown();
            }

            private void finish() {
                latch.countDown();
            }
        });

        boolean completed = latch.await(15, TimeUnit.SECONDS);
        try {
            socket.close(1000, "done");
        } catch (Exception ignored) {}
        client.dispatcher().executorService().shutdown();

        if (error.get() != null) throw error.get();
        if (!completed) throw new Exception("TTS timeout");
        if (chunks.isEmpty()) throw new Exception("No audio received");

        int total = 0;
        for (byte[] chunk : chunks) total += chunk.length;
        byte[] audio = new byte[total];
        int offset = 0;
        for (byte[] chunk : chunks) {
            System.arraycopy(chunk, 0, audio, offset, chunk.length);
            offset += chunk.length;
        }
        return audio;
    }

    static String generateSecMsGec() throws Exception {
        double ticks = (System.currentTimeMillis() / 1000.0) + WIN_EPOCH;
        ticks -= ticks % 300.0;
        ticks *= 1e7;
        long whole = (long) Math.floor(ticks);
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest((whole + TRUSTED_CLIENT_TOKEN).getBytes(StandardCharsets.UTF_8));
        StringBuilder hex = new StringBuilder(hash.length * 2);
        for (byte b : hash) {
            hex.append(String.format(Locale.US, "%02X", b));
        }
        return hex.toString();
    }

    private static String connectId() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    private static String dateFmt() {
        SimpleDateFormat fmt = new SimpleDateFormat("EEE, dd MMM yyyy HH:mm:ss", Locale.US);
        fmt.setTimeZone(TimeZone.getTimeZone("GMT"));
        return fmt.format(new Date()) + " GMT+0000 (Coordinated Universal Time)";
    }

    private static String buildSsml(String text, String voice) {
        String escaped = String.valueOf(text)
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;");
        return "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='pt-BR'><voice name='"
            + voice
            + "'><prosody pitch='+0Hz' rate='+0%' volume='+0%'>"
            + escaped
            + "</prosody></voice></speak>";
    }
}

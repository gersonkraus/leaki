package app.leaki.srs;

import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "EdgeTts")
public class EdgeTtsPlugin extends Plugin {
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    @PluginMethod
    public void speak(PluginCall call) {
        String text = call.getString("text", "");
        String voice = call.getString("voice", "pt-BR-FranciscaNeural");
        if (text == null || text.trim().isEmpty()) {
            call.reject("text is required");
            return;
        }
        executor.execute(() -> {
            try {
                byte[] audio = EdgeTtsClient.synthesize(text, voice);
                JSObject ret = new JSObject();
                ret.put("audioBase64", Base64.encodeToString(audio, Base64.NO_WRAP));
                call.resolve(ret);
            } catch (Exception e) {
                call.reject(e.getMessage() != null ? e.getMessage() : "TTS failed");
            }
        });
    }
}

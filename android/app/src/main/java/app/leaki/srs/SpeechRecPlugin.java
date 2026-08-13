package app.leaki.srs;

import android.Manifest;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.ArrayList;

@CapacitorPlugin(
    name = "SpeechRec",
    permissions = {
        @Permission(alias = "mic", strings = { Manifest.permission.RECORD_AUDIO })
    }
)
public class SpeechRecPlugin extends Plugin {
    private SpeechRecognizer recognizer;
    private PluginCall activeCall;
    private final Handler main = new Handler(Looper.getMainLooper());

    @PluginMethod
    public void available(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("available", SpeechRecognizer.isRecognitionAvailable(getContext()));
        call.resolve(ret);
    }

    @PluginMethod
    public void listen(PluginCall call) {
        if (getPermissionState("mic") != PermissionState.GRANTED) {
            requestPermissionForAlias("mic", call, "onMicPermission");
            return;
        }
        startListening(call);
    }

    @PermissionCallback
    private void onMicPermission(PluginCall call) {
        if (getPermissionState("mic") == PermissionState.GRANTED) {
            startListening(call);
        } else {
            call.reject("not-allowed");
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        main.post(() -> {
            try {
                if (recognizer != null) recognizer.stopListening();
            } catch (Exception ignored) {}
            call.resolve();
        });
    }

    private void startListening(PluginCall call) {
        main.post(() -> {
            if (!SpeechRecognizer.isRecognitionAvailable(getContext())) {
                call.reject("unavailable");
                return;
            }
            if (activeCall != null) {
                activeCall.reject("cancelled");
                activeCall = null;
            }
            destroyRecognizer();
            activeCall = call;
            recognizer = SpeechRecognizer.createSpeechRecognizer(getContext());
            final SpeechRecognizer session = recognizer;
            recognizer.setRecognitionListener(new RecognitionListener() {
                private boolean belongsToSession() {
                    return recognizer == session && activeCall == call;
                }

                @Override public void onReadyForSpeech(Bundle params) {}
                @Override public void onBeginningOfSpeech() {}
                @Override public void onRmsChanged(float rmsdB) {}
                @Override public void onBufferReceived(byte[] buffer) {}
                @Override public void onEndOfSpeech() {}
                @Override public void onPartialResults(Bundle partialResults) {}
                @Override public void onEvent(int eventType, Bundle params) {}

                @Override
                public void onError(int error) {
                    if (!belongsToSession()) return;
                    PluginCall pending = activeCall;
                    activeCall = null;
                    destroyRecognizer();
                    if (pending != null) pending.reject(mapError(error));
                }

                @Override
                public void onResults(Bundle results) {
                    if (!belongsToSession()) return;
                    PluginCall pending = activeCall;
                    activeCall = null;
                    destroyRecognizer();
                    if (pending == null) return;
                    ArrayList<String> list = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                    String transcript = (list != null && !list.isEmpty()) ? list.get(0) : "";
                    JSObject ret = new JSObject();
                    ret.put("transcript", transcript);
                    pending.resolve(ret);
                }
            });

            String lang = call.getString("language", "pt-BR");
            Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, lang);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, lang);
            intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3);
            intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false);
            intent.putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true);
            try {
                recognizer.startListening(intent);
            } catch (Exception e) {
                activeCall = null;
                destroyRecognizer();
                call.reject(e.getMessage() != null ? e.getMessage() : "listen-failed");
            }
        });
    }

    private void destroyRecognizer() {
        if (recognizer != null) {
            try {
                recognizer.cancel();
                recognizer.destroy();
            } catch (Exception ignored) {}
            recognizer = null;
        }
    }

    private static String mapError(int error) {
        switch (error) {
            case SpeechRecognizer.ERROR_AUDIO: return "audio";
            case SpeechRecognizer.ERROR_CLIENT: return "client";
            case SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS: return "not-allowed";
            case SpeechRecognizer.ERROR_NETWORK:
            case SpeechRecognizer.ERROR_NETWORK_TIMEOUT: return "network";
            case SpeechRecognizer.ERROR_NO_MATCH: return "no-speech";
            case SpeechRecognizer.ERROR_RECOGNIZER_BUSY: return "busy";
            case SpeechRecognizer.ERROR_SERVER: return "server";
            case SpeechRecognizer.ERROR_SPEECH_TIMEOUT: return "no-speech";
            default: return "error";
        }
    }

    @Override
    protected void handleOnDestroy() {
        if (activeCall != null) {
            activeCall.reject("cancelled");
            activeCall = null;
        }
        destroyRecognizer();
        super.handleOnDestroy();
    }
}

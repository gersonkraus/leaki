package app.leaki.srs;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(EdgeTtsPlugin.class);
        registerPlugin(SpeechRecPlugin.class);
        registerPlugin(LeakiSharePlugin.class);
        super.onCreate(savedInstanceState);
    }
}

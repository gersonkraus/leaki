package app.leaki.srs;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(EdgeTtsPlugin.class);
        super.onCreate(savedInstanceState);
    }
}

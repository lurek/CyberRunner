package com.mycompany.appname;

import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Enable edge-to-edge display
        enableEdgeToEdge();
    }
    
    private void enableEdgeToEdge() {
        Window window = getWindow();
        View decorView = window.getDecorView();
        
        // Allow content to extend behind system bars
        WindowCompat.setDecorFitsSystemWindows(window, false);
        
        // Configure the window insets controller for immersive mode
        WindowInsetsControllerCompat insetsController = 
            WindowCompat.getInsetsController(window, decorView);
        
        if (insetsController != null) {
            // Hide system bars for immersive fullscreen gameplay
            insetsController.hide(WindowInsetsCompat.Type.systemBars());
            
            // Use sticky immersive mode - swipe from edge to temporarily show bars
            insetsController.setSystemBarsBehavior(
                WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            );
        }
        
        // Handle display cutouts (notch/punch-hole) on Android P+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            WindowManager.LayoutParams params = window.getAttributes();
            params.layoutInDisplayCutoutMode = 
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            window.setAttributes(params);
        }
    }
    
    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        // Re-enable immersive mode when window regains focus
        if (hasFocus) {
            enableEdgeToEdge();
        }
    }
}

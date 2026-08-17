import React, { useState } from 'react';
import { X, Package, FolderCode, Smartphone, ShieldCheck, Terminal, CheckCircle2 } from 'lucide-react';
import { KEY_BASE } from '../utils/themeStyles.js';
import { isAndroidShell } from '../utils/audioHaptics.js';

const APK_NAME = 'ScientificCalculatorPro.apk';
const ZIP_NAME = 'ScientificCalculatorPro_AndroidStudio.zip';

function Step({ theme, n, title, children }) {
  return (
    <div className="flex gap-2">
      <div className={`shrink-0 w-5 h-5 rounded-full ${theme.accentBg} text-white text-[10px] font-bold flex items-center justify-center`}>{n}</div>
      <div className="min-w-0">
        <div className="text-[12px] font-bold">{title}</div>
        <div className={`text-[11px] leading-snug ${theme.mutedText}`}>{children}</div>
      </div>
    </div>
  );
}

export default function ApkDownloadModal({ theme, onClose }) {
  const [tab, setTab] = useState('apk');

  const Tab = ({ id, label, Icon }) => (
    <button
      onClick={() => setTab(id)}
      className={`flex items-center justify-center gap-1 rounded-lg border py-1.5 text-[10px] font-bold uppercase tracking-wide
        ${tab === id ? theme.tabActive : `${theme.panelBg} ${theme.panelBorder} ${theme.mutedText}`}`}
    >
      <Icon size={12} />{label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end anim-fade" style={{ background: 'rgba(0,0,0,0.55)' }}>
      <button className="absolute inset-0 w-full h-full cursor-default" onClick={onClose} aria-label="close" />
      <div className={`relative anim-sheet rounded-t-2xl border-t-2 ${theme.modalBorder} ${theme.modalBg} flex flex-col`} style={{ maxHeight: '88%' }}>
        <div className={`shrink-0 flex items-center justify-between px-3 py-2 border-b ${theme.panelBorder}`}>
          <div>
            <div className="text-[13px] font-extrabold">Get the App</div>
            <div className={`text-[9px] uppercase tracking-widest ${theme.mutedText}`}>
              {isAndroidShell() ? 'Running inside the native shell' : 'Web preview'}
            </div>
          </div>
          <button onClick={onClose} className={`${KEY_BASE} ${theme.funcKey} h-7 w-7`}><X size={14} /></button>
        </div>

        <div className="shrink-0 grid grid-cols-2 gap-1 px-3 py-2">
          <Tab id="apk" label="Android APK" Icon={Package} />
          <Tab id="src" label="Studio Project" Icon={FolderCode} />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto thin-scroll px-3 pb-3 space-y-2">
          {tab === 'apk' ? (
            <>
              <div className={`rounded-xl border-2 ${theme.lcdBorder} ${theme.lcdBg} ${theme.lcdGlow} p-3 text-center lcd-scanlines`}>
                <Smartphone size={26} className={`mx-auto mb-1 ${theme.lcdResult}`} />
                <div className={`text-[14px] font-extrabold ${theme.lcdResult}`}>{APK_NAME}</div>
                <div className={`text-[10px] font-mono ${theme.lcdPreview}`}>v3.0 · minSdk 21 → 34 · offline · ~194 KB</div>
              </div>

              <a
                href={`./${APK_NAME}`}
                download={APK_NAME}
                className={`${KEY_BASE} ${theme.equalKey} w-full py-3 text-[12px] flex-row gap-1.5 no-underline`}
              >
                <Package size={15} /> Download Signed APK
              </a>

              <div className={`rounded-xl border ${theme.panelBorder} ${theme.panelBg} p-2 space-y-2`}>
                <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${theme.mutedText}`}>
                  <ShieldCheck size={12} /> Install Instructions
                </div>
                <Step theme={theme} n={1} title="Copy the APK to your phone">
                  Transfer via USB, Bluetooth, Google Drive, or download it directly on the device.
                </Step>
                <Step theme={theme} n={2} title="Allow unknown sources">
                  Settings → Apps → Special access → Install unknown apps → enable it for your file manager or browser.
                </Step>
                <Step theme={theme} n={3} title="Tap the file and install">
                  Android verifies the v1/v2/v3 signature, then installs. No Play Store account required.
                </Step>
                <Step theme={theme} n={4} title="Launch offline">
                  The whole calculator is inlined into a single HTML asset — it needs zero network permission.
                </Step>
              </div>

              <div className={`rounded-xl border ${theme.panelBorder} ${theme.panelBg} p-2`}>
                <div className={`text-[10px] font-bold uppercase tracking-widest ${theme.mutedText} mb-1`}>Package details</div>
                {[
                  ['Application ID', 'com.scientific.calculator.pro'],
                  ['Version', '3.0 (code 30)'],
                  ['Min / Target SDK', '21 / 34'],
                  ['Signing schemes', 'v1 + v2 + v3'],
                  ['Permissions', 'VIBRATE only'],
                  ['ABI', 'Universal (no native libs)'],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between py-0.5">
                    <span className={`text-[10px] ${theme.mutedText}`}>{k}</span>
                    <span className="text-[10px] font-mono font-bold">{v}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className={`rounded-xl border-2 ${theme.lcdBorder} ${theme.lcdBg} ${theme.lcdGlow} p-3 text-center lcd-scanlines`}>
                <FolderCode size={26} className={`mx-auto mb-1 ${theme.lcdResult}`} />
                <div className={`text-[13px] font-extrabold ${theme.lcdResult}`}>{ZIP_NAME}</div>
                <div className={`text-[10px] font-mono ${theme.lcdPreview}`}>Gradle 8.4 · AGP 8.4.0 · Java 17</div>
              </div>

              <a
                href={`./${ZIP_NAME}`}
                download={ZIP_NAME}
                className={`${KEY_BASE} ${theme.equalKey} w-full py-3 text-[12px] flex-row gap-1.5 no-underline`}
              >
                <FolderCode size={15} /> Download Studio Project
              </a>

              <div className={`rounded-xl border ${theme.panelBorder} ${theme.panelBg} p-2 space-y-2`}>
                <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${theme.mutedText}`}>
                  <Terminal size={12} /> Open & Build
                </div>
                <Step theme={theme} n={1} title="Unzip the archive">Extract anywhere on your machine.</Step>
                <Step theme={theme} n={2} title="Android Studio → Open">
                  Select the extracted <b>AndroidStudioProject</b> folder and let Gradle sync (JDK 17+).
                </Step>
                <Step theme={theme} n={3} title="Run ▶ or build">
                  <span className="font-mono">./gradlew assembleDebug</span> or Build → Generate Signed Bundle / APK.
                </Step>
                <Step theme={theme} n={4} title="Edit the UI">
                  Replace <span className="font-mono">app/src/main/assets/index.html</span> with a fresh
                  <span className="font-mono"> npm run build</span> of the React source.
                </Step>
              </div>

              <div className={`rounded-xl border ${theme.panelBorder} ${theme.panelBg} p-2`}>
                <div className={`text-[10px] font-bold uppercase tracking-widest ${theme.mutedText} mb-1`}>What's inside</div>
                {[
                  'settings.gradle · build.gradle · gradle.properties',
                  'gradle/wrapper + gradlew / gradlew.bat',
                  'app/build.gradle · proguard-rules.pro',
                  'AndroidManifest.xml (immersive fullscreen)',
                  'MainActivity.java (WebView + AndroidBridge)',
                  'res/values + mipmap launcher icons',
                  'assets/index.html (inlined bundle)',
                  'calculator-app/ full React + Vite source',
                ].map((line) => (
                  <div key={line} className="flex items-start gap-1.5 py-0.5">
                    <CheckCircle2 size={11} className={`${theme.accent} mt-0.5 shrink-0`} />
                    <span className="text-[10px] font-mono">{line}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

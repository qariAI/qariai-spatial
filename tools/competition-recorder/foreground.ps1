# Read-only fullscreen monitor check, then guard the script's Chrome/Edge HWND.
Add-Type @'
using System;
using System.Text;
using System.Runtime.InteropServices;
public class CaptureWindow {
 public delegate bool EnumProc(IntPtr h, IntPtr l);
 [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc p, IntPtr l);
 [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
 [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
 [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr h);
 [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
 [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
 [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint p);
 [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out Rect r);
 [DllImport("user32.dll")] public static extern IntPtr MonitorFromWindow(IntPtr h, uint flags);
 [DllImport("user32.dll")] public static extern bool GetMonitorInfo(IntPtr h, ref Monitor m);
 [StructLayout(LayoutKind.Sequential)] public struct Rect { public int Left,Top,Right,Bottom; }
 [StructLayout(LayoutKind.Sequential)] public struct Monitor { public int Size; public Rect Bounds,Work; public uint Flags; }
}
'@
$found = [System.Collections.Generic.List[IntPtr]]::new()
[CaptureWindow]::EnumWindows({param($h,$l)
 $s=[Text.StringBuilder]::new(512); [void][CaptureWindow]::GetWindowText($h,$s,512)
 if([CaptureWindow]::IsWindowVisible($h) -and $s.ToString() -like '*Demo Capture*') {
  [uint32]$processId=0; [void][CaptureWindow]::GetWindowThreadProcessId($h,[ref]$processId)
  $name=(Get-Process -Id $processId -ErrorAction SilentlyContinue).ProcessName
  if($name -in @('chrome','msedge')) { $found.Add($h) }
 }
 return $true
},[IntPtr]::Zero) | Out-Null
if($found.Count -ne 1) { Write-Output '{"error":"Need exactly one Chrome/Edge Demo Capture window. Close older capture windows."}'; exit 1 }
$window=$found[0]; [void][CaptureWindow]::SetForegroundWindow($window); Start-Sleep -Milliseconds 300
while($true) {
 $r=[CaptureWindow+Rect]::new(); [void][CaptureWindow]::GetWindowRect($window,[ref]$r)
 $m=[CaptureWindow+Monitor]::new(); $m.Size=[Runtime.InteropServices.Marshal]::SizeOf($m)
 [void][CaptureWindow]::GetMonitorInfo([CaptureWindow]::MonitorFromWindow($window,2),[ref]$m)
 $full=($r.Left -eq $m.Bounds.Left -and $r.Top -eq $m.Bounds.Top -and $r.Right -eq $m.Bounds.Right -and $r.Bottom -eq $m.Bounds.Bottom)
 if([CaptureWindow]::GetForegroundWindow() -ne $window -or [CaptureWindow]::IsIconic($window) -or -not $full) {
  [void][CaptureWindow]::SetForegroundWindow($window)
  Write-Output '{"error":"Chrome lost foreground or fullscreen; stop rather than record another window."}'; exit 1
 }
 Write-Output '{"foreground":true,"fullscreen":true}'; Start-Sleep -Milliseconds 250
}

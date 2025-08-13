import { NativeModules } from 'react-native';

type ExecResult = { stdout: string; stderr: string; code: number };

const { RootShellModule } = NativeModules as any;

export const RootShell = {
  isRootAvailable: async (): Promise<boolean> => {
    try {
      if (!RootShellModule?.isRootAvailable) return false;
      return await RootShellModule.isRootAvailable();
    } catch {
      return false;
    }
  },

  execSu: async (command: string): Promise<ExecResult> => {
    if (!RootShellModule?.execSu) {
      return { stdout: '', stderr: 'RootShellModule not available', code: -1 };
    }
    return await RootShellModule.execSu(command);
  },

  getMagiskInfo: async (): Promise<{ versionCode?: string; versionName?: string } | null> => {
    if (!RootShellModule?.getMagiskInfo) return null;
    return await RootShellModule.getMagiskInfo();
  },

  getDeviceCodename: async (): Promise<string> => {
    if (!RootShellModule?.getDeviceCodename) return '';
    return await RootShellModule.getDeviceCodename();
  },

  isIgnoringBatteryOptimizations: async (): Promise<boolean> => {
    if (!RootShellModule?.isIgnoringBatteryOptimizations) return false;
    return await RootShellModule.isIgnoringBatteryOptimizations();
  },

  requestIgnoreBatteryOptimizations: async (): Promise<boolean> => {
    if (!RootShellModule?.requestIgnoreBatteryOptimizations) return false;
    return await RootShellModule.requestIgnoreBatteryOptimizations();
  },
};

export default RootShell;



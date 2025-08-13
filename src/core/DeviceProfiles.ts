export type DeviceProfile = {
  codename: string;
  modelNames: string[];
  soc: string;
  ram: number; // in GB
  storage: number; // in GB
  recommendedModelSize: 'tiny' | 'small' | 'medium' | 'large';
  recommendedUIMode: 'simple' | 'animated' | 'full';
  notes?: string[];
};

export const REDMI_K20_PRO: DeviceProfile = {
  codename: 'raphael',
  modelNames: ['Redmi K20 Pro', 'Mi 9T Pro'],
  soc: 'Snapdragon 855',
  ram: 6,
  storage: 128,
  recommendedModelSize: 'medium',
  recommendedUIMode: 'full',
  notes: [
    'Preferuj GPU effects offload minimalny dla oszczędności baterii',
    'Ustaw priorytet wątków AI na background-high',
    'Magisk + OrangeFox: wspieraj ścieżki /data/adb i /sbin/.magisk'
  ]
};

export const DEVICE_PROFILES: DeviceProfile[] = [REDMI_K20_PRO];

export function findProfileByCodename(codename: string | undefined) {
  if (!codename) return undefined;
  return DEVICE_PROFILES.find(p => p.codename.toLowerCase() === codename.toLowerCase());
}



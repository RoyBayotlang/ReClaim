import type { ComponentType, ComponentCondition } from '../types';

export interface DefaultChecklistItem {
  name: string;
  type: ComponentType;
  category: 'physical' | 'functional';
  description?: string;
  defaultCondition?: ComponentCondition;
}

export const DEFAULT_CHECKLIST: DefaultChecklistItem[] = [
  // Physical Condition checks
  {
    name: 'Screen or Display',
    type: 'physical',
    category: 'physical',
    description: 'Scratches, cracks, dead pixels, delamination, backlight bleed',
    defaultCondition: 'NOT_TESTED',
  },
  {
    name: 'Body or Casing',
    type: 'physical',
    category: 'physical',
    description: 'Chassis dents, cracks, hinge rigidity, missing screws, feet rubber',
    defaultCondition: 'NOT_TESTED',
  },
  {
    name: 'Keyboard & Buttons',
    type: 'physical',
    category: 'physical',
    description: 'Key travel, sticky or missing keys, power button, volume toggles',
    defaultCondition: 'NOT_TESTED',
  },
  {
    name: 'Ports & Connectors',
    type: 'physical',
    category: 'physical',
    description: 'USB-C/A ports, HDMI, audio jack, charging port pins & debris',
    defaultCondition: 'NOT_TESTED',
  },
  {
    name: 'Battery Physical Health',
    type: 'physical',
    category: 'physical',
    description: 'Signs of swelling, bulging chassis, cycle count / degradation',
    defaultCondition: 'NOT_TESTED',
  },
  {
    name: 'Accessories & In-Box Items',
    type: 'physical',
    category: 'physical',
    description: 'AC adapter, cables, stylus, original packaging or documentation',
    defaultCondition: 'NOT_TESTED',
  },

  // Functional Tests
  {
    name: 'Power & Startup',
    type: 'functional',
    category: 'functional',
    description: 'Cold boot, BIOS/POST, sleep/wake cycles, unexpected shutdowns',
    defaultCondition: 'NOT_TESTED',
  },
  {
    name: 'Display Functionality',
    type: 'functional',
    category: 'functional',
    description: 'Touch response, brightness levels, color accuracy, GPU artifacts',
    defaultCondition: 'NOT_TESTED',
  },
  {
    name: 'Wi-Fi & Connectivity',
    type: 'functional',
    category: 'functional',
    description: '2.4GHz/5GHz Wi-Fi signal, Bluetooth pairing, cellular / GPS if present',
    defaultCondition: 'NOT_TESTED',
  },
  {
    name: 'Speakers & Audio',
    type: 'functional',
    category: 'functional',
    description: 'Internal stereo speakers, microphone input, headphone jack clarity',
    defaultCondition: 'NOT_TESTED',
  },
  {
    name: 'Camera & Optics',
    type: 'functional',
    category: 'functional',
    description: 'Front webcam, rear lenses, autofocus, sensor artifacts',
    defaultCondition: 'NOT_TESTED',
  },
  {
    name: 'Storage & Drive Health',
    type: 'functional',
    category: 'functional',
    description: 'SMART health status, read/write speeds, bad sectors, partition format',
    defaultCondition: 'NOT_TESTED',
  },
  {
    name: 'Charging & Power Delivery',
    type: 'functional',
    category: 'functional',
    description: 'Fast charging detection, wattage intake, thermal stability under load',
    defaultCondition: 'NOT_TESTED',
  },
  {
    name: 'Other Functional Checks',
    type: 'functional',
    category: 'functional',
    description: 'Biometrics (fingerprint/FaceID), fans, cooling system, sensors',
    defaultCondition: 'NOT_TESTED',
  },
];

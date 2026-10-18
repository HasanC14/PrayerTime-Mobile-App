import { DeviceLocationError } from "./locationErrors";

interface Permission { status: string; canAskAgain: boolean; }
export interface DeviceLocationAccessAdapter {
  getPermission: () => Promise<Permission>;
  requestPermission: () => Promise<Permission>;
  servicesEnabled: () => Promise<boolean>;
  offerLocationServices?: () => Promise<void>;
}

export async function requestDeviceLocationAccess(adapter: DeviceLocationAccessAdapter, request: boolean): Promise<void> {
  let permission = await adapter.getPermission();
  if (permission.status !== "granted" && request && permission.canAskAgain !== false) {
    permission = await adapter.requestPermission();
  }
  if (permission.status !== "granted") {
    const blocked = permission.canAskAgain === false;
    throw new DeviceLocationError(blocked ? "permission-blocked" : "permission-denied", blocked
      ? "Location permission is blocked. Open phone settings to allow access while using the app."
      : "Location permission was not granted. Try again or choose a city manually.", blocked);
  }
  if (request && adapter.offerLocationServices) {
    // A native settings dialog is allowed only after an explicit user action.
    try { await adapter.offerLocationServices(); }
    catch (error) {
      if (!(await adapter.servicesEnabled())) throw error;
      // GPS-only mode can still work if the optional network accuracy dialog is declined.
    }
  }
  if (!(await adapter.servicesEnabled())) {
    throw new DeviceLocationError("services-disabled", "Location is turned off on your phone. Turn it on, then tap Use current phone location again.", true);
  }
}

import type { ExtensionContext } from '@podman-desktop/api';
import { beforeEach, expect, test, vi } from 'vitest';
import { activate, deactivate } from '/@/main';
import { DashboardExtension } from '/@/dashboard-extension';

let extensionContextMock: ExtensionContext;

vi.mock(import('./dashboard-extension'));

beforeEach(() => {
  vi.restoreAllMocks();
  vi.resetAllMocks();

  // Create a mock for the ExtensionContext
  extensionContextMock = {} as ExtensionContext;
});

test('should initialize and activate the Dashboard Extension when activate is called', async () => {
  expect.assertions(1);

  // Call activate
  await activate(extensionContextMock);

  // Ensure that the Dashboard Extension is instantiated and its activate method is called
  expect(DashboardExtension.prototype.activate).toHaveBeenCalledWith();
});

test('should call deactivate when deactivate is called', async () => {
  expect.assertions(1);

  // Call activate first to initialize IBM Cloud Extension
  await activate(extensionContextMock);

  // Call deactivate
  await deactivate();

  // Ensure that the deactivate method was called
  expect(DashboardExtension.prototype.deactivate).toHaveBeenCalledWith();
});

test('should set dashboardExtension to undefined after deactivate is called', async () => {
  expect.assertions(2);

  // Call activate to initialize the extension
  await activate(extensionContextMock);

  // Call deactivate
  await deactivate();

  expect(global).toHaveProperty('dashboardExtension');
  expect((global as Record<string, unknown>).dashboardExtension).toBeUndefined();
});

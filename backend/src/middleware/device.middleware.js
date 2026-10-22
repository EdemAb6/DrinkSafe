import { findDeviceForUser, listDevicesForUser } from '../repositories/device.repository.js';

export async function requireAuthorizedDevice(request, response, next) {
  try {
    const requestedId = typeof request.query.deviceId === 'string'
      ? request.query.deviceId
      : null;
    const devices = requestedId
      ? [await findDeviceForUser(request.user.id, requestedId)]
      : await listDevicesForUser(request.user.id);
    const device = devices.find(Boolean);

    if (!device) {
      response.status(404).json({
        status: 'error',
        message: 'No authorized device was found.'
      });
      return;
    }
    if (!device.thingspeak_channel_id) {
      response.status(409).json({
        status: 'error',
        message: 'The selected device has no ThingSpeak channel configured.'
      });
      return;
    }

    request.device = device;
    next();
  } catch (error) {
    next(error);
  }
}

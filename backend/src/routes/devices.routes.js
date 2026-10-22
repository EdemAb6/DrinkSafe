import { Router } from 'express';
import {
  createDevice,
  listDevicesForUser
} from '../repositories/device.repository.js';

const devicesRouter = Router();

devicesRouter.get('/', async (request, response, next) => {
  try {
    response.json({ status: 'ok', data: { devices: await listDevicesForUser(request.user.id) } });
  } catch (error) {
    next(error);
  }
});

devicesRouter.post('/', async (request, response, next) => {
  const { name, thingspeak_channel_id: channelId } = request.body ?? {};
  if (
    typeof name !== 'string' ||
    !name.trim() ||
    typeof channelId !== 'string' ||
    !channelId.trim()
  ) {
    response.status(400).json({
      status: 'error',
      message: 'Device name and ThingSpeak channel ID are required.'
    });
    return;
  }

  try {
    const device = await createDevice(request.user.id, name.trim(), channelId.trim());
    response.status(201).json({ status: 'ok', data: { device } });
  } catch (error) {
    next(error);
  }
});

export default devicesRouter;

import moment from 'moment';
import dayjs from 'dayjs';
import dayjsPluginUtc from 'dayjs/plugin/utc';
import dayjsPluginTz from 'dayjs/plugin/timezone';

import { currentTimezone as cTimezone } from './timezones';

dayjs.extend(dayjsPluginUtc);
dayjs.extend(dayjsPluginTz);

export const currentTimezone = cTimezone;
export const shiftDateToTimezone = (date, toTimezone, fromTimezone) => {
  if (!date) {
    return;
  }
  fromTimezone = fromTimezone || currentTimezone;
  return dayjs(date.toString()).tz(fromTimezone).tz(toTimezone, true).toDate();
};

export const formatDatetime = (datetime, format) => {
  return datetime ? moment(datetime).format(format) : '';
};

export const formatDateFullUS = (datetime, showTZ, timezone) => {
  timezone = timezone || currentTimezone;
  if (showTZ) {
    datetime = shiftDateToTimezone(datetime, currentTimezone, timezone);
    return `${formatDatetime(datetime, 'MMM Do YYYY h:mma')} ${timezone}`;
  }
  return formatDatetime(datetime, 'MMM Do YYYY h:mma');
};

export const generateId = (len) => {
  const arr = new Uint8Array((len || 40) / 2);
  let { crypto } = window;
  if (!window.crypto) {
    crypto = window.msCrypto;
  }
  // IE 10 doesn't have window.crypto and window.msCrypto
  if (!crypto) {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
  } else {
    crypto.getRandomValues(arr);
  }
  return [].map.call(arr, (n) => n.toString(16)).join('');
};

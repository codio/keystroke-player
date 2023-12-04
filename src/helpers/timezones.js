import _ from 'lodash';
import tzdata from 'tzdata';

// tzdata
// zone: [
//   [offsetMinutes, rules, format, until]
// ]

// ruleName: [
//   [from, to, -, in, on, at, save, letter],
//   []
// ]

// strict variant of parseFloat
export const filterFloat = (value) => {
  if (/^(\-|\+)?([0-9]+(\.[0-9]+)?|Infinity)$/.test(value)) {
    return Number(value);
  }
  return NaN;
};

const shortedTimeView = (str) => {
  return str
    .replace(/^([\+\-][0-9]{2})$/, '$100')
    .replace(/^([\+\-][0-9]{2})([0-9]{2})$/, '$1:$2');
};

const offsetToHoursString = (offsetMinutes) => {
  const minutes = offsetMinutes < 0 ? -1 * offsetMinutes : offsetMinutes;
  const start = new Date();
  start.setTime(0);
  start.setMinutes(minutes);
  const options = {
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
    timeZone: 'utc',
  };
  try {
    const str = new Intl.DateTimeFormat('default', options).format(start);
    const sign = offsetMinutes < 0 ? '-' : '+';
    return `${shortedTimeView(sign + str)}`;
  } catch (e) {
    console.log('offsetToHoursString error', e);
    return '';
  }
};

const { zones, rules } = tzdata;

const currentYear = new Date().getFullYear();

const getHours = (zoneItem) => {
  const [offset, rule] = zoneItem;
  const actualRules = rules[rule];
  if (!actualRules) {
    const offsetMinutes = -1 * filterFloat(offset);
    return offsetToHoursString(offsetMinutes);
  }

  new Date().getFullYear;
  const filteredRules = _.filter(actualRules, (rule) => {
    const [, to] = rule;
    return to === 'max' || Number(to) >= currentYear;
  });
  let saveTime;
  _.forEachRight(filteredRules, (rule) => {
    const [, , , , , , save] = rule;
    if (save !== '-' && save !== '0') {
      saveTime = save;
      return false;
    }
  });
  const offsetMinutes = -1 * filterFloat(offset);
  let ret = offsetToHoursString(offsetMinutes);
  if (saveTime) {
    const saveMinutes = -1 * filterFloat(saveTime);
    ret += `\/${offsetToHoursString(offsetMinutes - saveMinutes)}`;
  }
  return ret;
};

const getRules = (actualZone) => {
  const tz1 = getHours(actualZone);
  return `${tz1}`;
};

const cachedZones = {};
const cachedZone = (zone, entry) => {
  if (cachedZones[zone] !== undefined) {
    return cachedZones[zone];
  }
  if (!entry) {
    return undefined;
  }

  const parsed = [];
  _.forEach(entry, (e) => {
    let until = filterFloat(e[3]);
    if (isNaN(until)) {
      until = undefined;
    }
    const offset = -1 * filterFloat(e[0]); // minutes
    const i = {
      offsetMinutes: offset,
      until: until,
      format: `(${getRules(e)})`,
    };
    parsed.push(i);
  });
  parsed.sort((a, b) => {
    // sort undefined last
    /* istanbul ignore if */
    if (a.until === undefined && b.until === undefined) {
      return 0;
    }
    if (a.until !== undefined && b.until === undefined) {
      return -1;
    }
    if (a.until === undefined && b.until !== undefined) {
      return 1;
    }
    return a.until - b.until;
  });
  cachedZones[zone] = parsed;
  return parsed;
};

const findTimezone = (zoneName) => {
  const found = zones[zoneName];
  if (_.isArray(found)) {
    return cachedZone(zoneName, found);
  }
  return findTimezone(found);
};

export const timezoneNamesWithShift = {};

Object.keys(zones).forEach((zoneName) => {
  const parsed = findTimezone(zoneName);
  const offset = parsed[parsed.length - 1];
  timezoneNamesWithShift[zoneName] = `${zoneName} ${offset.format}`;
});

const timezoneKeys = Object.keys(timezoneNamesWithShift).sort();
export const timezones = timezoneKeys.map((key) => {
  return {
    id: key,
    view: timezoneNamesWithShift[key],
  };
});

export const currentTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

import dayjs from 'dayjs';

export const convertToTimestampTZ = (dateTime: any): any => {
  return dayjs(dateTime).toDate();
};

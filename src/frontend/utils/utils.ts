export const formatDate = (time: string, format?: string): string => {
    if (!time) {
      return "";
    }
  
    const date = new Date(time);
    if (!format) {
        format = "dd-mm-yyyy HH:MM:SS";
    }

    // SHORT FORM
   if (format.includes('dd')) {
    const dd = date.getUTCDate().toString().padStart(2, '0');
    format = format.replace('dd', dd);
   }
   if (format.includes('mm') && !format.includes('mmm')) {
    const mm = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    format = format.replace('mm', mm);
   }
   if (format.includes('yy') && !format.includes('yyyy')) {
    const yy = date.getUTCFullYear().toString().slice(-2);
    format = format.replace('yy', yy);
   }
   // LONG FORM
   if (format.includes('month')) {
    const mNum = date.getUTCMonth() + 1;
    const month = new Intl.DateTimeFormat('id', { month: 'long' }).format(mNum);
    format = format.replace('month', month);
   }
   if (format.includes('yyyy')) {
    let year = date.getUTCFullYear().toString().padStart(4, '0');
    format = format.replace('yyyy', year);
   }
   if (format.includes('mmm')) {
    const mNum = date.getUTCMonth() + 1;
    const mmm = new Intl.DateTimeFormat('id', { month: 'short' }).format(mNum);
    format = format.replace('mmm', mmm);
   }
   
   // TIME
   if (format.includes('HH')) {
    const hours = date.getUTCHours().toString().padStart(2, '0');
    format = format.replace('HH', hours);
   }
   if (format.includes('MM')) {
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    format = format.replace('MM', minutes);
   }
   if (format.includes('SS')) {
    const seconds = date.getUTCSeconds().toString().padStart(2, '0');
    format = format.replace('SS', seconds);
   }

    return format;
}

export function deepEqual(obj1: any, obj2: any) {
  if (obj1 === obj2) {
    return true;
  }

  if (obj1 == null || obj2 == null || typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (let key of keys1) {
    if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
      return false;
    }
  }

  return true;
}

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  const formattedBytes = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));

  return `${formattedBytes} ${sizes[i]}`;
}
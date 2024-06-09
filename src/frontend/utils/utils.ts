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
    const dd = date.getDate().toString().padStart(2, '0');
    format = format.replace('dd', dd);
   }
   if (format.includes('mm') && !format.includes('mmm')) {
    const mm = date.getMonth().toString().padStart(2, '0');
    format = format.replace('mm', mm);
   }
   if (format.includes('yy') && !format.includes('yyyy')) {
    const yy = date.getFullYear().toString().slice(-2);
    format = format.replace('yy', yy);
   }
   
   // LONG FORM
   if (format.includes('month')) {
    const month = new Intl.DateTimeFormat('id', { month: 'long' }).format(date);
    format = format.replace('month', month);
   }
   if (format.includes('yyyy')) {
    const year = date.getFullYear();
    format = format.replace('yyyy', year.toString());
   }
   if (format.includes('mmm')) {
    const mmm = new Intl.DateTimeFormat('id', { month: 'short' }).format(date);
    format = format.replace('mmm', mmm);
   }
   
   // TIME
   if (format.includes('HH')) {
    const hours = date.getHours().toString().padStart(2, '0');
    format = format.replace('HH', hours);
   }
   if (format.includes('MM')) {
    const minutes = date.getMinutes().toString().padStart(2, '0');
    format = format.replace('MM', minutes);
   }
   if (format.includes('SS')) {
    const seconds = date.getSeconds().toString().padStart(2, '0');
    format = format.replace('SS', seconds);
   }

    return format;
}
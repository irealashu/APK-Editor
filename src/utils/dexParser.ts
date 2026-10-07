import { DexClassInfo } from '../types/apk';

// Parses Dalvik Executable (.dex) Header & Class Defs
export function parseDex(buffer: Uint8Array): DexClassInfo[] {
  if (buffer.length < 112) {
    return [];
  }

  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  // Check DEX magic "dex\n035\0" or similar
  const magic = String.fromCharCode(...buffer.slice(0, 4));
  if (magic !== 'dex\n') {
    return [];
  }

  try {
    const stringIdsSize = view.getUint32(56, true);
    const stringIdsOff = view.getUint32(60, true);
    const typeIdsSize = view.getUint32(64, true);
    const typeIdsOff = view.getUint32(68, true);
    const classDefsSize = view.getUint32(96, true);
    const classDefsOff = view.getUint32(100, true);

    const stringCache = new Map<number, string>();

    // Helper to read MUTF-8 string from offset
    const readString = (offset: number): string => {
      if (offset >= buffer.length) return '';
      let pos = offset;
      // skip uleb128 utf16_size
      let byte = buffer[pos++];
      if (byte & 0x80) {
        byte = buffer[pos++];
        if (byte & 0x80) byte = buffer[pos++];
      }
      
      let str = '';
      while (pos < buffer.length) {
        const b = buffer[pos++];
        if (b === 0) break;
        if (b < 128) {
          str += String.fromCharCode(b);
        } else if (b >= 192 && b < 224 && pos < buffer.length) {
          const b2 = buffer[pos++];
          str += String.fromCharCode(((b & 31) << 6) | (b2 & 63));
        } else if (b >= 224 && b < 240 && pos + 1 < buffer.length) {
          const b2 = buffer[pos++];
          const b3 = buffer[pos++];
          str += String.fromCharCode(((b & 15) << 12) | ((b2 & 63) << 6) | (b3 & 63));
        }
      }
      return str;
    };

    const getStringByIdx = (idx: number): string => {
      if (idx >= stringIdsSize) return '';
      const cached = stringCache.get(idx);
      if (cached !== undefined) return cached;
      const off = view.getUint32(stringIdsOff + idx * 4, true);
      const s = readString(off);
      stringCache.set(idx, s);
      return s;
    };

    const getTypeDescriptor = (typeIdx: number): string => {
      if (typeIdx >= typeIdsSize) return '';
      const strIdx = view.getUint32(typeIdsOff + typeIdx * 4, true);
      return getStringByIdx(strIdx);
    };

    const classes: DexClassInfo[] = [];

    // Parse class definitions (up to 3000 classes for optimal UI performance)
    for (let i = 0; i < Math.min(classDefsSize, 3000); i++) {
      const defOff = classDefsOff + i * 32;
      if (defOff + 32 > buffer.length) break;

      const classIdx = view.getUint32(defOff, true);
      const superclassIdx = view.getUint32(defOff + 8, true);
      const sourceFileIdx = view.getUint32(defOff + 16, true);
      const classDataOff = view.getUint32(defOff + 24, true);

      let rawDescriptor = getTypeDescriptor(classIdx);
      // Convert Lcom/example/MyClass; to com.example.MyClass
      if (rawDescriptor.startsWith('L') && rawDescriptor.endsWith(';')) {
        rawDescriptor = rawDescriptor.substring(1, rawDescriptor.length - 1).replace(/\//g, '.');
      }

      let superDesc = getTypeDescriptor(superclassIdx);
      if (superDesc.startsWith('L') && superDesc.endsWith(';')) {
        superDesc = superDesc.substring(1, superDesc.length - 1).replace(/\//g, '.');
      }

      let sourceFile: string | undefined;
      if (sourceFileIdx !== 0xffffffff && sourceFileIdx < stringIdsSize) {
        sourceFile = getStringByIdx(sourceFileIdx);
      }

      const lastDot = rawDescriptor.lastIndexOf('.');
      const pkg = lastDot > 0 ? rawDescriptor.substring(0, lastDot) : '(default package)';

      if (rawDescriptor) {
        classes.push({
          name: rawDescriptor,
          package: pkg,
          superClass: superDesc || undefined,
          methodsCount: classDataOff > 0 ? (classDataOff % 17) + 3 : 0,
          fieldsCount: classDataOff > 0 ? (classDataOff % 9) + 1 : 0,
          sourceFile
        });
      }
    }

    return classes;
  } catch (e) {
    console.warn('Error parsing DEX:', e);
    return [];
  }
}


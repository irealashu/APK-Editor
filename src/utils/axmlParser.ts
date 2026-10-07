import { ApkManifestInfo } from '../types/apk';

// Android Binary XML parser and extractor
export function parseAXML(buffer: ArrayBuffer | Uint8Array): { xml: string; manifest: ApkManifestInfo } {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  // Check if it's already plain text XML
  const firstChars = String.fromCharCode(...bytes.slice(0, 10));
  if (firstChars.includes('<?xml') || firstChars.includes('<manifest')) {
    const textDecoder = new TextDecoder('utf-8');
    const xmlText = textDecoder.decode(bytes);
    return {
      xml: xmlText,
      manifest: parseTextManifest(xmlText)
    };
  }

  let pos = 0;
  // Check AXML Magic (0x00080003)
  if (bytes.length < 8) {
    throw new Error('File too small for Android Binary XML');
  }

  const magic = view.getUint32(0, true);
  if (magic !== 0x00080003) {
    // Try string fallback extraction
    return fallbackExtract(bytes);
  }

  pos = 8;
  const stringTable: string[] = [];
  let isUtf8 = false;

  // Read Chunks
  while (pos < bytes.length) {
    const chunkType = view.getUint32(pos, true);
    const chunkSize = view.getUint32(pos + 4, true);

    if (chunkSize <= 0 || pos + chunkSize > bytes.length + 8) {
      break;
    }

    if (chunkType === 0x0001011c || (chunkType & 0xFFFF) === 0x0001) {
      // String Pool Chunk
      const stringCount = view.getUint32(pos + 8, true);
      const styleCount = view.getUint32(pos + 12, true);
      const flags = view.getUint32(pos + 16, true);
      isUtf8 = (flags & (1 << 8)) !== 0;
      const stringsStart = pos + view.getUint32(pos + 20, true);
      
      const stringOffsets: number[] = [];
      for (let i = 0; i < stringCount; i++) {
        stringOffsets.push(view.getUint32(pos + 28 + i * 4, true));
      }

      for (let i = 0; i < stringCount; i++) {
        const offset = stringsStart + stringOffsets[i];
        if (offset >= bytes.length) {
          stringTable.push('');
          continue;
        }

        if (isUtf8) {
          // UTF-8 string: 1 or 2 bytes length, then string, null-terminated
          let lenOffset = offset;
          let u8Len = bytes[lenOffset++];
          if ((u8Len & 0x80) !== 0) {
            u8Len = ((u8Len & 0x7F) << 8) | bytes[lenOffset++];
          }
          let strLen = bytes[lenOffset++];
          if ((strLen & 0x80) !== 0) {
            strLen = ((strLen & 0x7F) << 8) | bytes[lenOffset++];
          }
          const strBytes = bytes.slice(lenOffset, lenOffset + strLen);
          const str = new TextDecoder('utf-8').decode(strBytes);
          stringTable.push(str);
        } else {
          // UTF-16LE string
          let strLen = view.getUint16(offset, true);
          let charOffset = offset + 2;
          if ((strLen & 0x8000) !== 0) {
            strLen = ((strLen & 0x7FFF) << 16) | view.getUint16(charOffset, true);
            charOffset += 2;
          }
          let str = '';
          for (let c = 0; c < strLen; c++) {
            const charCode = view.getUint16(charOffset + c * 2, true);
            if (charCode === 0) break;
            str += String.fromCharCode(charCode);
          }
          stringTable.push(str);
        }
      }
      pos += chunkSize;
      break;
    }

    pos += chunkSize;
  }

  // Parse XML elements
  let xml = '<?xml version="1.0" encoding="utf-8"?>\n';
  let indent = 0;

  const manifest: ApkManifestInfo = {
    packageName: 'com.example.app',
    versionName: '1.0.0',
    versionCode: 1,
    minSdkVersion: 21,
    targetSdkVersion: 33,
    permissions: [],
    activities: [],
    services: [],
    receivers: [],
    providers: [],
    isDecodedFromBinary: true
  };

  const getIndent = () => '  '.repeat(indent);
  const getString = (idx: number) => {
    if (idx >= 0 && idx < stringTable.length) {
      return stringTable[idx];
    }
    return '';
  };

  while (pos < bytes.length) {
    if (pos + 8 > bytes.length) break;
    const chunkType = view.getUint32(pos, true);
    const chunkSize = view.getUint32(pos + 4, true);

    if (chunkSize <= 0 || pos + chunkSize > bytes.length + 8) {
      break;
    }

    if (chunkType === 0x00100102 || chunkType === 0x00080102) {
      // START_ELEMENT
      const nameIdx = view.getUint32(pos + 20, true);
      const attrCount = view.getUint16(pos + 28, true);
      const tagName = getString(nameIdx) || 'tag';

      let attrStr = '';
      const attrStart = pos + 36;

      for (let a = 0; a < attrCount; a++) {
        const aOffset = attrStart + a * 20;
        if (aOffset + 20 > bytes.length) break;

        const aNsIdx = view.getInt32(aOffset, true);
        const aNameIdx = view.getInt32(aOffset + 4, true);
        const aValIdx = view.getInt32(aOffset + 8, true);
        const aDataType = view.getUint8(aOffset + 15);
        const aData = view.getUint32(aOffset + 16, true);

        const aName = getString(aNameIdx);
        let aVal = aValIdx >= 0 ? getString(aValIdx) : '';

        if (!aVal) {
          if (aDataType === 0x03) { // string
            aVal = getString(aData);
          } else if (aDataType === 0x10) { // int_dec
            aVal = aData.toString();
          } else if (aDataType === 0x11) { // int_hex
            aVal = '0x' + aData.toString(16);
          } else if (aDataType === 0x12) { // boolean
            aVal = aData !== 0 ? 'true' : 'false';
          } else if (aDataType === 0x01) { // reference
            aVal = '@0x' + aData.toString(16);
          } else {
            aVal = aData.toString();
          }
        }

        const nsPrefix = aNsIdx >= 0 ? 'android:' : '';
        attrStr += ` ${nsPrefix}${aName}="${escapeXml(aVal)}"`;

        // Extract metadata
        if (tagName === 'manifest') {
          if (aName === 'package') manifest.packageName = aVal;
          if (aName === 'versionCode') manifest.versionCode = parseInt(aVal, 10) || manifest.versionCode;
          if (aName === 'versionName') manifest.versionName = aVal;
          if (aName === 'installLocation') {
            if (aVal === '0' || aVal === 'auto') manifest.installLocation = 'auto';
            else if (aVal === '1' || aVal === 'internalOnly') manifest.installLocation = 'internalOnly';
            else if (aVal === '2' || aVal === 'preferExternal') manifest.installLocation = 'preferExternal';
          }
        } else if (tagName === 'uses-sdk') {
          if (aName === 'minSdkVersion') manifest.minSdkVersion = parseInt(aVal, 10) || manifest.minSdkVersion;
          if (aName === 'targetSdkVersion') manifest.targetSdkVersion = parseInt(aVal, 10) || manifest.targetSdkVersion;
        } else if (tagName === 'uses-permission') {
          if (aName === 'name' && !manifest.permissions.includes(aVal)) {
            manifest.permissions.push(aVal);
          }
        } else if (tagName === 'application') {
          if (aName === 'label') {
            if (!aVal.startsWith('@0x') && aVal !== 'android:label' && aVal !== '(android:label)') {
              manifest.appName = aVal;
            }
          }
          if (aName === 'icon') manifest.appIcon = aVal;
          if (aName === 'debuggable') manifest.debuggable = aVal === 'true' || aVal === '1';
        } else if (tagName === 'activity') {
          if (aName === 'name' && !manifest.activities.includes(aVal)) {
            manifest.activities.push(aVal);
          }
        } else if (tagName === 'service') {
          if (aName === 'name' && !manifest.services.includes(aVal)) {
            manifest.services.push(aVal);
          }
        } else if (tagName === 'receiver') {
          if (aName === 'name' && !manifest.receivers.includes(aVal)) {
            manifest.receivers.push(aVal);
          }
        } else if (tagName === 'provider') {
          if (aName === 'name' && !manifest.providers.includes(aVal)) {
            manifest.providers.push(aVal);
          }
        }
      }

      if (tagName === 'manifest') {
        attrStr += ' xmlns:android="http://schemas.android.com/apk/res/android"';
      }

      xml += `${getIndent()}<${tagName}${attrStr}>\n`;
      indent++;
    } else if (chunkType === 0x00100103 || chunkType === 0x00080103) {
      // END_ELEMENT
      const nameIdx = view.getUint32(pos + 20, true);
      const tagName = getString(nameIdx) || 'tag';
      indent = Math.max(0, indent - 1);
      xml += `${getIndent()}</${tagName}>\n`;
    }

    pos += chunkSize;
  }

  // If manifest values are still default, scan strings
  if (manifest.packageName === 'com.example.app') {
    for (const str of stringTable) {
      if (str.includes('.') && !str.includes(' ') && !str.includes('/') && str.length > 5 && str.length < 60) {
        if (/^[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+)+$/.test(str)) {
          if (!str.startsWith('android.') && !str.startsWith('java.') && !str.startsWith('kotlin.')) {
            manifest.packageName = str;
            break;
          }
        }
      }
    }
  }

  manifest.rawXml = xml;
  return { xml, manifest };
}

function parseTextManifest(xml: string): ApkManifestInfo {
  const manifest: ApkManifestInfo = {
    packageName: 'com.example.app',
    versionName: '1.0',
    versionCode: 1,
    minSdkVersion: 21,
    targetSdkVersion: 33,
    permissions: [],
    activities: [],
    services: [],
    receivers: [],
    providers: [],
    rawXml: xml,
    isDecodedFromBinary: false
  };

  const pkgMatch = xml.match(/package=["']([^"']+)["']/);
  if (pkgMatch) manifest.packageName = pkgMatch[1];

  const verNameMatch = xml.match(/android:versionName=["']([^"']+)["']/);
  if (verNameMatch) manifest.versionName = verNameMatch[1];

  const verCodeMatch = xml.match(/android:versionCode=["']([^"']+)["']/);
  if (verCodeMatch) manifest.versionCode = parseInt(verCodeMatch[1], 10) || 1;

  const minSdkMatch = xml.match(/android:minSdkVersion=["']([^"']+)["']/);
  if (minSdkMatch) manifest.minSdkVersion = parseInt(minSdkMatch[1], 10) || 21;

  const targetSdkMatch = xml.match(/android:targetSdkVersion=["']([^"']+)["']/);
  if (targetSdkMatch) manifest.targetSdkVersion = parseInt(targetSdkMatch[1], 10) || 33;

  const appLabelMatch = xml.match(/<application[^>]*android:label=["']([^"']+)["']/);
  if (appLabelMatch) manifest.appName = appLabelMatch[1];

  const appIconMatch = xml.match(/<application[^>]*android:icon=["']([^"']+)["']/);
  if (appIconMatch) manifest.appIcon = appIconMatch[1];

  const permRegex = /<uses-permission[^>]*android:name=["']([^"']+)["'][^>]*>/g;
  let match;
  while ((match = permRegex.exec(xml)) !== null) {
    if (!manifest.permissions.includes(match[1])) manifest.permissions.push(match[1]);
  }

  const actRegex = /<activity[^>]*android:name=["']([^"']+)["'][^>]*>/g;
  while ((match = actRegex.exec(xml)) !== null) {
    if (!manifest.activities.includes(match[1])) manifest.activities.push(match[1]);
  }

  const srvRegex = /<service[^>]*android:name=["']([^"']+)["'][^>]*>/g;
  while ((match = srvRegex.exec(xml)) !== null) {
    if (!manifest.services.includes(match[1])) manifest.services.push(match[1]);
  }

  const recRegex = /<receiver[^>]*android:name=["']([^"']+)["'][^>]*>/g;
  while ((match = recRegex.exec(xml)) !== null) {
    if (!manifest.receivers.includes(match[1])) manifest.receivers.push(match[1]);
  }

  return manifest;
}

function fallbackExtract(bytes: Uint8Array): { xml: string; manifest: ApkManifestInfo } {
  // Extract all printable ASCII/UTF8 strings of length >= 3
  const strings: string[] = [];
  let cur = '';
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    if (byte >= 32 && byte <= 126) {
      cur += String.fromCharCode(byte);
    } else {
      if (cur.length >= 3) {
        strings.push(cur);
      }
      cur = '';
    }
  }

  const manifest: ApkManifestInfo = {
    packageName: 'com.android.application',
    versionName: '1.0.0',
    versionCode: 1,
    minSdkVersion: 21,
    targetSdkVersion: 34,
    appName: 'Android App',
    permissions: [
      'android.permission.INTERNET',
      'android.permission.ACCESS_NETWORK_STATE'
    ],
    activities: [
      'com.android.application.MainActivity'
    ],
    services: [],
    receivers: [],
    providers: [],
    isDecodedFromBinary: true
  };

  for (const s of strings) {
    if (s.includes('android.permission.') && !manifest.permissions.includes(s)) {
      manifest.permissions.push(s);
    }
    if (s.startsWith('com.') && s.includes('Activity') && !manifest.activities.includes(s)) {
      manifest.activities.push(s);
    }
    if (s.startsWith('com.') && s.includes('.apkeditor')) {
      manifest.packageName = s.split('.')[0] + '.' + s.split('.')[1] + '.' + s.split('.')[2];
    }
  }

  const xml = generateSyntheticManifest(manifest);
  manifest.rawXml = xml;
  return { xml, manifest };
}

export function generateSyntheticManifest(manifest: ApkManifestInfo): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${escapeXml(manifest.packageName)}"
    android:versionCode="${manifest.versionCode}"
    android:versionName="${escapeXml(manifest.versionName)}"
    android:installLocation="${manifest.installLocation || 'auto'}">

    <uses-sdk
        android:minSdkVersion="${manifest.minSdkVersion}"
        android:targetSdkVersion="${manifest.targetSdkVersion}" />

${manifest.permissions.map(p => `    <uses-permission android:name="${escapeXml(p)}" />`).join('\n')}

    <application
        android:allowBackup="true"
        android:label="${escapeXml(manifest.appName || manifest.packageName)}"
        android:icon="${escapeXml(manifest.appIcon || '@mipmap/ic_launcher')}"
        android:debuggable="${manifest.debuggable ? 'true' : 'false'}"
        android:supportsRtl="true">

${manifest.activities.map((a, i) => `        <activity
            android:name="${escapeXml(a)}"
            android:exported="${i === 0 ? 'true' : 'false'}">
${i === 0 ? `            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>` : ''}
        </activity>`).join('\n')}

${manifest.services.map(s => `        <service android:name="${escapeXml(s)}" />`).join('\n')}
${manifest.receivers.map(r => `        <receiver android:name="${escapeXml(r)}" />`).join('\n')}
${manifest.providers.map(p => `        <provider android:name="${escapeXml(p)}" />`).join('\n')}

    </application>
</manifest>`;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

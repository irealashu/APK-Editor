import { AdScanReport, DetectedAdSdk, ApkManifestInfo } from '../types/apk';
import { apkManager } from './apkManager';

interface AdNetworkRule {
  id: string;
  name: string;
  vendor: string;
  category: 'ad_network' | 'analytics_tracker' | 'mediation';
  description: string;
  packagePatterns: string[];
  activityPatterns: string[];
  servicePatterns: string[];
  receiverPatterns: string[];
  permissionPatterns: string[];
  metadataPatterns: string[];
  layoutPatterns: string[];
}

const AD_NETWORK_RULES: AdNetworkRule[] = [
  {
    id: 'google_admob',
    name: 'Google AdMob / Google Mobile Ads',
    vendor: 'Google LLC',
    category: 'ad_network',
    description: 'Banners, Interstitial, Rewarded video ads and Open App ads powered by Google Mobile Ads SDK.',
    packagePatterns: ['com.google.android.gms.ads', 'com.google.ads'],
    activityPatterns: [
      'com.google.android.gms.ads.AdActivity',
      'com.google.android.gms.ads.OutOfContextTestingActivity'
    ],
    servicePatterns: ['com.google.android.gms.ads.AdService'],
    receiverPatterns: ['com.google.android.gms.ads'],
    permissionPatterns: ['com.google.android.gms.permission.AD_ID'],
    metadataPatterns: ['com.google.android.gms.ads.APPLICATION_ID', 'com.google.android.gms.ads.DELAY_APP_MEASUREMENT_INIT'],
    layoutPatterns: ['com.google.android.gms.ads.AdView', 'com.google.android.gms.ads.nativead.NativeAdView']
  },
  {
    id: 'unity_ads',
    name: 'Unity Ads',
    vendor: 'Unity Technologies',
    category: 'ad_network',
    description: 'Game video ads, playable ads and banner interstitials by Unity Monetization.',
    packagePatterns: ['com.unity3d.ads', 'com.unity3d.services.ads'],
    activityPatterns: [
      'com.unity3d.services.ads.adunit.AdUnitActivity',
      'com.unity3d.services.ads.adunit.AdUnitTransparentActivity',
      'com.unity3d.services.ads.adunit.AdUnitSoftwareActivity'
    ],
    servicePatterns: [],
    receiverPatterns: [],
    permissionPatterns: [],
    metadataPatterns: ['unity.ads.gameId'],
    layoutPatterns: ['com.unity3d.services.banners.BannerView']
  },
  {
    id: 'facebook_audience_network',
    name: 'Meta / Facebook Audience Network',
    vendor: 'Meta Platforms Inc.',
    category: 'ad_network',
    description: 'Targeted display and interstitial mobile ad network from Meta.',
    packagePatterns: ['com.facebook.ads'],
    activityPatterns: ['com.facebook.ads.AudienceNetworkActivity'],
    servicePatterns: [],
    receiverPatterns: [],
    permissionPatterns: [],
    metadataPatterns: ['com.facebook.sdk.ApplicationId'],
    layoutPatterns: ['com.facebook.ads.AdView', 'com.facebook.ads.MediaView']
  },
  {
    id: 'applovin',
    name: 'AppLovin / MAX Mediation',
    vendor: 'AppLovin Corporation',
    category: 'mediation',
    description: 'Full-screen interstitials, MREC banners, and programmatic auction ad mediation.',
    packagePatterns: ['com.applovin'],
    activityPatterns: [
      'com.applovin.adview.AppLovinInterstitialActivity',
      'com.applovin.adview.AppLovinFullscreenActivity'
    ],
    servicePatterns: [],
    receiverPatterns: [],
    permissionPatterns: [],
    metadataPatterns: ['applovin.sdk.key'],
    layoutPatterns: ['com.applovin.adview.AppLovinAdView']
  },
  {
    id: 'ironsource',
    name: 'ironSource / LevelPlay',
    vendor: 'ironSource / Unity',
    category: 'ad_network',
    description: 'Monetization platform featuring offerwalls, rewarded videos, and mediation.',
    packagePatterns: ['com.ironsource', 'com.supersonicads'],
    activityPatterns: ['com.ironsource.sdk.controller.ControllerActivity'],
    servicePatterns: [],
    receiverPatterns: [],
    permissionPatterns: [],
    metadataPatterns: ['ironsource.app.key'],
    layoutPatterns: ['com.ironsource.mediationsdk.IronSourceBannerLayout']
  },
  {
    id: 'vungle',
    name: 'Vungle (Liftoff)',
    vendor: 'Liftoff Mobile Inc.',
    category: 'ad_network',
    description: 'High-definition video ads and performance mobile advertising SDK.',
    packagePatterns: ['com.vungle'],
    activityPatterns: ['com.vungle.warren.ui.VungleActivity'],
    servicePatterns: [],
    receiverPatterns: [],
    permissionPatterns: [],
    metadataPatterns: ['vungle.app.id'],
    layoutPatterns: ['com.vungle.warren.VungleBannerView']
  },
  {
    id: 'inmobi',
    name: 'InMobi Ads',
    vendor: 'InMobi Pte Ltd',
    category: 'ad_network',
    description: 'Global mobile advertising and contextual engagement platform.',
    packagePatterns: ['com.inmobi.ads'],
    activityPatterns: ['com.inmobi.ads.rendering.InMobiAdActivity'],
    servicePatterns: [],
    receiverPatterns: [],
    permissionPatterns: [],
    metadataPatterns: [],
    layoutPatterns: ['com.inmobi.ads.InMobiBanner']
  },
  {
    id: 'mintegral',
    name: 'Mintegral / Mobvista',
    vendor: 'Mobvista Co.',
    category: 'ad_network',
    description: 'Interactive playable ads and banner network SDK.',
    packagePatterns: ['com.mintegral', 'com.mbridge'],
    activityPatterns: ['com.mbridge.msdk.activity.MBCommonActivity'],
    servicePatterns: [],
    receiverPatterns: [],
    permissionPatterns: [],
    metadataPatterns: [],
    layoutPatterns: ['com.mbridge.msdk.out.MBBannerView']
  },
  {
    id: 'pangle',
    name: 'Pangle (ByteDance / TikTok Ads)',
    vendor: 'ByteDance Ltd',
    category: 'ad_network',
    description: 'Advertising network powering display and video monetization from ByteDance.',
    packagePatterns: ['com.bytedance.sdk.openadsdk'],
    activityPatterns: ['com.bytedance.sdk.openadsdk.activity.TTLandingPageActivity'],
    servicePatterns: [],
    receiverPatterns: [],
    permissionPatterns: [],
    metadataPatterns: [],
    layoutPatterns: []
  },
  {
    id: 'appsflyer_tracker',
    name: 'AppsFlyer Analytics & Attribution',
    vendor: 'AppsFlyer Ltd',
    category: 'analytics_tracker',
    description: 'Mobile attribution and tracking SDK linking installs to ad networks.',
    packagePatterns: ['com.appsflyer'],
    activityPatterns: [],
    servicePatterns: [],
    receiverPatterns: ['com.appsflyer.SingleInstallBroadcastReceiver'],
    permissionPatterns: [],
    metadataPatterns: ['appsflyer.key'],
    layoutPatterns: []
  },
  {
    id: 'adjust_tracker',
    name: 'Adjust Attribution Tracker',
    vendor: 'Adjust GmbH',
    category: 'analytics_tracker',
    description: 'User acquisition tracking and in-app event conversion monitor.',
    packagePatterns: ['com.adjust.sdk'],
    activityPatterns: [],
    servicePatterns: [],
    receiverPatterns: [],
    permissionPatterns: [],
    metadataPatterns: ['adjust.app.token'],
    layoutPatterns: []
  }
];

export async function scanApkForAds(): Promise<AdScanReport> {
  const summary = apkManager.getSummary();
  const manifest = summary.manifest;
  const allFiles = apkManager.getAllFiles();

  const detectedSdks: DetectedAdSdk[] = [];
  const adPermissions: string[] = [];
  const adActivities: string[] = [];
  const adServices: string[] = [];
  const adReceivers: string[] = [];
  const adMetadata: string[] = [];
  const adLayoutFiles: string[] = [];

  // 1. Check Permissions
  const adPermCandidates = [
    'com.google.android.gms.permission.AD_ID',
    'android.permission.ACCESS_AD_ID',
    'com.android.vending.BILLING'
  ];

  for (const perm of manifest.permissions) {
    if (adPermCandidates.includes(perm) || perm.toLowerCase().includes('ad_id') || perm.toLowerCase().includes('ads')) {
      if (!adPermissions.includes(perm)) adPermissions.push(perm);
    }
  }

  // 2. Read layout XML files
  const layoutFiles = allFiles.filter(f => f.path.startsWith('res/layout') && f.path.endsWith('.xml'));
  for (const file of layoutFiles.slice(0, 40)) {
    try {
      const content = await apkManager.getFileContent(file.path);
      if (content.text) {
        if (
          content.text.includes('com.google.android.gms.ads') ||
          content.text.includes('AdView') ||
          content.text.includes('BannerView') ||
          content.text.includes('ads:adSize') ||
          content.text.includes('ads:adUnitId')
        ) {
          adLayoutFiles.push(file.path);
        }
      }
    } catch {}
  }

  // 3. Match against known rules
  for (const rule of AD_NETWORK_RULES) {
    const matchedPerms: string[] = [];
    const matchedActs: string[] = [];
    const matchedSrvs: string[] = [];
    const matchedRecs: string[] = [];
    const matchedMeta: string[] = [];
    const matchedDex: string[] = [];
    const matchedLayout: string[] = [];

    // Match permissions
    for (const p of manifest.permissions) {
      if (rule.permissionPatterns.some(pattern => p.includes(pattern))) {
        matchedPerms.push(p);
      }
    }

    // Match activities
    for (const act of manifest.activities) {
      if (rule.activityPatterns.some(pattern => act.includes(pattern)) || rule.packagePatterns.some(pkg => act.startsWith(pkg))) {
        matchedActs.push(act);
        if (!adActivities.includes(act)) adActivities.push(act);
      }
    }

    // Match services
    for (const srv of manifest.services) {
      if (rule.servicePatterns.some(pattern => srv.includes(pattern)) || rule.packagePatterns.some(pkg => srv.startsWith(pkg))) {
        matchedSrvs.push(srv);
        if (!adServices.includes(srv)) adServices.push(srv);
      }
    }

    // Match receivers
    for (const rec of manifest.receivers) {
      if (rule.receiverPatterns.some(pattern => rec.includes(pattern)) || rule.packagePatterns.some(pkg => rec.startsWith(pkg))) {
        matchedRecs.push(rec);
        if (!adReceivers.includes(rec)) adReceivers.push(rec);
      }
    }

    // Match DEX classes
    for (const cls of summary.dexClasses) {
      if (rule.packagePatterns.some(pkg => cls.name.startsWith(pkg) || cls.package.startsWith(pkg))) {
        if (matchedDex.length < 5) {
          matchedDex.push(cls.name);
        }
      }
    }

    // Match layout files
    for (const layoutPath of adLayoutFiles) {
      matchedLayout.push(layoutPath);
    }

    const hasMatches =
      matchedPerms.length > 0 ||
      matchedActs.length > 0 ||
      matchedSrvs.length > 0 ||
      matchedRecs.length > 0 ||
      matchedDex.length > 0;

    if (hasMatches) {
      detectedSdks.push({
        id: rule.id,
        name: rule.name,
        vendor: rule.vendor,
        category: rule.category,
        confidence: matchedActs.length > 0 || matchedDex.length > 0 ? 'high' : 'medium',
        description: rule.description,
        permissions: matchedPerms,
        activities: matchedActs,
        services: matchedSrvs,
        receivers: matchedRecs,
        metadataKeys: matchedMeta,
        dexClassMatches: matchedDex,
        layoutMatches: matchedLayout,
        enabled: true
      });
    }
  }

  // If no specific SDK detected but user wants ad scan, ensure Google AdMob is provided if AD_ID permission is declared
  if (detectedSdks.length === 0 && adPermissions.length > 0) {
    detectedSdks.push({
      id: 'google_admob_id',
      name: 'Google Advertising ID Tracker',
      vendor: 'Google LLC',
      category: 'ad_network',
      confidence: 'medium',
      description: 'Advertising Identifier used for cross-app profiling and personalized ad delivery.',
      permissions: adPermissions,
      activities: [],
      services: [],
      receivers: [],
      metadataKeys: [],
      dexClassMatches: [],
      layoutMatches: [],
      enabled: true
    });
  }

  return {
    scannedAt: new Date(),
    totalAdNetworksFound: detectedSdks.length,
    totalAdComponentsFound: adPermissions.length + adActivities.length + adServices.length + adReceivers.length + adLayoutFiles.length,
    detectedSdks,
    hasAdIdPermission: adPermissions.includes('com.google.android.gms.permission.AD_ID') || adPermissions.includes('android.permission.ACCESS_AD_ID'),
    adPermissions,
    adActivities,
    adServices,
    adReceivers,
    adMetadata,
    adLayoutFiles
  };
}

export async function removeAdComponentsFromApk(options: {
  removeAdIdPermission: boolean;
  removeAdActivities: boolean;
  removeAdServices: boolean;
  cleanLayoutViews: boolean;
  selectedSdkIds: string[];
}): Promise<{ modifiedItems: string[]; newManifest: ApkManifestInfo }> {
  const summary = apkManager.getSummary();
  const manifest = { ...summary.manifest };
  const modifiedItems: string[] = [];

  // 1. Remove AD_ID and ad-related permissions
  if (options.removeAdIdPermission) {
    const toRemove = [
      'com.google.android.gms.permission.AD_ID',
      'android.permission.ACCESS_AD_ID'
    ];
    const initialCount = manifest.permissions.length;
    manifest.permissions = manifest.permissions.filter(p => !toRemove.includes(p));
    if (manifest.permissions.length < initialCount) {
      modifiedItems.push('Removed advertising identifier permission (AD_ID)');
    }
  }

  // 2. Remove Ad Activities
  if (options.removeAdActivities) {
    const isAdActivity = (act: string) => {
      const lower = act.toLowerCase();
      return (
        lower.includes('com.google.android.gms.ads') ||
        lower.includes('adactivity') ||
        lower.includes('unity3d.services.ads') ||
        lower.includes('applovin.adview') ||
        lower.includes('audiencenetworkactivity') ||
        lower.includes('vungleactivity') ||
        lower.includes('ironsource.sdk.controller')
      );
    };

    const initialActs = manifest.activities.length;
    manifest.activities = manifest.activities.filter(a => !isAdActivity(a));
    if (manifest.activities.length < initialActs) {
      modifiedItems.push(`Removed ${initialActs - manifest.activities.length} ad activity declarations from AndroidManifest.xml`);
    }
  }

  // 3. Remove Ad Services
  if (options.removeAdServices) {
    const isAdService = (srv: string) => {
      const lower = srv.toLowerCase();
      return lower.includes('.ads.') || lower.includes('adservice');
    };

    const initialSrvs = manifest.services.length;
    manifest.services = manifest.services.filter(s => !isAdService(s));
    if (manifest.services.length < initialSrvs) {
      modifiedItems.push(`Removed ${initialSrvs - manifest.services.length} ad services from AndroidManifest.xml`);
    }
  }

  // Update manifest inside apkManager
  apkManager.updateManifest(manifest);

  // 4. Clean layout XML files
  if (options.cleanLayoutViews) {
    const allFiles = apkManager.getAllFiles();
    const layoutFiles = allFiles.filter(f => f.path.startsWith('res/layout') && f.path.endsWith('.xml'));

    let cleanedLayoutsCount = 0;
    for (const file of layoutFiles) {
      try {
        const content = await apkManager.getFileContent(file.path);
        if (content.text) {
          if (
            content.text.includes('com.google.android.gms.ads.AdView') ||
            content.text.includes('com.google.android.gms.ads') ||
            content.text.includes('ads:adSize')
          ) {
            // Replace AdView tag with an empty View container with 0 height so it doesn't render banners
            const cleanedXml = content.text
              .replace(/<com\.google\.android\.gms\.ads\.AdView[^>]*?\/>/g, '<!-- AdView Removed -->')
              .replace(/<com\.google\.android\.gms\.ads\.AdView[\s\S]*?<\/com\.google\.android\.gms\.ads\.AdView>/g, '<!-- AdView Removed -->');

            if (cleanedXml !== content.text) {
              apkManager.updateFile(file.path, cleanedXml);
              cleanedLayoutsCount++;
            }
          }
        }
      } catch {}
    }

    if (cleanedLayoutsCount > 0) {
      modifiedItems.push(`Cleaned ${cleanedLayoutsCount} layout XML banner placeholders`);
    }
  }

  return { modifiedItems, newManifest: manifest };
}

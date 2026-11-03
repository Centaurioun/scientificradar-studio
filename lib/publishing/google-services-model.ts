/**
 * M4 — Google Service Configuration & Honest Integration Model
 * Strictly separates public client identifiers (e.g., GA4 Measurement ID) from
 * server-only credentials, documents `ads.txt` and consent prerequisites, and
 * never fabricates live traffic, indexing, or AdSense revenue metrics.
 */

export interface GoogleAnalytics4ConfigModel {
  serviceId: 'google_analytics_4';
  status: 'not_connected' | 'configured_pending_verification';
  publicMeasurementId?: string; // e.g., G-XXXXXXXXXX (safe for Web public env when authorized)
  serverApiSecretEnvVar: 'GA4_API_SECRET';
  consentModeV2Required: true;
  honestDisclosure: string;
}

export interface GoogleAdSenseConfigModel {
  serviceId: 'google_adsense';
  status: 'not_connected' | 'configured_pending_verification';
  publisherId?: string; // e.g., ca-pub-XXXXXXXXXXXXXXXX
  adsTxtStatus: 'not_deployed_in_studio' | 'verified_on_web_origin';
  clsReserveSlotHeightPx: number;
  prohibitedPlacements: readonly [
    'inside_equation_block',
    'between_figure_and_caption',
    'inside_citation_list',
    'above_article_h1',
  ];
  consentGateRequired: true;
  honestDisclosure: string;
}

export interface GoogleSearchConsoleConfigModel {
  serviceId: 'google_search_console';
  status: 'not_connected' | 'configured_pending_verification';
  propertyUrl: 'https://scientificradar.com';
  verificationTokenEnvVar: 'GOOGLE_SITE_VERIFICATION';
  serviceAccountKeyEnvVar: 'GSC_SERVICE_ACCOUNT_JSON';
  sitemapPath: '/sitemap.xml';
  honestDisclosure: string;
}

export interface StudioGoogleServicesReadinessSnapshot {
  ga4: GoogleAnalytics4ConfigModel;
  adSense: GoogleAdSenseConfigModel;
  searchConsole: GoogleSearchConsoleConfigModel;
}

export function getDefaultGoogleServicesReadinessSnapshot(): StudioGoogleServicesReadinessSnapshot {
  return {
    ga4: {
      serviceId: 'google_analytics_4',
      status: 'not_connected',
      serverApiSecretEnvVar: 'GA4_API_SECRET',
      consentModeV2Required: true,
      honestDisclosure:
        'GA4 is not connected in this isolated Studio prototype. No analytics scripts are injected and no reader telemetry is fabricated.',
    },
    adSense: {
      serviceId: 'google_adsense',
      status: 'not_connected',
      adsTxtStatus: 'not_deployed_in_studio',
      clsReserveSlotHeightPx: 250,
      prohibitedPlacements: [
        'inside_equation_block',
        'between_figure_and_caption',
        'inside_citation_list',
        'above_article_h1',
      ],
      consentGateRequired: true,
      honestDisclosure:
        'Google AdSense is not connected. Studio never renders live ad units inside the editorial workspace or reader preview.',
    },
    searchConsole: {
      serviceId: 'google_search_console',
      status: 'not_connected',
      propertyUrl: 'https://scientificradar.com',
      verificationTokenEnvVar: 'GOOGLE_SITE_VERIFICATION',
      serviceAccountKeyEnvVar: 'GSC_SERVICE_ACCOUNT_JSON',
      sitemapPath: '/sitemap.xml',
      honestDisclosure:
        'Google Search Console API is not connected. Local SEO checks validate snapshot structure only and never claim live Google indexing.',
    },
  };
}

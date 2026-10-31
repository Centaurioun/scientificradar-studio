import {
  Article,
  ArticleRevision,
  AuditEvent,
  AuthorProfile,
  Category,
  EditorialPage,
  HomepageBlock,
  IntegrationConnection,
  KnowledgeLink,
  MediaAsset,
  MenuConfig,
  ScientificSource,
  Series,
  Tag,
} from './types';

function makeSvgDataUri(svgContent: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent.trim())}`;
}

export const SEED_CATEGORIES: Category[] = [
  // 7 Top-level categories
  { id: 'cat-space', name: 'Space', slug: 'space', locale: 'en', description: 'Orbital observatories, exoplanets, stellar evolution, and cosmic structure.' },
  { id: 'cat-earth', name: 'Earth', slug: 'earth', locale: 'en', description: 'Paleoclimate, ocean circulation, plate tectonics, and biosphere dynamics.' },
  { id: 'cat-life', name: 'Life', slug: 'life', locale: 'en', description: 'Genomics, cellular machinery, evolutionary biology, and neural circuits.' },
  { id: 'cat-humans', name: 'Humans', slug: 'humans', locale: 'en', description: 'Translational medicine, cognitive science, epidemiology, and anthropology.' },
  { id: 'cat-physics', name: 'Physics', slug: 'physics', locale: 'en', description: 'Quantum information, high-energy colliders, condensed matter, and optics.' },
  { id: 'cat-chemistry', name: 'Chemistry & Materials', slug: 'chemistry-materials', locale: 'en', description: 'Catalysis, solid-state electrolytes, supramolecular assembly, and polymers.' },
  { id: 'cat-technology', name: 'Technology', slug: 'technology', locale: 'en', description: 'Computational hardware, grid storage, fusion engineering, and scientific computing.' },

  // 25 Subcategories per Section 8 of Master Spec
  { id: 'sub-astronomy', name: 'Astronomy', slug: 'astronomy', parentId: 'cat-space', locale: 'en' },
  { id: 'sub-astrophysics', name: 'Astrophysics', slug: 'astrophysics', parentId: 'cat-space', locale: 'en' },
  { id: 'sub-cosmology', name: 'Cosmology', slug: 'cosmology', parentId: 'cat-space', locale: 'en' },
  { id: 'sub-planetary', name: 'Planetary Science', slug: 'planetary-science', parentId: 'cat-space', locale: 'en' },

  { id: 'sub-climate', name: 'Climate', slug: 'climate', parentId: 'cat-earth', locale: 'en' },
  { id: 'sub-geology', name: 'Geology', slug: 'geology', parentId: 'cat-earth', locale: 'en' },
  { id: 'sub-oceans', name: 'Oceans', slug: 'oceans', parentId: 'cat-earth', locale: 'en' },
  { id: 'sub-environment', name: 'Environment', slug: 'environment', parentId: 'cat-earth', locale: 'en' },

  { id: 'sub-biology', name: 'Biology', slug: 'biology', parentId: 'cat-life', locale: 'en' },
  { id: 'sub-genetics', name: 'Genetics', slug: 'genetics', parentId: 'cat-life', locale: 'en' },
  { id: 'sub-ecology', name: 'Ecology', slug: 'ecology', parentId: 'cat-life', locale: 'en' },
  { id: 'sub-neuroscience', name: 'Neuroscience', slug: 'neuroscience', parentId: 'cat-life', locale: 'en' },

  { id: 'sub-medicine', name: 'Medicine', slug: 'medicine', parentId: 'cat-humans', locale: 'en' },
  { id: 'sub-psychology', name: 'Psychology', slug: 'psychology', parentId: 'cat-humans', locale: 'en' },
  { id: 'sub-anthropology', name: 'Anthropology', slug: 'anthropology', parentId: 'cat-humans', locale: 'en' },
  { id: 'sub-public-health', name: 'Public Health', slug: 'public-health', parentId: 'cat-humans', locale: 'en' },

  { id: 'sub-quantum', name: 'Quantum Physics', slug: 'quantum-physics', parentId: 'cat-physics', locale: 'en' },
  { id: 'sub-particle', name: 'Particle Physics', slug: 'particle-physics', parentId: 'cat-physics', locale: 'en' },
  { id: 'sub-classical', name: 'Classical Physics', slug: 'classical-physics', parentId: 'cat-physics', locale: 'en' },

  { id: 'sub-chemistry', name: 'Chemistry', slug: 'chemistry', parentId: 'cat-chemistry', locale: 'en' },
  { id: 'sub-biochemistry', name: 'Biochemistry', slug: 'biochemistry', parentId: 'cat-chemistry', locale: 'en' },
  { id: 'sub-materials', name: 'Materials Science', slug: 'materials-science', parentId: 'cat-chemistry', locale: 'en' },

  { id: 'sub-ai', name: 'Artificial Intelligence', slug: 'artificial-intelligence', parentId: 'cat-technology', locale: 'en' },
  { id: 'sub-engineering', name: 'Engineering', slug: 'engineering', parentId: 'cat-technology', locale: 'en' },
  { id: 'sub-energy', name: 'Energy', slug: 'energy', parentId: 'cat-technology', locale: 'en' },
];

export const SEED_TAGS: Tag[] = [
  { id: 'tag-quantum-entanglement', name: 'Quantum Entanglement', slug: 'quantum-entanglement', aliases: ['Entanglement', 'Bell State'] },
  { id: 'tag-jwst', name: 'James Webb Space Telescope', slug: 'james-webb-space-telescope', aliases: ['JWST', 'Webb'] },
  { id: 'tag-crispr', name: 'CRISPR-Cas9', slug: 'crispr-cas9', aliases: ['Prime Editing', 'Gene Editing'] },
  { id: 'tag-amoc', name: 'Thermohaline Circulation', slug: 'thermohaline-circulation', aliases: ['AMOC', 'Ocean Currents'] },
  { id: 'tag-solid-state-battery', name: 'Solid-State Electrolytes', slug: 'solid-state-electrolytes', aliases: ['Lithium Metal Anode'] },
  { id: 'tag-spectroscopy', name: 'Transmission Spectroscopy', slug: 'transmission-spectroscopy' },
  { id: 'tag-connectomics', name: 'Synaptic Connectomics', slug: 'synaptic-connectomics' },
  { id: 'tag-tokamak', name: 'Magnetic Confinement Fusion', slug: 'magnetic-confinement-fusion', aliases: ['Tokamak', 'HTS Magnets'] },
  { id: 'tag-paleogenomics', name: 'Ancient DNA', slug: 'ancient-dna', aliases: ['Paleogenomics'] },
  { id: 'tag-mrna', name: 'mRNA Therapeutics', slug: 'mrna-therapeutics' },
];

export const SEED_AUTHORS: AuthorProfile[] = [
  {
    id: 'auth-elena',
    displayName: 'Dr. Elena Rostova',
    slug: 'elena-rostova',
    biography: 'Senior Physics & Space Editor at ScientificRadar Studio. Covers optical quantum networks, interferometry, and exoplanet spectroscopy.',
    expertise: ['Quantum Optics', 'Astrophysics', 'Spectroscopy'],
    affiliation: 'ScientificRadar Editorial Board (Demo Profile)',
    orcid: '0000-0002-1825-0097',
    locale: 'en',
    role: 'editor',
  },
  {
    id: 'auth-kerem',
    displayName: 'Dr. Kerem Aydın',
    slug: 'kerem-aydin',
    biography: 'Molecular geneticist and bilingual science contributor focusing on genome editing fidelity, chromatin architecture, and RNA delivery.',
    expertise: ['Genetics', 'Biochemistry', 'Molecular Biology'],
    affiliation: 'Contributing Science Writer (Demo Profile)',
    orcid: '0000-0003-4412-8910',
    locale: 'tr',
    role: 'author',
  },
  {
    id: 'auth-claire',
    displayName: 'Claire Vance, MSc',
    slug: 'claire-vance',
    biography: 'Earth systems journalist covering oceanography, paleoclimate proxies, and polar ice-sheet mass balance.',
    expertise: ['Paleoclimate', 'Oceanography', 'Glaciology'],
    affiliation: 'ScientificRadar Staff Writer (Demo Profile)',
    locale: 'en',
    role: 'author',
  },
  {
    id: 'auth-marcus',
    displayName: 'Prof. Marcus Thorne',
    slug: 'marcus-thorne',
    biography: 'Editorial Reviewer for condensed matter physics, solid-state electrochemistry, and high-field superconducting magnets.',
    expertise: ['Materials Science', 'Electrochemistry', 'Superconductivity'],
    affiliation: 'Editorial Review Panel (Demo Profile)',
    locale: 'en',
    role: 'reviewer',
  },
];

export const SEED_MEDIA: MediaAsset[] = [
  {
    id: 'media-jwst-spectrum',
    filename: 'k2-18b-transmission-spectrum-nirspec.svg',
    title: 'NIRSpec Transmission Spectrum of Sub-Neptune Exoplanet Atmosphere',
    kind: 'scientific_figure',
    src: makeSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 420" width="800" height="420">
        <rect width="800" height="420" fill="#0d1821"/>
        <g stroke="#1e3240" stroke-width="1">
          <line x1="80" y1="60" x2="750" y2="60"/>
          <line x1="80" y1="140" x2="750" y2="140"/>
          <line x1="80" y1="220" x2="750" y2="220"/>
          <line x1="80" y1="300" x2="750" y2="300"/>
          <line x1="80" y1="350" x2="750" y2="350"/>
          <line x1="80" y1="40" x2="80" y2="350"/>
        </g>
        <polyline fill="none" stroke="#14b8a6" stroke-width="2.5" points="90,260 140,245 190,150 230,255 280,270 330,130 380,240 430,265 490,175 550,115 610,235 670,250 730,220"/>
        <g fill="#f59e0b">
          <circle cx="190" cy="150" r="5"/><circle cx="330" cy="130" r="5"/><circle cx="550" cy="115" r="5"/>
        </g>
        <text x="85" y="35" fill="#e2e8f0" font-family="monospace" font-size="13" font-weight="bold">FIG 1. TRANSMISSION SPECTROSCOPY (1.0 - 5.2 μm) — CH4 &amp; CO2 ABSORPTION FEATURES</text>
        <text x="165" y="135" fill="#99f6e4" font-family="monospace" font-size="11">CH4 (1.4 μm)</text>
        <text x="305" y="115" fill="#99f6e4" font-family="monospace" font-size="11">CH4 (2.3 μm)</text>
        <text x="520" y="100" fill="#fbbf24" font-family="monospace" font-size="11">CO2 (4.3 μm, 4.8σ)</text>
        <text x="360" y="390" fill="#94a3b8" font-family="monospace" font-size="12">Wavelength λ (micrometers)</text>
        <text x="20" y="210" fill="#94a3b8" font-family="monospace" font-size="11" transform="rotate(-90 25,210)">Transit Depth (ppm)</text>
      </svg>
    `),
    mime: 'image/svg+xml',
    width: 1200,
    height: 630,
    byteSize: 42800,
    altText: 'Transmission spectrum graph plotting transit depth in parts per million against wavelength from 1.0 to 5.2 micrometers, highlighting methane peaks at 1.4 and 2.3 micrometers and carbon dioxide absorption at 4.3 micrometers.',
    caption: 'Fig. 1: Near-infrared transmission spectrum showing distinct methane (CH4) and carbon dioxide (CO2) absorption bands with 4.8σ model preference.',
    credit: 'ScientificRadar Data Visualization / Demo Illustration',
    licence: 'CC BY 4.0',
    layout: 'locked',
    createdAt: '2026-10-18T09:30:00Z',
  },
  {
    id: 'media-quantum-fiber',
    filename: 'quantum-repeater-node-diagram.svg',
    title: 'Entanglement Swapping Across Metropolitan Telecom Fiber Loop',
    kind: 'diagram',
    src: makeSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
        <rect width="800" height="400" fill="#f8fafc"/>
        <rect x="40" y="40" width="720" height="320" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
        <line x1="160" y1="200" x2="400" y2="200" stroke="#087f83" stroke-width="4" stroke-dasharray="8 4"/>
        <line x1="400" y1="200" x2="640" y2="200" stroke="#087f83" stroke-width="4" stroke-dasharray="8 4"/>
        <circle cx="160" cy="200" r="46" fill="#e6f4f4" stroke="#087f83" stroke-width="2.5"/>
        <circle cx="400" cy="200" r="54" fill="#fef3c7" stroke="#d97706" stroke-width="2.5"/>
        <circle cx="640" cy="200" r="46" fill="#e6f4f4" stroke="#087f83" stroke-width="2.5"/>
        <text x="160" y="196" text-anchor="middle" fill="#0f172a" font-family="sans-serif" font-size="13" font-weight="bold">Node A</text>
        <text x="160" y="214" text-anchor="middle" fill="#475569" font-family="monospace" font-size="10">Rb-87 Memory</text>
        <text x="400" y="196" text-anchor="middle" fill="#0f172a" font-family="sans-serif" font-size="13" font-weight="bold">Bell-State</text>
        <text x="400" y="214" text-anchor="middle" fill="#92400e" font-family="monospace" font-size="10">Heralded BSM</text>
        <text x="640" y="196" text-anchor="middle" fill="#0f172a" font-family="sans-serif" font-size="13" font-weight="bold">Node B</text>
        <text x="640" y="214" text-anchor="middle" fill="#475569" font-family="monospace" font-size="10">1550 nm QFC</text>
        <text x="400" y="85" text-anchor="middle" fill="#1e293b" font-family="monospace" font-size="13" font-weight="bold">TELECOM L-BAND ENTANGLEMENT DISTRIBUTION (78 KM DEPLOYED FIBER)</text>
      </svg>
    `),
    mime: 'image/svg+xml',
    width: 1200,
    height: 600,
    byteSize: 31500,
    altText: 'Schematic diagram showing Node A Rubidium-87 quantum memory connected via telecom fiber to a central heralded Bell-State Measurement station and Node B with 1550nm quantum frequency conversion.',
    caption: 'Fig. 2: Heralded entanglement swapping architecture between neutral-atom memories over 78 km of commercial underground fiber.',
    credit: 'ScientificRadar Studio Technical Graphics',
    licence: 'CC BY 4.0',
    layout: 'auto',
    createdAt: '2026-10-21T14:15:00Z',
  },
  {
    id: 'media-amoc-chart',
    filename: 'amoc-sv-transport-26n-array.svg',
    title: 'Atlantic Meridional Overturning Transport Anomaly at 26.5°N',
    kind: 'chart',
    src: makeSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
        <rect width="800" height="400" fill="#0f172a"/>
        <line x1="70" y1="200" x2="740" y2="200" stroke="#475569" stroke-dasharray="4 4"/>
        <polyline fill="none" stroke="#38bdf8" stroke-width="3" points="80,150 150,165 220,145 290,185 360,210 430,195 500,230 570,245 640,235 720,260"/>
        <text x="80" y="50" fill="#f8fafc" font-family="monospace" font-size="14" font-weight="bold">RAPID-MOCHA 26.5°N VOLUME TRANSPORT (SVERDRUPS, 1 Sv = 10⁶ m³/s)</text>
        <text x="80" y="365" fill="#94a3b8" font-family="monospace" font-size="12">Observation Window (2004 – 2026 Multi-Mooring Reconstruction)</text>
      </svg>
    `),
    mime: 'image/svg+xml',
    width: 1200,
    height: 600,
    byteSize: 28900,
    altText: '', // Intentionally empty in seed to demonstrate "Requires Attention" & Local Check detection (AT-20)
    caption: 'Multi-decadal overturning volume transport measured in Sverdrups across the 26.5°N trans-basin mooring array.',
    credit: 'Oceanographic Telemetry Synthesis (Demo Asset)',
    licence: 'CC BY 4.0',
    layout: 'locked',
    createdAt: '2026-10-24T11:00:00Z',
  },
  {
    id: 'media-crispr-photo',
    filename: 'prime-editor-ribonucleoprotein-complex.svg',
    title: 'Cryo-EM Surface Render of Prime Editing Ribonucleoprotein Complex',
    kind: 'photograph',
    src: makeSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
        <defs>
          <radialGradient id="g1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#0d9488"/>
            <stop offset="100%" stop-color="#111827"/>
          </radialGradient>
        </defs>
        <rect width="800" height="450" fill="url(#g1)"/>
        <circle cx="350" cy="225" r="110" fill="#14b8a6" fill-opacity="0.35" stroke="#5eead4" stroke-width="2"/>
        <circle cx="460" cy="215" r="85" fill="#f59e0b" fill-opacity="0.3" stroke="#fcd34d" stroke-width="2"/>
        <text x="60" y="60" fill="#f8fafc" font-family="monospace" font-size="13">CRYO-EM DENSITY MAP · 2.8 Å RESOLUTION · PE2-pegRNA</text>
      </svg>
    `),
    mime: 'image/svg+xml',
    width: 1600,
    height: 900,
    byteSize: 54200,
    altText: 'Molecular surface rendering showing Cas9 nickase domain bound to engineered reverse transcriptase and pegRNA target strand at 2.8 Angstrom resolution.',
    caption: 'Structural model of the prime editing ribonucleoprotein complex engaging target double-stranded DNA.',
    credit: 'Structural Biology Archive (Demo Asset)',
    licence: 'CC BY-SA 4.0',
    focalPoint: { x: 0.48, y: 0.5 },
    layout: 'auto',
    createdAt: '2026-10-25T16:40:00Z',
  },
];

export const SEED_SOURCES: ScientificSource[] = [
  {
    id: 'src-jwst-1',
    title: 'Carbon-bearing molecules in a possible hycean atmosphere',
    authors: 'Madhusudhan, N., Sarkar, S., Constantinou, S. et al.',
    journal: 'The Astrophysical Journal Letters',
    year: 2025,
    doi: '10.3847/2041-8213/acf577',
    url: 'https://doi.org/10.3847/2041-8213/acf577',
    sourceType: 'peer_reviewed',
    accessDate: '2026-10-20',
    verificationStatus: 'unverified',
    linkedClaim: 'Detection of methane and carbon dioxide absorption features between 1.0 and 5.2 micrometers.',
    notes: 'Local DOI syntax valid; external Crossref check not run in offline prototype.',
  },
  {
    id: 'src-quantum-1',
    title: 'Heralded entanglement between atomic ensembles over metropolitan fiber',
    authors: 'Rostova, E., Lindqvist, H., & Sato, K.',
    journal: 'Nature Photonics',
    year: 2026,
    doi: '10.1038/s41566-026-01402-z',
    url: 'https://www.nature.com/articles/s41566-026-01402-z',
    sourceType: 'peer_reviewed',
    accessDate: '2026-10-26',
    verificationStatus: 'unverified',
    linkedClaim: 'Bell-state fidelity of 86.4 ± 1.2% maintained across 78 km of commercial underground fiber.',
  },
  {
    id: 'src-crispr-1',
    title: 'Genome-wide quantification of prime editing off-target indels in primary human hepatocytes',
    authors: 'Aydın, K., Chen, W., & Alvarez, M.',
    journal: 'Nature Biotechnology',
    year: 2026,
    doi: '10.1038/s41587-026-02119-4',
    url: 'https://www.nature.com/articles/s41587-026-02119-4',
    sourceType: 'peer_reviewed',
    accessDate: '2026-10-28',
    verificationStatus: 'unverified',
    linkedClaim: 'Engineered epegRNA scaffolds reduced unintended nickase-induced indels below 0.08%.',
  },
  {
    id: 'src-amoc-1',
    title: 'Freshwater flux anomalies and subtropical overturning variability at 26.5°N',
    authors: 'Vance, C., Bryden, H., & Cunningham, S.',
    journal: 'Journal of Physical Oceanography',
    year: 2026,
    doi: 'invalid-doi-format-demo',
    url: 'https://journals.ametsoc.org/view/journals/phoc/amoc-2026.xml',
    sourceType: 'peer_reviewed',
    accessDate: '2026-10-29',
    verificationStatus: 'needs_review',
    linkedClaim: 'Deep western boundary current abyssal southward transport decreased by 1.8 Sv over two decades.',
    notes: 'DOI syntax flagged by local check for editorial review.',
  },
];

export const SEED_KNOWLEDGE_LINKS: KnowledgeLink[] = [
  {
    id: 'kl-quantum-entanglement',
    term: 'quantum entanglement',
    targetType: 'wikipedia',
    targetUrl: 'https://en.wikipedia.org/wiki/Quantum_entanglement',
    locale: 'en',
    previewTitle: 'Quantum entanglement',
    previewExcerpt:
      'Quantum entanglement is a physical phenomenon that occurs when a group of particles are generated, interact, or share spatial proximity in a way such that the quantum state of each particle cannot be described independently of the state of the others, even when separated by a large distance.',
    sourceAttribution: 'Wikipedia · CC BY-SA 4.0 (Demo preview sample)',
    reviewStatus: 'approved',
    isSampleDemoData: true,
  },
  {
    id: 'kl-transmission-spectroscopy',
    term: 'transmission spectroscopy',
    targetType: 'internal',
    targetUrl: '/preview/articles/art-jwst-hycean-spectra',
    targetArticleId: 'art-jwst-hycean-spectra',
    locale: 'en',
    previewTitle: 'JWST Mid-Infrared Spectroscopy Constrains Methane-to-CO2 Ratios in Sub-Neptune Atmospheres',
    previewExcerpt:
      'Internal ScientificRadar Reference: How starlight filtering through an exoplanet limb during transit reveals molecular absorption signatures of CH4, CO2, and H2O.',
    sourceAttribution: 'ScientificRadar Internal Knowledge Graph (Preferred over external link)',
    reviewStatus: 'approved',
    isSampleDemoData: true,
  },
  {
    id: 'kl-thermohaline-circulation',
    term: 'thermohaline circulation',
    targetType: 'wikipedia',
    targetUrl: 'https://en.wikipedia.org/wiki/Thermohaline_circulation',
    locale: 'en',
    previewTitle: 'Thermohaline circulation',
    previewExcerpt:
      'Thermohaline circulation is a part of the large-scale ocean circulation that is driven by global density gradients created by surface heat and freshwater fluxes.',
    sourceAttribution: 'Wikipedia · CC BY-SA 4.0 (Demo preview sample)',
    reviewStatus: 'approved',
    isSampleDemoData: true,
  },
  {
    id: 'kl-prime-editing',
    term: 'prime editing',
    targetType: 'wikipedia',
    targetUrl: 'https://en.wikipedia.org/wiki/Prime_editing',
    locale: 'en',
    previewTitle: 'Prime editing',
    previewExcerpt:
      'Prime editing is a "search-and-replace" genome editing technology in molecular biology by which the genome of living organisms may be modified without double-stranded DNA breaks or donor DNA templates.',
    sourceAttribution: 'Wikipedia · CC BY-SA 4.0 (Demo preview sample)',
    reviewStatus: 'approved',
    isSampleDemoData: true,
  },
];

export const SEED_ARTICLES: Article[] = [
  {
    id: 'art-quantum-repeater',
    locale: 'en',
    title: 'Heralded Quantum Entanglement Sustained Across 78 Kilometers of Deployed Metropolitan Fiber',
    slug: 'heralded-quantum-entanglement-78km-metropolitan-fiber',
    summary:
      'Using telecom L-band quantum frequency conversion and sub-kilohertz cavity-locked lasers, researchers demonstrated continuous heralded entanglement between neutral rubidium-87 ensembles across commercial city fiber.',
    body: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Distributing coherent quantum states across existing metropolitan telecommunications infrastructure remains a central engineering threshold for long-baseline interferometry and distributed cryptography. In a field trial spanning 78 kilometers of underground municipal optical fiber, experimental physicists achieved heralded ',
            },
            {
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Quantum_entanglement',
                    target: '_blank',
                  },
                },
              ],
              text: 'quantum entanglement',
            },
            {
              type: 'text',
              text: ' between two spatially separated rubidium-87 atomic ensemble memories with a state fidelity of 86.4 ± 1.2%.',
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Overcoming Telecom Attenuation with Frequency Conversion' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Atomic memories typically emit single photons at near-infrared transitions around 780 nanometers, where standard silica fiber exhibits steep attenuation exceeding 3.5 dB/km. By coupling each rubidium trap to a period-poled lithium niobate waveguide, the team converted emitted 780 nm photons to the 1550 nm telecommunications L-band with 54% internal efficiency.',
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text: 'Active Phase Stabilization Across Urban Thermal Drift' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Because single-photon interference requires path-length stability below a fraction of an optical wavelength, mechanical vibrations from nearby subway tunnels and diurnal temperature swings were actively compensated using multiplexed reference pulses interleaved every 400 microseconds.',
            },
          ],
        },
        {
          type: 'blockquote',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: '“Achieving sub-radian phase stability over 78 kilometers of unshielded urban conduit proves that quantum repeater nodes can coexist with classical metro fiber networks.” — Dr. Elena Rostova, Lead Investigator',
                },
              ],
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Implications for Multi-Node Quantum Repeaters' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Unlike trusted-node key distribution, heralded Bell-state measurements establish end-to-end non-local correlations without exposing intermediate photonic states. Similar high-precision photonic phase calibration techniques also underpin spaceborne ',
            },
            {
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: '/preview/articles/art-jwst-hycean-spectra',
                    target: '_self',
                  },
                },
              ],
              text: 'transmission spectroscopy',
            },
            {
              type: 'text',
              text: ' instruments.',
            },
          ],
        },
      ],
    },
    bodyHtml: `<p>Distributing coherent quantum states across existing telecommunications infrastructure remains a central engineering threshold for long-baseline interferometry and distributed cryptography. In a field trial spanning 78 kilometers of underground municipal optical fiber, experimental physicists achieved heralded <a href="https://en.wikipedia.org/wiki/Quantum_entanglement" data-knowledge-term="quantum entanglement" target="_blank" rel="noopener noreferrer">quantum entanglement</a> between two spatially separated rubidium-87 atomic ensemble memories with a state fidelity of 86.4 ± 1.2%.</p><h2>Overcoming Telecom Attenuation with Frequency Conversion</h2><p>Atomic memories typically emit single photons at near-infrared transitions around 780 nanometers, where standard silica fiber exhibits steep attenuation exceeding 3.5 dB/km. By coupling each rubidium trap to a period-poled lithium niobate waveguide, the team converted emitted 780 nm photons to the 1550 nm telecommunications L-band with 54% internal efficiency.</p><h3>Active Phase Stabilization Across Urban Thermal Drift</h3><p>Because single-photon interference requires path-length stability below a fraction of an optical wavelength, mechanical vibrations from nearby subway tunnels and diurnal temperature swings were actively compensated using multiplexed reference pulses interleaved every 400 microseconds.</p><blockquote><p>“Achieving sub-radian phase stability over 78 kilometers of unshielded urban conduit proves that quantum repeater nodes can coexist with classical metro fiber networks.” — Dr. Elena Rostova, Lead Investigator</p></blockquote><h2>Implications for Multi-Node Quantum Repeaters</h2><p>Unlike trusted-node key distribution, heralded Bell-state measurements establish end-to-end non-local correlations without exposing intermediate photonic states. Similar high-precision photonic phase calibration techniques also underpin spaceborne <a href="/preview/articles/art-jwst-hycean-spectra" data-knowledge-term="transmission spectroscopy">transmission spectroscopy</a> instruments.</p>`,
    status: 'published',
    primaryCategoryId: 'cat-physics',
    categoryIds: ['cat-physics', 'sub-quantum'],
    tagIds: ['tag-quantum-entanglement', 'tag-spectroscopy'],
    seriesId: 'ser-quantum-networks',
    authorId: 'auth-elena',
    sourceIds: ['src-quantum-1'],
    featuredMediaId: 'media-quantum-fiber',
    seo: {
      title: 'Heralded Quantum Entanglement Across 78 km Metro Fiber | ScientificRadar',
      description: 'Experimental physicists demonstrate 86.4% Bell-state fidelity between rubidium-87 quantum memories across 78 km of deployed urban telecom fiber.',
      noindex: true,
    },
    publishedAt: '2026-10-28T14:00:00Z',
    createdAt: '2026-10-22T10:00:00Z',
    updatedAt: '2026-10-28T14:00:00Z',
    version: 3,
    reviewNotes: [
      {
        id: 'rn-1',
        articleId: 'art-quantum-repeater',
        authorName: 'Prof. Marcus Thorne',
        role: 'reviewer',
        note: 'Verified error bars on Bell-state fidelity (86.4 ± 1.2%) match Table 2 of the Nature Photonics manuscript. Approved for demo publication.',
        action: 'approve',
        createdAt: '2026-10-28T11:20:00Z',
        resolved: true,
      },
    ],
  },
  {
    id: 'art-jwst-hycean-spectra',
    locale: 'en',
    title: 'JWST Mid-Infrared Spectroscopy Constrains Methane-to-CO2 Ratios in Sub-Neptune Atmospheres',
    slug: 'jwst-mid-infrared-spectroscopy-sub-neptune-atmospheres',
    summary:
      'Combined NIRSpec and MIRI transit observations resolve overlapping vibrational bands at 1.4, 2.3, and 4.3 micrometers, ruling out cloud-free solar-metallicity envelopes.',
    body: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Using cycle-3 observations from the James Webb Space Telescope, astronomers have obtained high-precision ',
            },
            {
              type: 'text',
              marks: [{ type: 'link', attrs: { href: '/preview/articles/art-jwst-hycean-spectra' } }],
              text: 'transmission spectroscopy',
            },
            {
              type: 'text',
              text: ' across 1.0 to 5.2 micrometers for three temperate sub-Neptune exoplanets orbiting M-dwarf hosts.',
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Disentangling Methane and Carbon Dioxide Bands' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Previous Hubble Wide Field Camera 3 spectra at 1.4 micrometers suffered from a well-known degeneracy between water vapor (H2O) and methane (CH4). Extending coverage through 5 micrometers resolves the strong fundamental stretching mode of carbon dioxide at 4.3 micrometers with 4.8-sigma confidence.',
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text: 'PhotochemicalDisequilibrium vs Deep Tropospheric Mixing' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'The observed depletion of ammonia (NH3) relative to methane and carbon dioxide provides an empirical constraint on vertical eddy diffusion rates and potential bottom-boundary interactions.',
            },
          ],
        },
      ],
    },
    bodyHtml: `<p>Using cycle-3 observations from the James Webb Space Telescope, astronomers have obtained high-precision <a href="/preview/articles/art-jwst-hycean-spectra" data-knowledge-term="transmission spectroscopy">transmission spectroscopy</a> across 1.0 to 5.2 micrometers for three temperate sub-Neptune exoplanets orbiting M-dwarf hosts.</p><h2>Disentangling Methane and Carbon Dioxide Bands</h2><p>Previous Hubble Wide Field Camera 3 spectra at 1.4 micrometers suffered from a well-known degeneracy between water vapor (H2O) and methane (CH4). Extending coverage through 5 micrometers resolves the strong fundamental stretching mode of carbon dioxide at 4.3 micrometers with 4.8-sigma confidence.</p><h3>Photochemical Disequilibrium vs Deep Tropospheric Mixing</h3><p>The observed depletion of ammonia (NH3) relative to methane and carbon dioxide provides an empirical constraint on vertical eddy diffusion rates and potential bottom-boundary interactions.</p>`,
    status: 'published',
    primaryCategoryId: 'cat-space',
    categoryIds: ['cat-space', 'sub-astrophysics', 'sub-planetary'],
    tagIds: ['tag-jwst', 'tag-spectroscopy'],
    authorId: 'auth-elena',
    sourceIds: ['src-jwst-1'],
    featuredMediaId: 'media-jwst-spectrum',
    seo: {
      title: 'JWST Mid-Infrared Sub-Neptune Spectroscopy | ScientificRadar',
      description: 'Combined NIRSpec and MIRI transit observations resolve methane and CO2 absorption bands in temperate sub-Neptune exoplanets.',
      noindex: true,
    },
    publishedAt: '2026-10-25T09:00:00Z',
    createdAt: '2026-10-19T12:00:00Z',
    updatedAt: '2026-10-25T09:00:00Z',
    version: 2,
  },
  {
    id: 'art-crispr-prime-editing',
    locale: 'en',
    title: 'Structured pegRNA Scaffolds Suppress Off-Target Indels in Primary Hepatocyte Prime Editing',
    slug: 'structured-pegrna-scaffolds-prime-editing-hepatocytes',
    summary:
      'Incorporating a pseudoknot motif at the 3-prime terminus shields reverse-transcription templates from exonuclease degradation while maintaining >68% on-target correction.',
    body: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Clinical translation of ',
            },
            {
              type: 'text',
              marks: [{ type: 'link', attrs: { href: 'https://en.wikipedia.org/wiki/Prime_editing', target: '_blank' } }],
              text: 'prime editing',
            },
            {
              type: 'text',
              text: ' requires both high on-target installation efficiency and stringent suppression of unintended insertions or deletions at the nicking site. In primary human hepatocytes, newly characterized ribonucleoprotein complexes paired with pseudoknot-stabilized pegRNAs reduced off-target indels below 0.08% across 14,000 assayed genomic loci.',
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Protecting the 3-Prime Primer Binding Site' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Unmodified prime editing guide RNAs are vulnerable to 3-prime truncation by cytosolic exonucleases, producing catalytically active Cas9 nickases that lack a reverse transcription template.',
            },
          ],
        },
      ],
    },
    bodyHtml: `<p>Clinical translation of <a href="https://en.wikipedia.org/wiki/Prime_editing" data-knowledge-term="prime editing" target="_blank" rel="noopener noreferrer">prime editing</a> requires both high on-target installation efficiency and stringent suppression of unintended insertions or deletions at the nicking site. In primary human hepatocytes, newly characterized ribonucleoprotein complexes paired with pseudoknot-stabilized pegRNAs reduced off-target indels below 0.08% across 14,000 assayed genomic loci.</p><h2>Protecting the 3-Prime Primer Binding Site</h2><p>Unmodified prime editing guide RNAs are vulnerable to 3-prime truncation by cytosolic exonucleases, producing catalytically active Cas9 nickases that lack a reverse transcription template.</p>`,
    status: 'in_review',
    primaryCategoryId: 'cat-life',
    categoryIds: ['cat-life', 'sub-genetics', 'cat-humans', 'sub-medicine'],
    tagIds: ['tag-crispr', 'tag-mrna'],
    authorId: 'auth-kerem',
    sourceIds: ['src-crispr-1'],
    featuredMediaId: 'media-crispr-photo',
    seo: {
      title: 'Structured pegRNA Scaffolds in Hepatocyte Prime Editing | ScientificRadar',
      description: 'Pseudoknot-stabilized pegRNAs reduce off-target indels below 0.08% in primary human hepatocyte prime editing assays.',
      noindex: true,
    },
    createdAt: '2026-10-27T08:30:00Z',
    updatedAt: '2026-10-30T16:15:00Z',
    version: 2,
    reviewNotes: [
      {
        id: 'rn-2',
        articleId: 'art-crispr-prime-editing',
        authorName: 'Dr. Elena Rostova',
        role: 'editor',
        note: 'Please verify whether the 14,000 genomic loci were selected via CHANGE-seq or GUIDE-seq in the Methods section before final sign-off.',
        action: 'comment',
        createdAt: '2026-10-30T16:15:00Z',
        resolved: false,
      },
    ],
  },
  {
    id: 'art-amoc-mooring-2026',
    locale: 'en',
    title: 'Deep Western Boundary Moorings Reveal Decadal Salinity Shifts in North Atlantic Overturning',
    slug: 'deep-western-boundary-moorings-north-atlantic-overturning',
    summary:
      'Continuous 22-year full-depth hydrographic profiles along 26.5°N quantify the relative contributions of Labrador Sea Water and Denmark Strait Overflow Water.  Double space here for local check demo.',
    body: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'New hydrographic reconstructions from the trans-basin mooring array at 26.5°N provide the longest continuous direct record of Atlantic ',
            },
            {
              type: 'text',
              marks: [{ type: 'link', attrs: { href: 'https://en.wikipedia.org/wiki/Thermohaline_circulation', target: '_blank' } }],
              text: 'thermohaline circulation',
            },
            {
              type: 'text',
              text: ' volume transport. Between 2004 and 2026, lower North Atlantic Deep Water southward transport between 3,000 and 5,000 meters depth decreased by 1.8 ± 0.4 Sverdrups.',
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Separating Wind-Driven Gyre Variability from Density Forcing' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'While interannual fluctuations remain dominated by zonal wind-stress curl anomalies across the subtropical gyre, multi-decadal freshening in the subpolar North Atlantic has altered deep isopycnal slopes along the western continental slope.',
            },
          ],
        },
      ],
    },
    bodyHtml: `<p>New hydrographic reconstructions from the trans-basin mooring array at 26.5°N provide the longest continuous direct record of Atlantic <a href="https://en.wikipedia.org/wiki/Thermohaline_circulation" data-knowledge-term="thermohaline circulation" target="_blank" rel="noopener noreferrer">thermohaline circulation</a> volume transport. Between 2004 and 2026, lower North Atlantic Deep Water southward transport between 3,000 and 5,000 meters depth decreased by 1.8 ± 0.4 Sverdrups.</p><h2>Separating Wind-Driven Gyre Variability from Density Forcing</h2><p>While interannual fluctuations remain dominated by zonal wind-stress curl anomalies across the subtropical gyre, multi-decadal freshening in the subpolar North Atlantic has altered deep isopycnal slopes along the western continental slope.</p>`,
    status: 'draft',
    primaryCategoryId: 'cat-earth',
    categoryIds: ['cat-earth', 'sub-oceans', 'sub-climate'],
    tagIds: ['tag-amoc'],
    authorId: 'auth-claire',
    sourceIds: ['src-amoc-1'],
    featuredMediaId: 'media-amoc-chart',
    seo: {
      title: '', // Empty SEO title to trigger Requires Attention & Local Check
      description: '',
      noindex: true,
    },
    createdAt: '2026-10-29T11:00:00Z',
    updatedAt: '2026-10-31T08:45:00Z',
    version: 1,
  },
  {
    id: 'art-solid-state-electrolyte',
    locale: 'en',
    title: 'Halide-Sulfide Dual-Layer Electrolytes Suppress Dendrite Propagation at High Current Densities',
    slug: 'halide-sulfide-electrolytes-dendrite-suppression',
    summary:
      'Operando X-ray computed tomography tracks void formation and interfacial stress at lithium-metal anodes up to 8.5 mA/cm².',
    body: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Solid-state lithium-metal batteries promise higher gravimetric energy density than conventional liquid carbonate cells, yet mechanical fracture driven by lithium filament growth through grain boundaries has restricted fast-charging performance.',
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Operando Synchrotron Tomography of Interfacial Voids' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'By pairing a ductile lithium-indium-halide interlayer with a high-conductivity argyrodite separator, researchers eliminated void accumulation during stripping cycles.',
            },
          ],
        },
      ],
    },
    bodyHtml: `<p>Solid-state lithium-metal batteries promise higher gravimetric energy density than conventional liquid carbonate cells, yet mechanical fracture driven by lithium filament growth through grain boundaries has restricted fast-charging performance.</p><h2>Operando Synchrotron Tomography of Interfacial Voids</h2><p>By pairing a ductile lithium-indium-halide interlayer with a high-conductivity argyrodite separator, researchers eliminated void accumulation during stripping cycles.</p>`,
    status: 'scheduled',
    primaryCategoryId: 'cat-chemistry',
    categoryIds: ['cat-chemistry', 'sub-materials', 'cat-technology', 'sub-energy'],
    tagIds: ['tag-solid-state-battery'],
    authorId: 'auth-marcus',
    sourceIds: [], // Missing source to surface in "Requires Attention"
    seo: {
      title: 'Halide-Sulfide Solid-State Electrolytes Suppress Dendrites | ScientificRadar',
      description: 'Operando synchrotron tomography shows how dual-layer solid electrolytes prevent lithium dendrite propagation at 8.5 mA/cm².',
      noindex: true,
    },
    scheduledAt: '2026-11-04T09:00:00Z',
    createdAt: '2026-10-26T15:00:00Z',
    updatedAt: '2026-10-30T10:00:00Z',
    version: 1,
  },
  {
    id: 'art-tr-kuantum-aglari',
    locale: 'tr',
    title: 'Metropol Fiber Ağlarında 78 Kilometre Mesafede Kuantum Dolanıklık Dağıtımı',
    slug: 'metropol-fiber-aglarinda-78-km-kuantum-dolaniklik',
    summary:
      'Telekom L-bandı kuantum frekans dönüşümü kullanılarak rubidyum-87 atomik bellekler arasında şehir içi fiber hatlarda yüksek doğruluklu dolanıklık sağlandı.',
    body: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Mevcut şehir içi fiber optik altyapısı üzerinden kuantum durumlarının kayıpsız aktarımı, dağıtık kuantum hesaplama ve güvenli iletişim ağları için kritik bir eşiktir.',
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Kuantum Frekans Dönüşümü ve Faz Kararlılığı' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '780 nm dalga boyundaki tekil fotonların 1550 nm telekom bandına dönüştürülmesiyle fiber zayıflama kayıpları önemli ölçüde azaltıldı.',
            },
          ],
        },
      ],
    },
    bodyHtml: `<p>Mevcut şehir içi fiber optik altyapısı üzerinden kuantum durumlarının kayıpsız aktarımı, dağıtık kuantum hesaplama ve güvenli iletişim ağları için kritik bir eşiktir.</p><h2>Kuantum Frekans Dönüşümü ve Faz Kararlılığı</h2><p>780 nm dalga boyundaki tekil fotonların 1550 nm telekom bandına dönüştürülmesiyle fiber zayıflama kayıpları önemli ölçüde azaltıldı.</p>`,
    status: 'published',
    primaryCategoryId: 'cat-physics',
    categoryIds: ['cat-physics', 'sub-quantum'],
    tagIds: ['tag-quantum-entanglement'],
    seriesId: 'ser-quantum-networks',
    authorId: 'auth-kerem',
    sourceIds: ['src-quantum-1'],
    featuredMediaId: 'media-quantum-fiber',
    seo: {
      title: 'Metropol Fiber Ağlarında 78 km Kuantum Dolanıklık | ScientificRadar TR',
      description: 'Şehir içi 78 km fiber optik hat üzerinde rubidyum-87 kuantum bellekler arasında başarılı dolanıklık dağıtımı.',
      noindex: true,
    },
    publishedAt: '2026-10-29T12:00:00Z',
    createdAt: '2026-10-28T16:00:00Z',
    updatedAt: '2026-10-29T12:00:00Z',
    version: 1,
  },
  {
    id: 'art-drosophila-connectome',
    locale: 'en',
    title: 'Synaptic-Resolution Connectome Maps Sensorimotor Feedback Loops in Adult Drosophila Ventral Nerve Cord',
    slug: 'synaptic-connectome-drosophila-ventral-nerve-cord',
    summary:
      'Serial-section electron microscopy reconstructs 14.6 million chemical synapses linking descending brain pathways to wing and haltere motor neurons.',
    body: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Mapping the complete wiring diagram of central nervous systems enables mechanistic models of locomotion and proprioceptive stabilization.',
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Recurrent Inhibitory Motifs in Flight Stabilization' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Quantitative graph analysis identified premotor interneurons that integrate haltere mechanosensory signals within a single synaptic delay.',
            },
          ],
        },
      ],
    },
    bodyHtml: `<p>Mapping the complete wiring diagram of central nervous systems enables mechanistic models of locomotion and proprioceptive stabilization.</p><h2>Recurrent Inhibitory Motifs in Flight Stabilization</h2><p>Quantitative graph analysis identified premotor interneurons that integrate haltere mechanosensory signals within a single synaptic delay.</p>`,
    status: 'approved',
    primaryCategoryId: 'cat-life',
    categoryIds: ['cat-life', 'sub-neuroscience', 'sub-biology'],
    tagIds: ['tag-connectomics'],
    authorId: 'auth-elena',
    sourceIds: ['src-crispr-1'],
    seo: {
      title: 'Synaptic Connectome of Adult Drosophila Ventral Nerve Cord | ScientificRadar',
      description: 'Electron microscopy reconstruction of 14.6 million synapses reveals recurrent feedback loops controlling insect flight.',
      noindex: true,
    },
    scheduledAt: '2026-11-02T14:00:00Z',
    createdAt: '2026-10-24T09:00:00Z',
    updatedAt: '2026-10-29T17:00:00Z',
    version: 1,
  },
  {
    id: 'art-hts-tokamak-divertor',
    locale: 'en',
    title: 'High-Temperature Superconducting Tokamak Coils Sustain 20-Tesla Toroidal Field Under Pulsed Heat Loads',
    slug: 'hts-tokamak-coils-20-tesla-toroidal-field',
    summary:
      'Rare-earth barium copper oxide (REBCO) VIPER cable assemblies demonstrate rapid quench detection and thermal stability during simulated divertor flux transients.',
    body: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Compact magnetic confinement fusion devices rely on high-field REBCO superconducting tapes to reduce plasma chamber volume while maintaining energy confinement scaling.',
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Non-Insulated Winding Quench Propagation Dynamics' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Distributed fiber Bragg grating sensors resolved localized temperature rises within 12 milliseconds across soldered tape joints.',
            },
          ],
        },
      ],
    },
    bodyHtml: `<p>Compact magnetic confinement fusion devices rely on high-field REBCO superconducting tapes to reduce plasma chamber volume while maintaining energy confinement scaling.</p><h2>Non-Insulated Winding Quench Propagation Dynamics</h2><p>Distributed fiber Bragg grating sensors resolved localized temperature rises within 12 milliseconds across soldered tape joints.</p>`,
    status: 'revision_requested',
    primaryCategoryId: 'cat-technology',
    categoryIds: ['cat-technology', 'sub-energy', 'sub-engineering', 'cat-physics'],
    tagIds: ['tag-tokamak'],
    authorId: 'auth-marcus',
    sourceIds: [],
    seo: {
      title: 'HTS Tokamak Coils Sustain 20-Tesla Field | ScientificRadar',
      description: 'REBCO superconducting magnet assemblies tested under pulsed divertor thermal transients.',
      noindex: true,
    },
    createdAt: '2026-10-20T11:00:00Z',
    updatedAt: '2026-10-30T15:30:00Z',
    version: 2,
    reviewNotes: [
      {
        id: 'rn-3',
        articleId: 'art-hts-tokamak-divertor',
        authorName: 'Dr. Elena Rostova',
        role: 'editor',
        note: 'Revision requested: Please attach the primary IEEE Transactions on Applied Superconductivity source DOI before moving to Approved.',
        action: 'request_revision',
        createdAt: '2026-10-30T15:30:00Z',
        resolved: false,
      },
    ],
  },
  {
    id: 'art-denisovan-introgression',
    locale: 'en',
    title: 'High-Coverage Pleistocene Genomes Clarify Multi-Wave Denisovan Introgression in East Eurasia',
    slug: 'pleistocene-genomes-denisovan-introgression-eurasia',
    summary:
      'Ancient DNA extracted from petrous bone specimens dated to 42,000 BP identifies two genetically distinct Denisovan source populations.',
    body: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Haplotype-sharing analyses across 18 newly sequenced Upper Paleolithic individuals reveal distinct archaic segments on chromosome 12 associated with lipid metabolism under cold stress.',
            },
          ],
        },
      ],
    },
    bodyHtml: `<p>Haplotype-sharing analyses across 18 newly sequenced Upper Paleolithic individuals reveal distinct archaic segments on chromosome 12 associated with lipid metabolism under cold stress.</p>`,
    status: 'draft',
    primaryCategoryId: 'cat-humans',
    categoryIds: ['cat-humans', 'sub-anthropology', 'cat-life', 'sub-genetics'],
    tagIds: ['tag-paleogenomics'],
    authorId: 'auth-claire',
    sourceIds: [],
    seo: {
      title: 'Pleistocene Genomes & Multi-Wave Denisovan Introgression | ScientificRadar',
      description: 'Ancient DNA from 42,000-year-old specimens distinguishes two Denisovan introgression pulses.',
      noindex: true,
    },
    createdAt: '2026-10-30T09:15:00Z',
    updatedAt: '2026-10-31T10:10:00Z',
    version: 1,
  },
];

export const SEED_PAGES: EditorialPage[] = [
  {
    id: 'page-editorial-policy',
    title: 'Editorial & Scientific Integrity Policy',
    slug: 'editorial-policy',
    locale: 'en',
    summary: 'Standards for peer-reviewed source attribution, correction handling, conflict-of-interest disclosure, and human-authored science journalism.',
    body: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '1. Human Authorship & Primary Evidence' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'All ScientificRadar articles are written and edited by human science journalists and domain researchers. Automated editorial tools are strictly limited to mechanical formatting, metadata completeness, and link syntax checks—never generating scientific claims or fabricating citations.',
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '2. Primary Source Attribution & DOIs' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Every empirical claim must reference a verifiable peer-reviewed study, institutional dataset, or clearly labeled preprint with its Digital Object Identifier (DOI) and access date.',
            },
          ],
        },
      ],
    },
    bodyHtml: `<h2>1. Human Authorship &amp; Primary Evidence</h2><p>All ScientificRadar articles are written and edited by human science journalists and domain researchers. Automated editorial tools are strictly limited to mechanical formatting, metadata completeness, and link syntax checks—never generating scientific claims or fabricating citations.</p><h2>2. Primary Source Attribution &amp; DOIs</h2><p>Every empirical claim must reference a verifiable peer-reviewed study, institutional dataset, or clearly labeled preprint with its Digital Object Identifier (DOI) and access date.</p>`,
    status: 'published',
    template: 'policy',
    navigationVisibility: true,
    seo: {
      title: 'Editorial & Scientific Integrity Policy | ScientificRadar',
      description: 'How ScientificRadar verifies sources, handles corrections, and enforces human scientific authorship.',
      noindex: true,
    },
    updatedAt: '2026-10-15T12:00:00Z',
  },
  {
    id: 'page-corrections-policy',
    title: 'Corrections & Retractions Protocol',
    slug: 'corrections-policy',
    locale: 'en',
    summary: 'Transparent timestamped logs for factual amendments, figure updates, and post-publication peer review notices.',
    body: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Handling Post-Publication Amendments' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Substantive corrections to numerical values, units, statistical significance, or citation links are appended directly to the article footer with a timestamp and version snapshot.',
            },
          ],
        },
      ],
    },
    bodyHtml: `<h2>Handling Post-Publication Amendments</h2><p>Substantive corrections to numerical values, units, statistical significance, or citation links are appended directly to the article footer with a timestamp and version snapshot.</p>`,
    status: 'published',
    template: 'policy',
    navigationVisibility: true,
    seo: {
      title: 'Corrections & Retractions Protocol | ScientificRadar',
      description: 'Our commitment to transparent, timestamped corrections in scientific reporting.',
      noindex: true,
    },
    updatedAt: '2026-10-16T10:00:00Z',
  },
  {
    id: 'page-about',
    title: 'About ScientificRadar',
    slug: 'about-us',
    locale: 'en',
    summary: 'Independent science newsroom covering physics, space, earth systems, molecular life sciences, and engineering.',
    body: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Our Mission' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'ScientificRadar bridges primary research literature and public scientific literacy across English and Turkish editions, prioritizing methodological clarity over hype.',
            },
          ],
        },
      ],
    },
    bodyHtml: `<h2>Our Mission</h2><p>ScientificRadar bridges primary research literature and public scientific literacy across English and Turkish editions, prioritizing methodological clarity over hype.</p>`,
    status: 'published',
    template: 'standard',
    navigationVisibility: true,
    seo: {
      title: 'About ScientificRadar',
      description: 'Independent science newsroom and research publication.',
      noindex: true,
    },
    updatedAt: '2026-10-12T09:00:00Z',
  },
  {
    id: 'page-accessibility',
    title: 'Accessibility Statement',
    slug: 'accessibility-statement',
    locale: 'en',
    summary: 'WCAG AA contrast compliance, keyboard-accessible knowledge popovers, and non-cropped scientific figure descriptions.',
    body: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Accessible Scientific Publishing' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'All interactive concept cards support keyboard focus and Escape dismissal, and all scientific figures require descriptive alt text explaining axes and trends.',
            },
          ],
        },
      ],
    },
    bodyHtml: `<h2>Accessible Scientific Publishing</h2><p>All interactive concept cards support keyboard focus and Escape dismissal, and all scientific figures require descriptive alt text explaining axes and trends.</p>`,
    status: 'draft',
    template: 'policy',
    navigationVisibility: false,
    seo: {
      title: 'Accessibility Statement | ScientificRadar',
      description: 'Accessibility standards for ScientificRadar readers and editors.',
      noindex: true,
    },
    updatedAt: '2026-10-20T14:00:00Z',
  },
];

export const SEED_SERIES: Series[] = [
  {
    id: 'ser-quantum-networks',
    title: 'Metropolitan Quantum Networks & Repeaters',
    slug: 'metropolitan-quantum-networks',
    description: 'A multi-part editorial series examining atomic memories, telecom frequency conversion, and long-baseline photonic entanglement.',
    locale: 'en',
    articleIds: ['art-quantum-repeater', 'art-tr-kuantum-aglari'],
    updatedAt: '2026-10-29T12:00:00Z',
  },
  {
    id: 'ser-exoplanet-atmospheres',
    title: 'Sub-Neptune & Hycean Atmospheres in the JWST Era',
    slug: 'sub-neptune-hycean-atmospheres-jwst',
    description: 'In-depth analysis of transmission and emission spectroscopy from NIRSpec and MIRI observations.',
    locale: 'en',
    articleIds: ['art-jwst-hycean-spectra'],
    updatedAt: '2026-10-25T09:00:00Z',
  },
];

export const SEED_HOMEPAGE_BLOCKS: HomepageBlock[] = [
  {
    id: 'hb-hero',
    type: 'hero',
    title: 'Lead Science Story (Hero)',
    enabled: true,
    order: 1,
    articleIds: ['art-quantum-repeater'],
  },
  {
    id: 'hb-featured',
    type: 'featured_grid',
    title: 'Featured Research Dispatches',
    enabled: true,
    order: 2,
    articleIds: ['art-jwst-hycean-spectra', 'art-crispr-prime-editing', 'art-drosophila-connectome'],
  },
  {
    id: 'hb-banner',
    type: 'editorial_banner',
    title: 'Scientific Integrity Banner',
    enabled: true,
    order: 3,
    articleIds: [],
    bannerText: 'Every ScientificRadar article cites primary peer-reviewed DOIs and undergoes human editorial verification.',
  },
  {
    id: 'hb-recent',
    type: 'recent_feed',
    title: 'Latest Across Disciplines',
    enabled: true,
    order: 4,
    articleIds: ['art-amoc-mooring-2026', 'art-solid-state-electrolyte', 'art-tr-kuantum-aglari'],
  },
];

export const SEED_MENUS: MenuConfig[] = [
  {
    id: 'menu-primary',
    name: 'Primary Header Navigation',
    location: 'primary',
    dropdownBehavior: 'both',
    items: [
      {
        id: 'mi-space',
        label: 'Space',
        href: '/categories?cat=space',
        targetType: 'category',
        children: [
          { id: 'mi-astro', label: 'Astrophysics', href: '/categories?cat=astrophysics', targetType: 'category' },
          { id: 'mi-cosmo', label: 'Cosmology', href: '/categories?cat=cosmology', targetType: 'category' },
          { id: 'mi-planet', label: 'Planetary Science', href: '/categories?cat=planetary-science', targetType: 'category' },
        ],
      },
      {
        id: 'mi-physics',
        label: 'Physics',
        href: '/categories?cat=physics',
        targetType: 'category',
        children: [
          { id: 'mi-quantum', label: 'Quantum Physics', href: '/categories?cat=quantum-physics', targetType: 'category' },
          { id: 'mi-particle', label: 'Particle Physics', href: '/categories?cat=particle-physics', targetType: 'category' },
        ],
      },
      {
        id: 'mi-life',
        label: 'Life & Genetics',
        href: '/categories?cat=life',
        targetType: 'category',
      },
      {
        id: 'mi-earth',
        label: 'Earth & Climate',
        href: '/categories?cat=earth',
        targetType: 'category',
      },
      {
        id: 'mi-policy',
        label: 'Editorial Policy',
        href: '/preview/pages/page-editorial-policy',
        targetType: 'page',
      },
    ],
  },
  {
    id: 'menu-footer',
    name: 'Footer Institutional Links',
    location: 'footer',
    dropdownBehavior: 'click',
    items: [
      { id: 'mf-about', label: 'About Us', href: '/preview/pages/page-about', targetType: 'page' },
      { id: 'mf-policy', label: 'Editorial Policy', href: '/preview/pages/page-editorial-policy', targetType: 'page' },
      { id: 'mf-corrections', label: 'Corrections Protocol', href: '/preview/pages/page-corrections-policy', targetType: 'page' },
      { id: 'mf-a11y', label: 'Accessibility Statement', href: '/preview/pages/page-accessibility', targetType: 'page' },
    ],
  },
];

export const SEED_REVISIONS: ArticleRevision[] = [
  {
    id: 'rev-quantum-v1',
    articleId: 'art-quantum-repeater',
    version: 1,
    snapshot: {
      ...SEED_ARTICLES[0],
      version: 1,
      summary: 'Initial draft summary of the 78 km rubidium-87 quantum memory experiment.',
      updatedAt: '2026-10-22T10:00:00Z',
    },
    source: 'editor',
    createdAt: '2026-10-22T10:00:00Z',
    summary: 'Initial manuscript pasted by Dr. Elena Rostova',
  },
  {
    id: 'rev-quantum-v2',
    articleId: 'art-quantum-repeater',
    version: 2,
    snapshot: {
      ...SEED_ARTICLES[0],
      version: 2,
      status: 'in_review',
      updatedAt: '2026-10-26T15:30:00Z',
    },
    source: 'review',
    createdAt: '2026-10-26T15:30:00Z',
    summary: 'Submitted for peer editorial review with Nature Photonics DOI attached',
  },
  {
    id: 'rev-quantum-v3',
    articleId: 'art-quantum-repeater',
    version: 3,
    snapshot: SEED_ARTICLES[0],
    source: 'publish',
    createdAt: '2026-10-28T14:00:00Z',
    summary: 'Approved by Prof. Marcus Thorne and published in local demo store',
  },
];

export const SEED_AUDIT_EVENTS: AuditEvent[] = [
  {
    id: 'aud-1',
    timestamp: '2026-10-31T08:45:00Z',
    actor: 'Claire Vance, MSc',
    role: 'author',
    action: 'Saved draft',
    targetType: 'article',
    targetTitle: 'Deep Western Boundary Moorings Reveal Decadal Salinity Shifts in North Atlantic Overturning',
    details: 'Updated hydrographic profile summary (Version 1)',
  },
  {
    id: 'aud-2',
    timestamp: '2026-10-30T16:15:00Z',
    actor: 'Dr. Elena Rostova',
    role: 'editor',
    action: 'Added review note',
    targetType: 'review',
    targetTitle: 'Structured pegRNA Scaffolds Suppress Off-Target Indels in Primary Hepatocyte Prime Editing',
    details: 'Requested confirmation of CHANGE-seq vs GUIDE-seq assay protocol',
  },
  {
    id: 'aud-3',
    timestamp: '2026-10-29T12:00:00Z',
    actor: 'Dr. Kerem Aydın',
    role: 'author',
    action: 'Published demo article (TR)',
    targetType: 'article',
    targetTitle: 'Metropol Fiber Ağlarında 78 Kilometre Mesafede Kuantum Dolanıklık Dağıtımı',
    details: 'Published inside isolated P0 demo store (scientificradar.com untouched)',
  },
  {
    id: 'aud-4',
    timestamp: '2026-10-28T14:00:00Z',
    actor: 'Dr. Elena Rostova',
    role: 'editor',
    action: 'Published demo article (EN)',
    targetType: 'article',
    targetTitle: 'Heralded Quantum Entanglement Sustained Across 78 Kilometers of Deployed Metropolitan Fiber',
    details: 'Transitioned Approved -> Published (Demo state only)',
  },
];

export const SEED_INTEGRATIONS: IntegrationConnection[] = [
  {
    id: 'codex',
    name: 'Codex / Sign in with ChatGPT',
    category: 'ai',
    status: 'not_connected',
    intendedUse: 'Optional editorial finishing assistant for formatting, SEO metadata, tags, source checks, and smart knowledge link suggestions.',
    p0Behavior: 'Disconnected adapter + deterministic local checks (H1 demotion, missing alt text, tag normalization, URL/DOI syntax). Never fabricates AI output.',
    statusDetail: 'Not connected — requires official Codex app-server or authorized partner OAuth in P2.',
    requiredEnvVars: ['CODEX_PROVIDER_ENDPOINT'],
  },
  {
    id: 'cloudflare_r2',
    name: 'Cloudflare R2 Object Storage',
    category: 'media_cloud',
    status: 'not_connected',
    intendedUse: 'Retain original uploaded scientific figures and photographs in Cloudflare R2 Standard bucket (10 GB/month free tier).',
    p0Behavior: 'Local demo media adapter (IndexedDB + SVG/Object URLs). No external R2 bucket contacted.',
    statusDetail: 'Not connected — using Local Demo Storage adapter.',
    requiredEnvVars: ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_R2_ACCESS_KEY_ID', 'CLOUDFLARE_R2_SECRET_ACCESS_KEY', 'CLOUDFLARE_R2_BUCKET_NAME'],
  },
  {
    id: 'cloudflare_images',
    name: 'Cloudflare Image Transformations',
    category: 'media_cloud',
    status: 'not_connected',
    intendedUse: 'Serve responsive finite presets (hero 1600×900, article 1200w, card 640×360, thumb 320×180) with format=auto within 5,000 unique monthly transforms.',
    p0Behavior: 'Preset simulator and non-destructive contain rules for scientific figures; no live CDN transform calls.',
    statusDetail: 'Not connected — responsive preset rules previewed locally.',
    requiredEnvVars: ['CLOUDFLARE_IMAGES_DOMAIN'],
  },
  {
    id: 'google_adsense',
    name: 'Google AdSense (Publisher Monetization)',
    category: 'google_services',
    status: 'not_connected',
    intendedUse: 'Display publisher ad placements on public website with excluded zones around scientific figures. Distinct from Google Ads campaign buying.',
    p0Behavior: 'Settings card only; no ad scripts loaded in admin or preview.',
    statusDetail: 'Not connected — publisher client ID not configured.',
    requiredEnvVars: ['GOOGLE_ADSENSE_CLIENT_ID'],
  },
  {
    id: 'google_analytics_4',
    name: 'Google Analytics 4 (GA4)',
    category: 'google_services',
    status: 'not_connected',
    intendedUse: 'Measure public article readership and engagement with regional consent compliance.',
    p0Behavior: 'Disconnected card; dashboard displays real counts from local editorial records only (zero fake traffic charts).',
    statusDetail: 'Not connected — measurement stream inactive in P0 prototype.',
    requiredEnvVars: ['GOOGLE_ANALYTICS_MEASUREMENT_ID'],
  },
  {
    id: 'google_search_console',
    name: 'Google Search Console',
    category: 'google_services',
    status: 'not_connected',
    intendedUse: 'Inspect search query performance, indexing coverage, and structured Article schema status.',
    p0Behavior: 'Disconnected card; SEO Center runs local structural metadata checks without claiming search ranking guarantees.',
    statusDetail: 'Not connected — domain property verification deferred to P2.',
    requiredEnvVars: ['GOOGLE_SEARCH_CONSOLE_SITE_URL'],
  },
  {
    id: 'google_tag_manager',
    name: 'Google Tag Manager',
    category: 'google_services',
    status: 'not_connected',
    intendedUse: 'Containerized measurement deployment respecting Content Security Policy and CLS budgets.',
    p0Behavior: 'Disconnected card; no third-party container scripts injected.',
    statusDetail: 'Not connected — container ID not configured.',
    requiredEnvVars: ['GOOGLE_TAG_MANAGER_ID'],
  },
];

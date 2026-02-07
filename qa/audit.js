const fs = require('fs/promises');
const path = require('path');
const { chromium } = require('playwright');

const BASES = [
  {
    label: 'live',
    baseUrl: 'https://hoya4humanity.github.io/LoneStarHempWorks/',
  },
  {
    label: 'local',
    baseUrl: process.env.LOCAL_BASE_URL || 'http://localhost:4173/',
  },
];

const PAGES = [
  { name: 'home', path: 'index.html', hero: 'standard' },
  { name: 'about', path: 'about.html', hero: 'standard' },
  { name: 'products', path: 'products.html', hero: 'standard' },
  { name: 'community', path: 'community.html', hero: 'community' },
  { name: 'contact', path: 'contact.html', hero: 'standard' },
  { name: 'legal', path: 'legal.html', hero: 'standard' },
];

const VIEWPORTS = {
  desktop: { width: 1280, height: 720 },
  mobile: { width: 390, height: 844 },
};

const SOCIAL_LINKS = {
  instagram: 'https://instagram.com/lonestarhempworks',
  facebook: 'https://www.facebook.com/share/1FrbUnXb5b/?mibextid=wwXIfr',
};

const EXPECTED_PHONE = 'tel:+18308003213';

const EXPECTED_HOURS = [
  'Mon: 9:00 AM – 11:00 PM',
  'Tue: 9:00 AM – 11:00 PM',
  'Wed: 9:00 AM – 11:00 PM',
  'Thu: 9:00 AM – 11:00 PM',
  'Fri: 9:00 AM – 12:00 AM',
  'Sat: 9:00 AM – 12:00 AM',
  'Sun: 11:00 AM – 9:00 PM',
];

const communityBanner = {
  desktop: 'assets/img/Community-banner-desktop.PNG',
  mobile: 'assets/img/Community-banner-mobile.PNG',
};

function resolveUrl(base, pagePath) {
  return new URL(pagePath, base).toString();
}

async function ensureDir(target) {
  await fs.mkdir(target, { recursive: true });
}

async function collectBrokenLinks(links) {
  const broken = [];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  for (const link of links) {
    try {
      const response = await fetch(link, {
        method: 'HEAD',
        redirect: 'follow',
        signal: controller.signal,
      });
      if (response.status >= 400) {
        broken.push({ url: link, status: response.status });
      }
    } catch (error) {
      broken.push({ url: link, status: 'error', error: error.message });
    }
  }

  clearTimeout(timeout);
  return broken;
}

async function getVisibleElementsInfo(page, selector) {
  return page.evaluate((selector) => {
    const elements = Array.from(document.querySelectorAll(selector));
    return elements
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        const isVisible =
          rect.width > 0 &&
          rect.height > 0 &&
          style.visibility !== 'hidden' &&
          style.display !== 'none' &&
          style.opacity !== '0';
        return {
          text: element.textContent?.trim() || '',
          rect: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          },
          isVisible,
        };
      })
      .filter((entry) => entry.isVisible);
  }, selector);
}

async function auditPage({ page, pageDef, viewport, baseLabel }) {
  const url = resolveUrl(pageDef.baseUrl, pageDef.path);
  await page.setViewportSize(viewport);
  await page.goto(url, { waitUntil: 'networkidle' });

  const screenshotName = `${viewport.name}-${baseLabel}-${pageDef.name}.png`;
  await page.screenshot({ path: path.join('screenshots', screenshotName), fullPage: true });

  const heroInfo = await page.evaluate(() => {
    const heroSections = document.querySelectorAll('section.hero');
    const heroImgs = Array.from(document.querySelectorAll('section.hero img')).map((img) => img.getAttribute('src'));
    const heroSources = Array.from(document.querySelectorAll('section.hero source')).map((source) =>
      source.getAttribute('srcset')
    );
    return {
      heroCount: heroSections.length,
      heroImgs,
      heroSources,
    };
  });

  const socialPositions = await page.evaluate((socialLinks) => {
    const anchors = Array.from(document.querySelectorAll('a'));
    const matches = anchors
      .filter((anchor) => socialLinks.includes(anchor.href))
      .map((anchor) => {
        const rect = anchor.getBoundingClientRect();
        const inFooter = Boolean(anchor.closest('footer'));
        return {
          href: anchor.href,
          top: rect.top,
          inFooter,
        };
      });
    return matches;
  }, Object.values(SOCIAL_LINKS));

  const footerSocials = await page.evaluate((socialLinks) => {
    const footer = document.querySelector('footer');
    if (!footer) {
      return [];
    }
    return Array.from(footer.querySelectorAll('a')).map((anchor) => anchor.href).filter((href) => socialLinks.includes(href));
  }, Object.values(SOCIAL_LINKS));

  const telLinks = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href^="tel:"]')).map((anchor) => anchor.getAttribute('href'))
  );

  const hoursText = await page.evaluate(() => {
    const table = document.querySelector('table.hours');
    return table ? table.innerText.replace(/\s+/g, ' ').trim() : '';
  });

  const canonicalInfo = await page.evaluate(() => {
    const canonical = document.querySelector('link[rel="canonical"]');
    const ogUrl = document.querySelector('meta[property="og:url"]');
    return {
      canonical: canonical ? canonical.getAttribute('href') : null,
      ogUrl: ogUrl ? ogUrl.getAttribute('content') : null,
    };
  });

  const navInfo = await page.evaluate(() => {
    const toggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('#primary-nav');

    if (!toggle || !nav) {
      return {
        toggleVisible: false,
        navVisible: false,
        ariaExpanded: toggle ? toggle.getAttribute('aria-expanded') : null,
        ariaHidden: nav ? nav.getAttribute('aria-hidden') : null,
      };
    }

    const toggleRect = toggle.getBoundingClientRect();
    const toggleStyle = window.getComputedStyle(toggle);
    const toggleVisible =
      toggleRect.width > 0 &&
      toggleRect.height > 0 &&
      toggleStyle.display !== 'none' &&
      toggleStyle.visibility !== 'hidden' &&
      toggleStyle.opacity !== '0';

    const navRect = nav.getBoundingClientRect();
    const navStyle = window.getComputedStyle(nav);
    const navVisible =
      navRect.width > 0 &&
      navRect.height > 0 &&
      navStyle.display !== 'none' &&
      navStyle.visibility !== 'hidden' &&
      navStyle.opacity !== '0';

    return {
      toggleVisible,
      navVisible,
      ariaExpanded: toggle.getAttribute('aria-expanded'),
      ariaHidden: nav.getAttribute('aria-hidden'),
    };
  });

  const ctaDuplicates = pageDef.name === 'home'
    ? await page.evaluate(() => {
        const viewportHeight = window.innerHeight;
        const buttons = Array.from(document.querySelectorAll('a, button'));
        const items = buttons
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const text = element.textContent?.trim() || '';
            const visible = rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.top <= viewportHeight;
            return { text, rect: { top: rect.top, left: rect.left }, visible };
          })
          .filter((item) => item.visible && item.text.length > 1);

        const duplicates = [];
        const seen = {};
        for (const item of items) {
          if (!seen[item.text]) {
            seen[item.text] = [item];
          } else {
            seen[item.text].push(item);
          }
        }

        Object.entries(seen).forEach(([text, entries]) => {
          if (entries.length > 1) {
            const clustered = entries.some((a) =>
              entries.some((b) => a !== b && Math.abs(a.rect.top - b.rect.top) < 200 && Math.abs(a.rect.left - b.rect.left) < 300)
            );
            if (clustered) {
              duplicates.push({ text, count: entries.length });
            }
          }
        });

        return duplicates;
      })
    : [];

  return {
    url,
    heroInfo,
    socialPositions,
    footerSocials,
    telLinks,
    hoursText,
    canonicalInfo,
    navInfo,
    ctaDuplicates,
  };
}

async function auditBase(base) {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push({
        url: page.url(),
        text: msg.text(),
      });
    }
  });

  const results = {
    baseUrl: base.baseUrl,
    pages: {},
    consoleErrors,
    brokenLinks: [],
  };

  for (const viewportName of Object.keys(VIEWPORTS)) {
    for (const pageDef of PAGES) {
      const pageResult = await auditPage({
        page,
        pageDef: { ...pageDef, baseUrl: base.baseUrl },
        viewport: { ...VIEWPORTS[viewportName], name: viewportName },
        baseLabel: base.label,
      });

      if (!results.pages[pageDef.name]) {
        results.pages[pageDef.name] = {};
      }
      results.pages[pageDef.name][viewportName] = pageResult;
    }
  }

  const allLinks = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a'))
      .map((anchor) => anchor.getAttribute('href'))
      .filter((href) => href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('javascript:'))
  );

  const absoluteLinks = allLinks.map((href) => new URL(href, base.baseUrl).toString());
  results.brokenLinks = await collectBrokenLinks(absoluteLinks);

  await browser.close();
  return results;
}

function evaluateNav(results) {
  const desktopIssues = [];
  const mobileIssues = [];

  for (const [pageName, viewports] of Object.entries(results.pages)) {
    const desktop = viewports.desktop.navInfo;
    const mobile = viewports.mobile.navInfo;

    if (desktop.toggleVisible) {
      desktopIssues.push(`${pageName}: menu toggle visible on desktop`);
    }
    if (!desktop.navVisible) {
      desktopIssues.push(`${pageName}: nav links not visible on desktop`);
    }

    if (!mobile.toggleVisible) {
      mobileIssues.push(`${pageName}: menu toggle not visible on mobile`);
    }
    if (mobile.navVisible && mobile.ariaHidden === 'true') {
      mobileIssues.push(`${pageName}: nav visible but aria-hidden true on mobile`);
    }
  }

  return { desktopIssues, mobileIssues };
}

function evaluateHeroes(results) {
  const issues = [];
  for (const [pageName, viewports] of Object.entries(results.pages)) {
    const desktop = viewports.desktop.heroInfo;
    if (desktop.heroCount !== 1) {
      issues.push(`${pageName}: expected 1 hero section, found ${desktop.heroCount}`);
    }
    if (pageName === 'community') {
      const hasCommunityDesktop = desktop.heroSources.some((src) => src?.includes(communityBanner.desktop));
      const hasCommunityMobile = desktop.heroImgs.some((src) => src?.includes(communityBanner.mobile));
      if (!hasCommunityDesktop || !hasCommunityMobile) {
        issues.push(`${pageName}: missing community banner assets`);
      }
    } else {
      const hasStandardDesktop = desktop.heroImgs.some((src) => src?.includes('hero-web.png'));
      const hasStandardMobile = desktop.heroSources.some((src) => src?.includes('hero-mobile.png'));
      if (!hasStandardDesktop || !hasStandardMobile) {
        issues.push(`${pageName}: missing standard hero assets`);
      }
    }
  }
  return issues;
}

function evaluateSocials(results) {
  const topIssues = [];
  const footerIssues = [];

  for (const [pageName, viewports] of Object.entries(results.pages)) {
    const desktop = viewports.desktop;
    if (pageName !== 'home') {
      const hasTopSocials = desktop.socialPositions.some((entry) => entry.top < 400);
      if (hasTopSocials) {
        topIssues.push(`${pageName}: social link appears near top of page`);
      }
    }

    const footerSocials = desktop.footerSocials.sort().join('|');
    const expected = Object.values(SOCIAL_LINKS).sort().join('|');
    if (footerSocials !== expected) {
      footerIssues.push(`${pageName}: footer socials mismatch`);
    }
  }

  return { topIssues, footerIssues };
}

function evaluatePhoneAndHours(results) {
  const phoneIssues = [];
  const hoursIssues = [];

  for (const [pageName, viewports] of Object.entries(results.pages)) {
    const desktop = viewports.desktop;
    const uniquePhones = Array.from(new Set(desktop.telLinks));
    if (uniquePhones.length > 0 && (uniquePhones.length !== 1 || uniquePhones[0] !== EXPECTED_PHONE)) {
      phoneIssues.push(`${pageName}: unexpected phone links ${uniquePhones.join(', ')}`);
    }

    if (pageName === 'home' || pageName === 'contact') {
      const normalized = desktop.hoursText;
      const missing = EXPECTED_HOURS.filter((line) => !normalized.includes(line));
      if (missing.length) {
        hoursIssues.push(`${pageName}: missing hours ${missing.join('; ')}`);
      }
    }
  }

  return { phoneIssues, hoursIssues };
}

function evaluateCtaDuplicates(results) {
  const home = results.pages.home?.desktop?.ctaDuplicates || [];
  return home.map((entry) => `home: duplicate CTA label "${entry.text}" (${entry.count})`);
}

async function writeReport(report) {
  await fs.writeFile('qa-report.json', JSON.stringify(report, null, 2));

  const lines = [];
  lines.push(`# QA Report`);
  lines.push('');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push('');

  lines.push('## Summary');
  if (report.summary.failures.length === 0) {
    lines.push('- ✅ All automated checks passed.');
  } else {
    report.summary.failures.forEach((failure) => lines.push(`- ❌ ${failure}`));
  }
  lines.push('');

  lines.push('## PASS/FAIL Table');
  lines.push('| Requirement | Live | Local | Evidence |');
  lines.push('| --- | --- | --- | --- |');

  report.table.forEach((row) => {
    lines.push(`| ${row.requirement} | ${row.live} | ${row.local} | ${row.evidence} |`);
  });

  lines.push('');
  lines.push('## Canonical / og:url findings');
  report.canonicalFindings.forEach((entry) => {
    lines.push(`- ${entry}`);
  });

  await fs.writeFile('qa-report.md', lines.join('\n'));
}

async function writeConsoleErrors(runs) {
  const lines = [];
  runs.forEach((run) => {
    lines.push(`## ${run.label.toUpperCase()} (${run.baseUrl})`);
    if (run.consoleErrors.length === 0) {
      lines.push('- No console errors captured.');
    } else {
      run.consoleErrors.forEach((entry) => lines.push(`- ${entry.url}: ${entry.text}`));
    }
    lines.push('');
  });
  await fs.writeFile('console-errors.log', lines.join('\n'));
}

async function writeBrokenLinks(runs) {
  const lines = [];
  runs.forEach((run) => {
    lines.push(`## ${run.label.toUpperCase()} (${run.baseUrl})`);
    if (run.brokenLinks.length === 0) {
      lines.push('- No broken links detected.');
    } else {
      run.brokenLinks.forEach((entry) => {
        lines.push(`- ${entry.url} (${entry.status})${entry.error ? `: ${entry.error}` : ''}`);
      });
    }
    lines.push('');
  });
  await fs.writeFile('broken-links.md', lines.join('\n'));
}

(async () => {
  await ensureDir('screenshots');

  const runs = [];
  for (const base of BASES) {
    const results = await auditBase(base);
    runs.push({ label: base.label, baseUrl: base.baseUrl, ...results });
  }

  const combined = {};
  runs.forEach((run) => {
    combined[run.label] = run;
  });

  const navLive = evaluateNav(combined.live);
  const navLocal = evaluateNav(combined.local);

  const heroLive = evaluateHeroes(combined.live);
  const heroLocal = evaluateHeroes(combined.local);

  const socialLive = evaluateSocials(combined.live);
  const socialLocal = evaluateSocials(combined.local);

  const phoneLive = evaluatePhoneAndHours(combined.live);
  const phoneLocal = evaluatePhoneAndHours(combined.local);

  const ctaLive = evaluateCtaDuplicates(combined.live);
  const ctaLocal = evaluateCtaDuplicates(combined.local);

  const allFailures = [
    ...navLive.desktopIssues,
    ...navLive.mobileIssues,
    ...navLocal.desktopIssues,
    ...navLocal.mobileIssues,
    ...heroLive,
    ...heroLocal,
    ...socialLive.topIssues,
    ...socialLocal.topIssues,
    ...socialLive.footerIssues,
    ...socialLocal.footerIssues,
    ...phoneLive.phoneIssues,
    ...phoneLocal.phoneIssues,
    ...phoneLive.hoursIssues,
    ...phoneLocal.hoursIssues,
    ...ctaLive,
    ...ctaLocal,
  ];

  const table = [
    {
      requirement: 'Desktop nav: hamburger hidden, horizontal nav visible',
      live: navLive.desktopIssues.length ? 'FAIL' : 'PASS',
      local: navLocal.desktopIssues.length ? 'FAIL' : 'PASS',
      evidence: [...navLive.desktopIssues, ...navLocal.desktopIssues].join(' | ') || 'All pages OK',
    },
    {
      requirement: 'Mobile nav: hamburger visible, links hidden until open',
      live: navLive.mobileIssues.length ? 'FAIL' : 'PASS',
      local: navLocal.mobileIssues.length ? 'FAIL' : 'PASS',
      evidence: [...navLive.mobileIssues, ...navLocal.mobileIssues].join(' | ') || 'All pages OK',
    },
    {
      requirement: 'Hero banners use correct assets and no stacking',
      live: heroLive.length ? 'FAIL' : 'PASS',
      local: heroLocal.length ? 'FAIL' : 'PASS',
      evidence: [...heroLive, ...heroLocal].join(' | ') || 'All pages OK',
    },
    {
      requirement: 'Social buttons not at top of subpages',
      live: socialLive.topIssues.length ? 'FAIL' : 'PASS',
      local: socialLocal.topIssues.length ? 'FAIL' : 'PASS',
      evidence: [...socialLive.topIssues, ...socialLocal.topIssues].join(' | ') || 'None found',
    },
    {
      requirement: 'Footer socials use required Instagram/Facebook URLs',
      live: socialLive.footerIssues.length ? 'FAIL' : 'PASS',
      local: socialLocal.footerIssues.length ? 'FAIL' : 'PASS',
      evidence: [...socialLive.footerIssues, ...socialLocal.footerIssues].join(' | ') || 'All pages OK',
    },
    {
      requirement: 'Home page CTA labels not duplicated within viewport',
      live: ctaLive.length ? 'FAIL' : 'PASS',
      local: ctaLocal.length ? 'FAIL' : 'PASS',
      evidence: [...ctaLive, ...ctaLocal].join(' | ') || 'No clustered duplicates detected',
    },
    {
      requirement: 'Phone links use tel:+18308003213',
      live: phoneLive.phoneIssues.length ? 'FAIL' : 'PASS',
      local: phoneLocal.phoneIssues.length ? 'FAIL' : 'PASS',
      evidence: [...phoneLive.phoneIssues, ...phoneLocal.phoneIssues].join(' | ') || 'All detected tel links OK',
    },
    {
      requirement: 'Hours match required schedule (home/contact)',
      live: phoneLive.hoursIssues.length ? 'FAIL' : 'PASS',
      local: phoneLocal.hoursIssues.length ? 'FAIL' : 'PASS',
      evidence: [...phoneLive.hoursIssues, ...phoneLocal.hoursIssues].join(' | ') || 'Hours text matches',
    },
  ];

  const canonicalFindings = [];
  for (const run of runs) {
    for (const [pageName, viewports] of Object.entries(run.pages)) {
      const { canonical, ogUrl } = viewports.desktop.canonicalInfo;
      if (canonical || ogUrl) {
        canonicalFindings.push(
          `${run.label.toUpperCase()} ${pageName}: canonical=${canonical || 'none'} og:url=${ogUrl || 'none'}`
        );
      }
    }
  }
  if (canonicalFindings.length === 0) {
    canonicalFindings.push('No canonical or og:url tags detected across audited pages.');
  }

  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      failures: allFailures,
    },
    table,
    runs: {
      live: combined.live,
      local: combined.local,
    },
    canonicalFindings,
  };

  await writeReport(report);
  await writeConsoleErrors(runs);
  await writeBrokenLinks(runs);
})();

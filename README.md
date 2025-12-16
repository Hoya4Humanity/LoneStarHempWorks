# Lone Star Hempworks

Static starter website for Lone Star Hempworks in Seguin, Texas. Built with semantic HTML, vanilla CSS, and a small JS helper for the age gate and mobile navigation.

## Pages
- `index.html` – homepage switchboard with quick links and location info.
- `products.html` – display-only categories for hemp, flower, pre-rolls, gummies, concentrates, and local goods.
- `community.html` – local maker spotlights, community board placeholder, and vendor form.
- `about.html` – about story plus contact/visit details and Netlify contact form.
- `legal.html` – compliance, responsible use, and FDA disclaimer.
- `not-eligible.html` – destination for visitors under 21.
- `sitemap.xml`, `robots.txt` – SEO helpers.

## Local development
Open `index.html` in your browser or use a simple static server:

```bash
python -m http.server 8000
```
Then visit http://localhost:8000/ in your browser.

## Deploying to Netlify
1. Log in to Netlify and create a new site.
2. Drag and drop the repository folder (or a zipped copy) into the Netlify UI.
3. Ensure the publish directory is the root of the project (contains `index.html`).
4. Netlify Forms are already configured for the contact and vendor forms.

## Deploying to GitHub Pages
1. Push this repository to GitHub.
2. In the repository settings, enable GitHub Pages using the `main` branch and the `/` (root) folder.
3. Wait for the site to build, then visit the published Pages URL.

## Netlify form handling
- `about.html` contact form: `name`, `email`, `message`, honeypot field, success query parameter `?sent=1`.
- `community.html` vendor form: `name`, `email`, `what you make`, `message`, honeypot field, success query parameter `?sent=1`.

## Age gate behavior
- First visit shows a modal asking if the user is 21 or older.
- Selecting **Yes** stores `ageStatus=yes` in `localStorage` and hides the modal.
- Selecting **No** stores `ageStatus=no` and redirects to `/not-eligible.html`.
- If `ageStatus` is `no`, all other pages redirect to `/not-eligible.html`.
- The age gate is intentionally not shown on `/not-eligible.html`.

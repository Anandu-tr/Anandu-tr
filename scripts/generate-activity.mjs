// Regenerates assets/activity.svg from real contribution data.
// Runs in GitHub Actions with the built-in GITHUB_TOKEN (no PAT needed once
// "include private contributions" is enabled — counts appear in the public calendar).
const LOGIN = "Anandu-tr";
const token = process.env.GITHUB_TOKEN;

const query = `query($login:String!){ user(login:$login){
  contributionsCollection{ contributionCalendar{
    totalContributions weeks{ contributionDays{ date contributionCount } } } } } }`;

const res = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query, variables: { login: LOGIN } }),
});
const json = await res.json();
if (json.errors) { console.error(json.errors); process.exit(1); }

const cal = json.data.user.contributionsCollection.contributionCalendar;
const days = cal.weeks.flatMap(w => w.contributionDays);
const total = cal.totalContributions;

let longest = 0, run = 0;
for (const d of days) { run = d.contributionCount > 0 ? run + 1 : 0; longest = Math.max(longest, run); }

// current streak: trailing non-zero days; today at 0 doesn't break it (yet)
let current = 0;
const rev = [...days].reverse();
let i = 0;
if (rev[0] && rev[0].contributionCount === 0) i = 1; // grace for today
for (; i < rev.length; i++) { if (rev[i].contributionCount > 0) current++; else break; }

// needle geometry: dial 0..30 days, 180° sweep
const v = Math.min(current, 30);
const th = Math.PI * (1 - v / 30);
const tipX = 100 + 66 * Math.cos(th), tipY = 105 - 66 * Math.sin(th);
const px = 3.2 * Math.cos(th - Math.PI / 2), py = -3.2 * Math.sin(th - Math.PI / 2);
const needle = `${(100 + px).toFixed(1)},${(105 + py).toFixed(1)} ${(100 - px).toFixed(1)},${(105 - py).toFixed(1)} ${tipX.toFixed(1)},${tipY.toFixed(1)}`;

const today = new Date().toISOString().slice(0, 10);
const streakSub = current > 0 ? `${current} day${current === 1 ? "" : "s"} and counting` : "starts with today's commit";

const svg = `<svg viewBox="0 0 680 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Activity: ${total} contributions past year, current streak ${current} days, longest ${longest} days">
  <rect width="680" height="260" rx="12" fill="#0e0c0a"/>
  <g font-family="-apple-system,'Segoe UI',sans-serif" text-anchor="middle">
    <text x="115" y="115" font-size="34" font-weight="700" fill="#f2f0ec">${total.toLocaleString("en-US")}</text>
    <text x="115" y="145" font-size="13" font-weight="600" fill="#e6edf3">Total Contributions</text>
    <text x="115" y="165" font-size="11" fill="#8b949e">past 12 months</text>
    <line x1="228" y1="45" x2="228" y2="215" stroke="#2a2622" stroke-width="1"/>
    <line x1="452" y1="45" x2="452" y2="215" stroke="#2a2622" stroke-width="1"/>
    <text x="565" y="115" font-size="34" font-weight="700" fill="#f2f0ec">${longest}</text>
    <text x="565" y="145" font-size="13" font-weight="600" fill="#e6edf3">Longest Streak</text>
    <text x="565" y="165" font-size="11" fill="#8b949e">past 12 months</text>
  </g>
  <g transform="translate(240,18)">
    <path d="M 22 105 A 78 78 0 0 1 42.1 52.8" fill="none" stroke="#2a2622" stroke-width="8"/>
    <path d="M 42.1 52.8 A 78 78 0 0 1 91.8 27.4" fill="none" stroke="#b45309" stroke-width="8"/>
    <path d="M 91.8 27.4 A 78 78 0 0 1 178 105" fill="none" stroke="#2ea043" stroke-width="8"/>
    <g stroke="#8b949e" stroke-width="1.6">
      <line x1="24" y1="105" x2="34" y2="105"/><line x1="32.4" y1="66" x2="41.1" y2="71"/>
      <line x1="61" y1="37.5" x2="66" y2="46.1"/><line x1="100" y1="27" x2="100" y2="37"/>
      <line x1="139" y1="37.5" x2="134" y2="46.1"/><line x1="167.6" y1="66" x2="158.9" y2="71"/>
      <line x1="176" y1="105" x2="166" y2="105"/>
    </g>
    <text x="20" y="119" text-anchor="middle" font-size="9.5" fill="#8b949e" font-family="ui-monospace,Menlo,monospace">0</text>
    <text x="180" y="119" text-anchor="middle" font-size="9.5" fill="#8b949e" font-family="ui-monospace,Menlo,monospace">30d</text>
    <path transform="translate(126,66)" fill="#eda35c" d="M6.5 0 C7 2.8 9.8 4.2 10.6 6.8 C11.5 9.6 9.8 12.6 6.8 13.2 C3.8 13.8 1 11.6 0.8 8.6 C0.7 6.6 1.7 5.4 2.8 4.2 C3 5.2 3.5 5.8 4.3 6.2 C4 4 4.8 1.8 6.5 0 Z"/>
    <polygon points="${needle}" fill="#2ea043"/>
    <circle cx="100" cy="105" r="5.5" fill="#2ea043"/>
  </g>
  <g font-family="-apple-system,'Segoe UI',sans-serif" text-anchor="middle">
    <text x="340" y="180" font-size="24" font-weight="700" fill="#2ea043">${current} <tspan font-size="13" fill="#8b949e">days</tspan></text>
    <text x="340" y="203" font-size="13" font-weight="700" fill="#2ea043">Current Streak</text>
    <text x="340" y="222" font-size="11" fill="#8b949e">${streakSub}</text>
  </g>
  <text x="660" y="248" text-anchor="end" font-size="9" fill="#6e675e" font-family="ui-monospace,Menlo,monospace">updated ${today}</text>
</svg>`;

const { writeFileSync } = await import("node:fs");
writeFileSync("assets/activity.svg", svg);
console.log(`activity.svg → total=${total} current=${current} longest=${longest}`);
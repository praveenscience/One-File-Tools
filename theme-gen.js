#!/usr/bin/env node

/**
 * Theme generator for One File Tools.
 *
 * Reads profile.json and processes all .hbs (Handlebars) template files
 * in resume/themes/ and portfolio/themes/, outputting .html files.
 *
 * Usage:
 *   node theme-gen.js                      # uses ./profile.json
 *   node theme-gen.js path/to/profile.json  # custom profile path
 *
 * Contributors: create a .hbs file in resume/themes/ or portfolio/themes/.
 * See existing templates for examples. Available helpers are listed below.
 */

const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");

// ──────────────────────────────────────────────
// Load profile data
// ──────────────────────────────────────────────

const profilePath = process.argv[2] || path.join(__dirname, "profile.json");
let profile;
try {
  profile = JSON.parse(fs.readFileSync(profilePath, "utf-8"));
} catch (err) {
  if (err.code === "ENOENT") {
    console.log("No profile.json found — skipping theme generation.");
    console.log("  Create profile.json from the sample to get started.");
    process.exit(0);
  }
  console.error("Error reading profile.json: " + err.message);
  process.exit(1);
}

// ──────────────────────────────────────────────
// Register Handlebars helpers
// ──────────────────────────────────────────────

// {{fmtDate value}} — "2022-03" → "Mar 2022", null → "Present"
Handlebars.registerHelper("fmtDate", function (d) {
  if (!d) return "Present";
  const parts = String(d).split("-");
  if (parts.length === 1) return parts[0];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months[parseInt(parts[1], 10) - 1] + " " + parts[0];
});

// {{year}} — current year
Handlebars.registerHelper("year", function () {
  return new Date().getFullYear();
});

// {{eq a b}} — equality check for {{#if (eq level "expert")}}
Handlebars.registerHelper("eq", function (a, b) {
  return a === b;
});

// {{join array ", "}} — join array of strings
Handlebars.registerHelper("join", function (arr, sep) {
  if (!Array.isArray(arr)) return "";
  return arr.join(typeof sep === "string" ? sep : ", ");
});

// {{joinField array "name" ", "}} — join array of objects by field
Handlebars.registerHelper("joinField", function (arr, field, sep) {
  if (!Array.isArray(arr)) return "";
  return arr.map(function (item) { return item[field] || ""; }).filter(Boolean).join(typeof sep === "string" ? sep : ", ");
});

// {{lowercase value}} — lowercase a string
Handlebars.registerHelper("lowercase", function (str) {
  return String(str || "").toLowerCase();
});

// {{levelPercent level}} — "expert" → 95, "advanced" → 80, etc.
Handlebars.registerHelper("levelPercent", function (level) {
  var map = { expert: 95, advanced: 80, intermediate: 60, beginner: 35 };
  return map[String(level || "").toLowerCase()] || 50;
});

// {{#has value}}...{{else}}...{{/has}} — truthy check for arrays, strings, objects
Handlebars.registerHelper("has", function (v, options) {
  var truthy = false;
  if (v == null) truthy = false;
  else if (Array.isArray(v)) truthy = v.length > 0;
  else if (typeof v === "string") truthy = v.trim().length > 0;
  else if (typeof v === "object") truthy = Object.keys(v).length > 0;
  else truthy = !!v;
  return truthy ? options.fn(this) : options.inverse(this);
});

// {{stripProtocol url}} — "https://janedoe.dev" → "janedoe.dev"
Handlebars.registerHelper("stripProtocol", function (url) {
  return String(url || "").replace(/^https?:\/\//, "");
});

// {{@index}} is built into Handlebars {{#each}} (0-based)
// {{@first}} and {{@last}} are also built-in

// ──────────────────────────────────────────────
// Prepare template context
// ──────────────────────────────────────────────

function buildContext(profile) {
  var p = profile.personal || {};
  var contact = p.contact || {};
  var location = p.location || {};
  var social = p.social || {};

  var displayName = p.displayName || [p.firstName, p.lastName].filter(Boolean).join(" ") || "Your Name";

  var locParts = [location.city, location.state, location.country].filter(Boolean);
  var locationStr = locParts.join(", ");
  if (location.remote && locationStr) locationStr += " (Remote)";
  else if (location.remote) locationStr = "Remote";

  var socialLinks = Object.entries(social)
    .filter(function (entry) { return entry[1] && String(entry[1]).trim(); })
    .map(function (entry) {
      var key = entry[0], url = entry[1];
      var labels = {
        github: "GitHub", linkedin: "LinkedIn", twitter: "Twitter / X",
        youtube: "YouTube", blog: "Blog", stackoverflow: "Stack Overflow",
        dribbble: "Dribbble", behance: "Behance", medium: "Medium", devto: "DEV.to"
      };
      return { key: key, url: url, label: labels[key] || key };
    });

  return {
    // Raw profile sections (arrays, objects)
    personal: p,
    summary: profile.summary || "",
    skills: profile.skills || [],
    experience: profile.experience || [],
    education: profile.education || [],
    projects: profile.projects || [],
    certifications: profile.certifications || [],
    publications: profile.publications || [],
    talks: profile.talks || [],
    awards: profile.awards || [],
    testimonials: profile.testimonials || [],
    languages: profile.languages || [],
    volunteer: profile.volunteer || [],
    interests: profile.interests || [],

    // Computed convenience fields
    displayName: displayName,
    title: p.title || "",
    headline: p.headline || "",
    bio: p.bio || "",
    photo: p.photo || "",
    email: contact.email || "",
    phone: contact.phone || "",
    website: contact.website || "",
    locationStr: locationStr,
    isRemote: !!location.remote,
    socialLinks: socialLinks,

    // Meta
    toolsUrl: "https://github.com/praveenscience/One-File-Tools",
    siteUrl: "https://one-file-tools.pages.dev"
  };
}

// ──────────────────────────────────────────────
// Discover and process templates
// ──────────────────────────────────────────────

var themeDirs = [
  path.join(__dirname, "resume", "themes"),
  path.join(__dirname, "portfolio", "themes")
];

var ctx = buildContext(profile);
var count = 0;

themeDirs.forEach(function (dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    return;
  }

  var files = fs.readdirSync(dir).filter(function (f) { return f.endsWith(".hbs"); });

  files.forEach(function (file) {
    var templatePath = path.join(dir, file);
    var source = fs.readFileSync(templatePath, "utf-8");
    var template = Handlebars.compile(source);
    var html = template(ctx);
    var outName = file.replace(/\.hbs$/, ".html");
    var outPath = path.join(dir, outName);
    fs.writeFileSync(outPath, html, "utf-8");
    console.log("  Built " + path.relative(__dirname, outPath));
    count++;
  });
});

if (count > 0) {
  console.log("\nGenerated " + count + " theme" + (count === 1 ? "" : "s") + " from profile.json.");
} else {
  console.log("No .hbs template files found in resume/themes/ or portfolio/themes/.");
}

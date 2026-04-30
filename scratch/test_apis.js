const BASE_URL = 'http://localhost:5005/api';

async function safeFetch(url, options) {
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      return { error: 'Invalid JSON', body: text };
    }
  } catch (err) {
    return { error: 'Fetch failed', message: err.message };
  }
}

async function testAdmin() {
  const results = [];

  // 1. Signup
  const signupData = await safeFetch(`${BASE_URL}/admin/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: "Super Admin",
      email: `admin_${Date.now()}@example.com`,
      phone: `9${Math.floor(Math.random()*1000000000)}`,
      panNumber: `ABCDE${Math.floor(1000+Math.random()*9000)}F`,
      address: "Kolkata, WB",
      password: "AdminPass@123",
      signupSecret: "macclouspine@admin2026"
    })
  });
  results.push({ endpoint: '/admin/signup', method: 'POST', response: signupData });

  if (!signupData.success) return results;
  const admId = signupData.data.admId;

  // 2. Login
  const loginData = await safeFetch(`${BASE_URL}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ admId, password: "AdminPass@123" })
  });
  results.push({ endpoint: '/admin/login', method: 'POST', response: loginData });

  if (!loginData.token) return results;
  const token = loginData.token;

  // 3. Seed Fees
  const seedData = await safeFetch(`${BASE_URL}/admin/fee-policies/seed`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  results.push({ endpoint: '/admin/fee-policies/seed', method: 'POST', response: seedData });

  // 4. Get Categories
  const catData = await safeFetch(`${BASE_URL}/admin/categories`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  results.push({ endpoint: '/admin/categories', method: 'GET', response: catData });

  return results;
}

async function testAdvocate() {
  const results = [];

  // 1. Signup
  const signupData = await safeFetch(`${BASE_URL}/advocate/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: "Advocate Arjun",
      email: `arjun_${Date.now()}@law.com`,
      phone: `8${Math.floor(Math.random()*1000000000)}`,
      state: "DELHI",
      password: "AdvPass@123",
      yearsOfExperience: 4
    })
  });
  results.push({ endpoint: '/advocate/signup', method: 'POST', response: signupData });

  if (!signupData.token) return results;
  const token = signupData.token;

  // 2. Get Fees
  const feesData = await safeFetch(`${BASE_URL}/advocate/fees`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  results.push({ endpoint: '/advocate/fees', method: 'GET', response: feesData });

  // 3. Update Fees
  const updateData = await safeFetch(`${BASE_URL}/advocate/fees`, {
    method: 'PATCH',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ feesPerSitting: 950 })
  });
  results.push({ endpoint: '/advocate/fees', method: 'PATCH', response: updateData });

  return results;
}

async function testClient() {
  const results = [];

  // 1. Signup
  const signupData = await safeFetch(`${BASE_URL}/user/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: "Rahul Client",
      phone: `7${Math.floor(1000000000 + Math.random()*8999999999)}`,
      email: `rahul_${Date.now()}@client.com`,
      govId: `${Math.floor(100000000000 + Math.random()*899999999999)}`,
      password: "ClientPass@123"
    })
  });
  results.push({ endpoint: '/user/signup', method: 'POST', response: signupData });

  if (!signupData.token) return results;
  const token = signupData.token;

  // 2. Get Profile
  const profileData = await safeFetch(`${BASE_URL}/user/profile`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  results.push({ endpoint: '/user/profile', method: 'GET', response: profileData });

  return results;
}

function formatMarkdown(title, results) {
  let md = `# ${title} API Test Results\n\n`;
  results.forEach(res => {
    md += `### ${res.method} ${res.endpoint}\n`;
    md += "```json\n" + JSON.stringify(res.response, null, 2) + "\n```\n\n";
  });
  return md;
}

const fs = require('fs');

async function runAll() {
  const admin = await testAdmin();
  fs.writeFileSync('AdminAPITests.md', formatMarkdown('Admin', admin));
  console.log('Admin tests done');

  const advocate = await testAdvocate();
  fs.writeFileSync('AdvocateAPITests.md', formatMarkdown('Advocate', advocate));
  console.log('Advocate tests done');

  const client = await testClient();
  fs.writeFileSync('ClientAPITests.md', formatMarkdown('Client', client));
  console.log('Client tests done');
}

runAll();

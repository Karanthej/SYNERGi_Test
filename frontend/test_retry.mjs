async function runTest() {
  const baseUrl = "http://localhost:8080/api/v1";
  const fEmail = `retry@example.com`;

  console.log("Registering first time...");
  let fRegRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName: "Test Pending", email: fEmail, password: "Password123!", role: "FOUNDER" })
  });
  console.log("Register Response 1:", fRegRes.status, await fRegRes.text());
  
  console.log("Registering second time...");
  fRegRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName: "Test Pending", email: fEmail, password: "Password123!", role: "FOUNDER" })
  });
  console.log("Register Response 2:", fRegRes.status, await fRegRes.text());
}
runTest();

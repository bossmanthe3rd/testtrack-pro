async function run() {
  try {
    const res = await fetch("http://localhost:5000/api/test-suites", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer TEST_TOKEN_IGNORE_SINCE_WE_CANT_GET_ONE" },
      body: JSON.stringify({ name: "helloo", description: "", projectId: "4bb5bff1-8d0d-44b5-a519-2251b3c17c21" })
    });
    console.log("STATUS:", res.status);
    console.log("TEXT:", await res.text());
  } catch (err) {
    console.error("FAIL:", err);
  }
}
run();

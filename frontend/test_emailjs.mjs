const serviceId = "service_0z3k99j";
const templateId = "template_qujtus5";
const publicKey = "Z_e1tdpc0pMZmMdbb";

const data = {
  service_id: serviceId,
  template_id: templateId,
  user_id: publicKey,
  template_params: {
    to_email: "test@example.com",
    to_name: "Test User",
    otp: "123456"
  }
};

fetch("https://api.emailjs.com/api/v1.0/email/send", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(data)
})
.then(res => {
  console.log("Status:", res.status);
  return res.text();
})
.then(text => console.log("Response:", text))
.catch(err => console.error("Error:", err));

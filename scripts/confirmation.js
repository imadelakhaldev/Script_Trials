const url = "https://studio.twilio.com/v2/Flows/FW46362acc9a6ac99227ac695bba126012/Executions";

const data = {
  "To": "+212657099585", // Corresponds to {{contact.channel.address}}
  "From": "+15799002367", // Corresponds to {{flow.channel.address}}
  "Parameters": {
    "intro": "This is a call to confirm the account transfer to the holder of this phone number, please press 1 to confirm, or end this call to deny",
    "outro": "Thank you for verification",
    "message": "Thank you for verification"
  }
};

const body = new URLSearchParams();
body.append('To', data.To);
body.append('From', data.From);
body.append('Parameters', JSON.stringify(data.Parameters));

// Replace with your Account SID and Auth Token
const username = 'test'; // Your Account SID
const password = 'test'; // Your Auth Token

fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': 'Basic ' + Buffer.from(username + ':' + password).toString('base64')
  },
  body: body
})
.then(response => response.json())
.then(data => {
  console.log('Success:', data);
})
.catch((error) => {
  console.error('Error:', error);
});

document.getElementById("sendButton").addEventListener("click", function () {
    const fileInput = document.getElementById("fileInput");
    const messageBox = document.getElementById("messageBox").value.trim();

    // Validate inputs
    if (!fileInput.files.length) {
        alert("Please upload a file.");
        return;
    }

    if (!messageBox) {
        alert("Please enter a message.");
        return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("message", messageBox);

    console.log("Uploading file...");

    // Upload the file to the server
    fetch("http://127.0.0.1:8000/api/upload/", {
        method: "POST",
        body: formData,
    })
        .then(response => {
            console.log("File Upload Response:", response);
            if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
            return response.json();
        })
        .then(data => {
            if (data.success) {
                console.log("Upload Success:", data);
                sendMessagesFromFile(data.file_path, messageBox); // Process the uploaded file
            } else {
                alert(`File upload failed: ${data.message}`);
            }
        })
        .catch(error => {
            console.error("Error uploading file:", error);
            alert("An error occurred while uploading the file.");
        });
});

function sendMessagesFromFile(filePath, message) {
    const fullPath = `http://127.0.0.1:8000${filePath}`;
    console.log("Fetching file from URL:", fullPath);

    fetch(fullPath)
    .then(response => {
        if (!response.ok) throw new Error(`Error fetching file: ${response.status} - ${response.statusText}`);
        return response.arrayBuffer();
    })
    .then(data => {
        console.log("File data:", data);
        const contacts = parseFile(filePath, data);
        if (contacts.length) {
            sendMessages(contacts, message);
        } else {
            alert("No valid phone numbers found.");
        }
    })
    .catch(error => {
        console.error("File fetch error:", error);
        alert("Error reading file.");
    });

}

function parseFile(fileName, data) {
    const fileExtension = fileName.split(".").pop().toLowerCase();
    let contacts = []; // Store validated contacts

    try {
        if (fileExtension === "csv") {
            const textData = new TextDecoder().decode(data);
            const rows = textData.split("\n");
            const headers = rows[0].split(","); // Extract header row
            const phoneIndex = headers.findIndex(h => h.trim().toLowerCase().includes("phone"));
            const mobileIndex = headers.findIndex(h => h.trim().toLowerCase().includes("mobile"));

            rows.slice(1).forEach(row => {
                const columns = row.split(",");
                if (phoneIndex !== -1) {
                    const phone = columns[phoneIndex]?.trim();
                    if (phone) {
                        const validated = validatePhoneNumber(phone);
                        if (validated.isValid) {
                            contacts.push(validated.number);
                        }
                    }
                }
                if (mobileIndex !== -1) {
                    const mobile = columns[mobileIndex]?.trim();
                    if (mobile) {
                        const validated = validatePhoneNumber(mobile);
                        if (validated.isValid) {
                            contacts.push(validated.number);
                        }
                    }
                }
            });
        } else if (fileExtension === "xlsx") {
            const workbook = XLSX.read(new Uint8Array(data), { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });

            jsonData.forEach((row, index) => {
                // Try to extract "Phone" and "Mobile Number" fields
                const phone = row["Phone"] || row["Mobile Number"];
                if (phone) {
                    console.log(`Row ${index}: Extracted phone: ${phone}`);
                    const validated = validatePhoneNumber(phone);
                    if (validated.isValid) {
                        contacts.push(validated.number);
                    }
                } else {
                    console.warn(`Row ${index} is missing "Phone" or "Mobile Number".`, row);
                }
            });
        }
    } catch (error) {
        console.error("Error parsing file:", error);
        alert("Error parsing the uploaded file.");
    }

    return contacts.filter(contact => contact);
}


function validatePhoneNumber(phone) {
    const formattedNumber = phone.replace(/[^\d]/g, '');
    console.log("Formatted Phone:", formattedNumber);

    if (formattedNumber.length === 10) {
        return { number: `+91${formattedNumber}`, isValid: true };
    }

    return { number: formattedNumber, isValid: formattedNumber.startsWith('+') && formattedNumber.length >= 13 };
}
function sendMessagesSequentially(contacts, message) {
    if (!contacts.length) {
        alert("No valid contacts found.");
        return;
    }

    const baseUrl = "https://web.whatsapp.com/send"; // Correct WhatsApp Web URL format
    const encodedMessage = encodeURIComponent(message);
    
    // Open WhatsApp Web in a new tab
    const whatsappTab = window.open("", "_blank");

    if (!whatsappTab) {
        alert("Pop-up blocked! Please enable pop-ups for this site.");
        return;
    }

    let currentContactIndex = 0;

    // Function to send messages one by one
    function sendNextMessage() {
        if (currentContactIndex >= contacts.length) {
            alert("All messages sent! Check WhatsApp.");
            whatsappTab.close();
            return;
        }

        const contact = contacts[currentContactIndex];
        const whatsappUrl = `${baseUrl}?phone=${contact}&text=${encodedMessage}`;
        console.log(`Sending message to ${contact}: ${whatsappUrl}`);

        whatsappTab.location.href = whatsappUrl;

        currentContactIndex++;
        setTimeout(sendNextMessage, 5000); // Wait 5 seconds before sending the next message
    }

    // Start the sequential message sending
    sendNextMessage();
}

function sendMessages(contacts, message) {
    if (!contacts.length) {
        alert("No valid contacts found.");
        return;
    }

    const baseUrl = "https://web.whatsapp.com/send";  // Correct URL for WhatsApp Web
    const encodedMessage = encodeURIComponent(message);

    // Loop through contacts and send a message to each one
    contacts.forEach(contact => {
        const whatsappUrl = `${baseUrl}?phone=${contact}&text=${encodedMessage}`;
        console.log(`Sending message to ${contact}: ${whatsappUrl}`);
        window.open(whatsappUrl, "_blank");
    });

    alert(`Messages for ${contacts.length} numbers sent. Check the WhatsApp tabs.`);
}

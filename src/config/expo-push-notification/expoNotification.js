// src/config/expo-push-notification/expoNotification.js
const { Expo } = require("expo-server-sdk");

// Create a new Expo SDK client
let expo = new Expo();

async function sendNotificationToSingleUser(
  token,
  message,
  title = "Notification",
  type = ""
) {
  if (!Expo.isExpoPushToken(token)) {
    console.warn("Invalid Expo token:", token);
    return { success: false, message: "Invalid Expo push token" };
  }
  const messages = [
    {
      to: token,
      sound: "default",
      title,
      body: message,
      data: {
        image:
          "https://res.cloudinary.com/dvlqwoxvj/image/upload/v1756900537/favicon_ybguu8.png",
        type,
      },
    },
  ];

  try {
    const receipts = await expo.sendPushNotificationsAsync(messages);

    // Log errors if any
    receipts.forEach((receipt) => {
      if (receipt.status !== "ok") {
        console.error("Notification failed:", receipt);
      }
    });

    return { success: true, message: "Notification sent", receipts };
  } catch (error) {
    console.error("Error sending notification:", error);
    return { success: false, message: error.message, error };
  }
}

async function sentNotificationToMultipleUsers(
  tokens,
  message,
  title = "Notification",
  type = ""
) {
  if (!tokens || !tokens.length) {
    return { success: false, message: "No tokens provided" };
  }

  // Filter valid tokens
  const validTokens = tokens.filter((token) => Expo.isExpoPushToken(token));
  if (!validTokens.length) {
    return { success: false, message: "No valid Expo tokens" };
  }

  // Create messages
  const messages = validTokens.map((token) => ({
    to: token,
    sound: "default",
    title,
    subtitle: type,
    body: message,
    data: {
      image:
        "https://res.cloudinary.com/dvlqwoxvj/image/upload/v1756900537/favicon_ybguu8.png",
      type,
    },
  }));
  console.log("mess", messages);
  let allTickets = [];
  try {
    // Expo recommends chunking (100 tokens max per request)
    const chunks = expo.chunkPushNotifications(messages);

    for (let chunk of chunks) {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      allTickets.push(...tickets);

      tickets.forEach((ticket) => {
        if (ticket.status !== "ok") {
          console.error("❌ Notification failed:", ticket);
        }
      });
    }

    return {
      success: true,
      message: "Notifications sent",
      tickets: allTickets,
    };
  } catch (error) {
    console.error("❌ Error sending notifications:", error);
    return { success: false, message: error.message, error };
  }
}

module.exports = {
  sendNotificationToSingleUser,
  sentNotificationToMultipleUsers,
};

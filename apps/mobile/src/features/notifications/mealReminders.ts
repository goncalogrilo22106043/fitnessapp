import * as Notifications from "expo-notifications";

export async function requestMealReminderPermission() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    return true;
  }

  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
}

export async function scheduleGentleMealReminder(hour: number, minute: number) {
  const granted = await requestMealReminderPermission();
  if (!granted) {
    return null;
  }

  return Notifications.scheduleNotificationAsync({
    content: {
      title: "Rotina",
      body: "Tens uma refeicao pronta para adaptar ao teu dia."
    },
    trigger: {
      hour,
      minute,
      repeats: true
    }
  });
}

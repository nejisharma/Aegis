// Custom entry: keep Expo Router's entry and register the Android widget headless task.
// (react-native-android-widget docs: "Using with Expo Router" → custom index + package.json "main".)
import 'expo-router/entry';
import { Platform } from 'react-native';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { widgetTaskHandler } from './src/widgets/widgetTaskHandler';

if (Platform.OS === 'android') registerWidgetTaskHandler(widgetTaskHandler);
